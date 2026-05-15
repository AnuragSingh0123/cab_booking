import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { PopupService } from '../popup-service';
import { RideService } from '../ride-service';

@Component({
  selector: 'app-ride-success',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ride-success.html',
  styleUrl: './ride-success.css',
})
export class RideSuccess implements OnInit, OnDestroy {
  private router = inject(Router);
  private rideService = inject(RideService);
  private notify = inject(PopupService);

  activeRide = signal<any>(null);
  progress = signal(100);
  rating = signal(0);

  feedbackText = '';

  private sub?: Subscription;

  ngOnInit() {
    const booking = history.state.booking;

    if (!booking) {
      this.goHome();
      return;
    }

    this.activeRide.set(booking);

    this.sub = interval(500).subscribe(() => {
      this.updateRide();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  updateRide() {
    const ride = this.activeRide();
    

    if (!ride) return;

    const createdTime = new Date(ride.createdAt).getTime();
    const expiryTime = createdTime + 10 * 60 * 1000;

    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {
      this.progress.set(0);
      this.cancelRide();
      return;
    }

    const totalDuration = 10 * 60 * 1000;

    this.progress.set((remaining / totalDuration) * 100);

    this.rideService.bookingProgress(ride._id).subscribe({
      next: (res: any) => {
        this.activeRide.update(current => ({
          ...current,
          ...res.booking,
          driver: res.driver,
        }));
      },
    });
  }

  cancelRide() {
    const rideId = this.activeRide()?._id;

    if (!rideId) return;

    this.rideService
      .cancelBooking(rideId, { status: 'cancelled' })
      .subscribe((updated: any) => {
        this.activeRide.set(updated);
      });
  }

  setRating(stars: number) {
    this.rating.set(stars);
  }

  submitFeedback() {
    const ride = this.activeRide();

    if (!ride) return;

    const payload = {
      bookingId: ride._id,
      driverId: ride.driverId,
      rating: this.rating(),
      feedback: this.feedbackText,
    };

    this.rideService.submitFeedback(payload).subscribe({
      next: () => {
        this.notify.show('Feedback Submitted');
        this.resetBooking();
        this.goHome();
      },
      error: () => {
        console.log('Error occurred');
      },
    });
  }

  resetBooking() {
    this.rideService.booking.set({
      pickup: '',
      drop: '',
      distance: 0,
      duration: 0,
      fare: 0,
      gst: 0,
      total: 0,
      vehicle: '',
    });
  }

  goHome() {
    this.resetBooking();
    this.router.navigate(['/']);
  }
}