import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  http = inject(HttpClient);
  router=inject(Router);

  user = signal<any | null>(this.getUserFromStorage());
  token = signal<string | null>(this.getTokenFromStorage());

  isLoggedIn = computed(() => !!this.token());
  role = computed(() => this.user()?.role);


  login(data: any) {
    console.log(data);
    return this.http.post('http://localhost:7000/auth/login', data, {
      withCredentials:true
    });
  }

  signUp(userData: any) {
  return this.http.post("http://localhost:7000/auth/sign-up", userData);
}


  setSession(res: any) {
    localStorage.setItem('user', JSON.stringify(res.user));
    localStorage.setItem('token', res.token);

    this.user.set(res.user);
    this.token.set(res.token);
  }


  // logout() {
  //   localStorage.removeItem('user');
  //   localStorage.removeItem('token');

  //   this.user.set(null);
  //   this.token.set(null);
  //   this.router.navigate(["/"]);
  // }

  logout() {

    this.http.post('http://localhost:7000/auth/logout', {}).subscribe({
      next: (response) => {
        console.log('Backend cookie cleared successfully');
        this.router.navigate(["/"]);
      },
      error: (err) => {
        console.error('Logout API failed, clearing local state anyway', err);
      }
    });
  }

  private getUserFromStorage() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  private getTokenFromStorage() {
    return localStorage.getItem('token');
  }
}