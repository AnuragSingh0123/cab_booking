import { Component, effect, inject } from '@angular/core';
import { PopupService } from '../popup-service';
import { LocationService } from '../location-service';
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


  router = inject(Router);

  formBuilder = inject(FormBuilder);

  authService = inject(AuthService);

  signUpForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],

    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(6)]],

    confirmPassword: ['', [Validators.required]],

    driverLocation: ['', [Validators.required]],

    licenseNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{13}$/)]],

    vehicleType: ['', [Validators.required]],

    vehicleNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)]],
  });

  currentAddressSuggestions: any[] = [];

  driverCoordinates: number[] | null = null;

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit() {
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
        this.currentAddressSuggestions = res;
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

    this.driverCoordinates = [
      +place.lat,
      +place.lon,
    ];


    this.currentAddressSuggestions = [];
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


        this.notify.show(
          'Registration Successful'
        );

        this.router.navigate(['/login']);
      },

      error: err => {

        this.notify.show( err.error.message ||
          'Error while registration. Please try again later'
        );
      },
    });
  }
}
