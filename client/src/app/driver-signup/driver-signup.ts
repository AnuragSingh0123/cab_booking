import { Component, inject } from '@angular/core';
import { PopupService } from '../popup-service';
import { LocationService } from '../location-service';
import { GeoService } from '../geo-service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth-service';
import { debounceTime, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-driver-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './driver-signup.html',
  styleUrl: './driver-signup.css',
})
export class DriverSignup {

  notify = inject(PopupService);

  locationService = inject(LocationService);

  geoService = inject(GeoService);

  router = inject(Router);

  formBuilder = inject(FormBuilder);

  authService = inject(AuthService);

  signUpForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],

    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(6)]],

    confirmPassword: ['', [Validators.required]],

    driverLocation: ['', [Validators.required]],

    licenseNumber: ['', [Validators.required]],

    vehicleType: ['', [Validators.required]],

    vehicleNumber: ['', [Validators.required]],
  });

  currentAddressSuggestions: any[] = [];

  driverCoordinates: number[] | null = null;

  ngOnInit() {

    const user = localStorage.getItem('user');

    if (user) {
      this.router.navigate(['/']);
    }

    this.signUpForm
      .get('driverLocation')
      ?.valueChanges.pipe(
        debounceTime(300),

        switchMap(value => {

          if (!value || value.trim().length < 3) {
            return of([]);
          }

          return this.locationService.searchLocation(value);
        })
      )
      .subscribe((res: any) => {
        this.currentAddressSuggestions = res || [];
      });
  }

  selectAddress(place: any) {

    this.signUpForm.patchValue(
  {
    driverLocation: place.display_name,
  },
  {
    emitEvent: false,
  }
);

    this.geoService.getCoordinates(place).subscribe({
      next: (coordinates: any) => {

        this.driverCoordinates = [
          +coordinates[0].lat,
          +coordinates[0].lon,
        ];

        console.log(
          'Coordinates set:',
          this.driverCoordinates
        );
      },

      error: err => {

        console.error(
          'Error fetching coordinates:',
          err
        );

        this.notify.show(
          'Failed to get location details.'
        );
      },
    });

    this.currentAddressSuggestions = [];
  }

  hideSuggestions() {

    setTimeout(() => {
      this.currentAddressSuggestions = [];
    }, 200);
  }

  signup() {

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    if (
      this.signUpForm.value.password !==
      this.signUpForm.value.confirmPassword
    ) {
      this.notify.show('Passwords do not match');

      return;
    }

    const { confirmPassword, ...formValues } =
      this.signUpForm.value;

    const formData = {
      ...formValues,

      role: 'driver',

      driverCoordinates: this.driverCoordinates,
    };

    this.authService.signUp(formData).subscribe({
      next: res => {

        console.log(res);

        this.notify.show(
          'Registration Successful'
        );

        this.router.navigate(['/login']);
      },

      error: err => {

        console.log(err);

        this.notify.show(
          'Error while registration. Please try again later'
        );
      },
    });
  }
}
