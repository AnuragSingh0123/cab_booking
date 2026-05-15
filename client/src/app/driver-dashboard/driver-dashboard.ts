import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

import { DriverService } from '../driver-service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.css',
})
export class DriverDashboard implements OnInit, OnDestroy {
  private driverService = inject(DriverService);

  reviews = signal<any[]>([]);
  activeRide = signal<any | null>(null);
  availableRide = signal<any | null>(null);

  driver = signal({
    id: '',
    name: '',
    email: '',
    vehicle: '',
    vehicleNo: '',
    rating: 0,
    online: true,
  });

  stats = signal({
    trips: 0,
    earnings: 0,
    distance: 0,
    hours: 0,
  });

  private sub?: Subscription;

  ngOnInit() {
    this.loadUser();
    this.refresh();

    this.sub = interval(500).subscribe(() => {
      this.refresh();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  getAverageRating(): number {
    const list = this.reviews();

    if (!list.length) return 0;

    const total = list.reduce((sum, r) => sum + r.rating, 0);

    return total / list.length;
  }

  loadUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    this.driver.update(driver => ({
      ...driver,
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
    }));
  }

  refresh() {
    this.driverService.getDriverDashboard().subscribe({
      next: (data: any) => {
        this.reviews.set(data?.reviews ?? []);

        const availableRide = data?.availableRide ?? null;

        if (
          availableRide &&
          this.driver().vehicle &&
          availableRide.vehicle &&
          this.driver().vehicle.toLowerCase() ===
            availableRide.vehicle.toLowerCase()
        ) {
          this.availableRide.set(availableRide);
        } else {
          this.availableRide.set(null);
        }

        this.activeRide.set(data?.activeRide ?? null);

        this.driver.update(d => ({
          ...d,
          vehicle: data?.driver?.vehicleType ?? '',
          vehicleNo: data?.driver?.vehicleNumber ?? '',
          rating: data?.driver?.rating ?? 0,
          online: data?.driver?.online ?? true,
        }));

        this.stats.set({
          trips: data?.stats?.trips ?? 0,
          earnings: data?.stats?.earnings ?? 0,
          distance: data?.stats?.distance ?? 0,
          hours: data?.stats?.hours ?? 0,
        });
      },
      error: err => {
        console.log('dashboard error', err);
      },
    });
  }

  setAvailableRide(ride: any) {
    const driverVehicle = this.driver().vehicle?.toLowerCase();
    const rideVehicle = ride?.vehicle?.toLowerCase();

    const matched =
      ride &&
      driverVehicle &&
      rideVehicle &&
      driverVehicle === rideVehicle;

    this.availableRide.set(matched ? ride : null);
  }

  toggleStatus() {
    this.driverService.toggleDriverStatus().subscribe({
      next: () => this.refresh(),
      error: err => console.log(err),
    });
  }

  acceptRide() {
    const rideId = this.availableRide()?._id;

    if (!rideId) return;

    this.driverService.acceptRide(rideId).subscribe({
      error: err => console.log(err),
    });
  }

  startRide() {
    const rideId = this.activeRide()?._id;

    if (!rideId) return;

    this.driverService.startRide(rideId).subscribe({
      error: err => console.log(err),
    });
  }

  completeRide() {
    const rideId = this.activeRide()?._id;

    if (!rideId) return;

    this.driverService.completeRide(rideId).subscribe({
      error: err => console.log(err),
    });
  }

  rejectRide() {
    this.availableRide.set(null);
  }
}