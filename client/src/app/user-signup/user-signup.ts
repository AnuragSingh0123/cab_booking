import { Component, inject } from '@angular/core';
import { PopupService } from '../popup-service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth-service';

@Component({
  selector: 'app-user-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './user-signup.html',
  styleUrl: './user-signup.css',
})

export class UserSignup {

  notify = inject(PopupService);
  router = inject(Router);

  formBuilder = inject(FormBuilder);
  authService = inject(AuthService);

  signUpForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit() {
    const user = localStorage.getItem('user');

    if (user) {
      this.router.navigate(['/']);
    }
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
      role: 'rider',
    };

    this.authService.signUp(formData).subscribe({
      next: res => {
        console.log(res);

        this.notify.show('Registration Successful');

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
