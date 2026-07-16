import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Cdk
import { LiveAnnouncer } from '@angular/cdk/a11y';

// Interfaces
import { IGroupMember, IGuestDetail, ITripDetail } from '@interfaces/couchsurfing.interface';

// Services
import { AlertsService } from '@services/alerts.service';

@Component({
  selector: 'app-trip-form',
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.css'],
})
export class TripFormComponent implements OnInit {
  @Input()
  trip?: IGuestDetail | IGroupMember;

  //Form Trip
  formTrip!: FormGroup;

  // Nights
  howManyNights: number = 20;
  nights: number[] = new Array(this.howManyNights).fill(0).map((_, idx) => idx + 1);

  get f() {
    return this.formTrip.controls;
  }

  private readonly destroyRef = inject(DestroyRef);
  constructor(
    private fb: FormBuilder,
    private _alerts: AlertsService,
    private announcer: LiveAnnouncer
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.onStayed();
  }

  initForm(): void {
    this.formTrip = this.fb.group({
      visitedDate: ['', Validators.required],
      stayed: [false],
      nights: [
        {
          value: '',
          disabled: true,
        },
      ],
    });

    if (!this.trip) {
      return;
    }

    this.formTrip.patchValue({
      visitedDate: this.trip.visitedDate,
      stayed: this.trip.stayed,
      nights: this.trip.nights,
    });
  }

  //Format Date
  private formatDate(dateValue: string | Date | null): string {
    if (!dateValue) return '';

    const date = new Date(dateValue);

    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  // Nights
  private onStayed(): void {
    const nightsCtrl = this.formTrip.get('nights');

    this.formTrip
      .get('stayed')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stayed => {
        stayed ? nightsCtrl?.enable() : nightsCtrl?.disable();
      });
  }

  btnSetToday(): void {
    this.formTrip.patchValue({
      visitedDate: new Date(),
    });
  }

  getFormValue(): ITripDetail {
    return this.buildTripPayload();
  }

  // Payload
  private buildTripPayload() {
    const trip = this.formTrip.getRawValue();

    return {
      ...trip,
      visitedDate: this.formatDate(trip.visitedDate),
    };
  }
}
