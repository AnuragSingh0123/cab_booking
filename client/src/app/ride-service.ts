import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RideService {

  http = inject(HttpClient);

  mapLoading = signal(false);
  router=inject(Router);

  msg=signal('');

  booking = signal<any>({
    pickup: '',
    drop: '',
    distance: 0,
    duration: 0,
    fare: 0,
    gst: 0,
    total: 0,
    vehicle: ''
  });

  updateRide(data: any) {
    this.booking.update(old => ({
      ...old,
      ...data
    }));
  }


  bookRide(data: any) {
    
    const token = localStorage.getItem('token');

    return this.http.post(
      'http://localhost:7000/book-ride',
      data,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    );
  }

  cancelBooking(id: string, data: any) {
  const token = localStorage.getItem('token');

  return this.http.patch(
    `http://localhost:7000/booking/${id}`,
    data,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    }
  );
}

  bookingProgress(rideID: string){
    console.log(rideID);
    const token = localStorage.getItem('token');
    
    return this.http.get(`http://localhost:7000/user/booking/${rideID}`);
  }

  submitFeedback(data: any){
    return this.http.post("http://localhost:7000/user/feedback",data);
  }


  getMyBookings() {
  const token = localStorage.getItem('token');

  return this.http.get(
    'http://localhost:7000/my-bookings',
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    }
  );
}

  getProfile() {
  const token = localStorage.getItem('token');

  return this.http.get(
    'http://localhost:7000/profile',
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    }
  );
}

}
