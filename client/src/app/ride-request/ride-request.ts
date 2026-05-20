import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Subject, debounceTime, switchMap, of } from 'rxjs';

import { RideService } from '../ride-service';
import { LocationService } from '../location-service';
import { BuildRouteService } from '../build-route-service';

@Component({
  selector: 'app-ride-request',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ride-request.html',
  styleUrl: './ride-request.css',
})
export class RideRequest {

  router = inject(Router);
  rideService = inject(RideService);
  locationService = inject(LocationService);
  buildRouteService=inject(BuildRouteService);

  pickup = '';
  drop = '';

  pickupSuggestions: any[] = [];
  dropSuggestions: any[] = [];

  message=this.rideService.msg;

  pickupSubject = new Subject<string>();
  dropSubject = new Subject<string>();

  ngOnInit() {

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user?.role === 'driver') {
      this.router.navigate(['/driver-dashboard']);
      return;
    }

    // Pickup Search
    this.pickupSubject.pipe(
      debounceTime(300),
      switchMap(value => {

        if (value.trim().length < 3) {
          return of([]);
        }

        return this.locationService.searchLocation(value);
      })
    )
    .subscribe((res: any) => {
      this.pickupSuggestions = res;
    });

    // Drop Search
    this.dropSubject.pipe(
      debounceTime(300),
      switchMap(value => {

        if (value.trim().length < 3) {
          return of([]);
        }

        return this.locationService.searchLocation(value);
      })
    )
    .subscribe((res: any) => {
      this.dropSuggestions = res || [];
    });
  }

  onPickupChange(value: string) {
    this.pickupSubject.next(value);
  }

  onDropChange(value: string) {
    this.dropSubject.next(value);
  }

  selectPickup(place: any) {
    this.pickup = place.display_name;
    this.pickupSuggestions = [];
  }

  selectDrop(place: any) {
    this.drop = place.display_name;
    this.dropSuggestions = [];
  }

  rideRequest() {

    if (!this.pickup.trim() || !this.drop.trim()) {
      this.rideService.msg.set('Enter pickup and drop location');

    setTimeout(() => {
      this.rideService.msg.set('');
    }, 3000);
      return;
    }

    this.rideService.updateRide({
      pickup: this.pickup,
      drop: this.drop
    });

    this.buildRouteService.buildRoute(this.pickup, this.drop);
    

    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
  }
}