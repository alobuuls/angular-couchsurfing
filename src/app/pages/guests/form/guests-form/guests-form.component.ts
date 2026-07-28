import { Component, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren, OnInit, OnChanges } from '@angular/core';

// Interfaces
import { IGroupEdit, IGuestDetail, IGuestsFormSubmit } from '@interfaces/guests.interface';

// Components
import { TripFormComponent } from '@pages/guests/form/trip-form/trip-form.component';
import { GuestFormComponent } from '@pages/guests/form/guest-form/guest-form.component';

// Services
import { AlertsService } from '@services/alerts.service';

@Component({
  selector: 'guests-form',
  templateUrl: './guests-form.component.html',
  styleUrls: ['./guests-form.component.css'],
})
export class GuestsFormComponent implements OnChanges {
  @ViewChild(TripFormComponent) tripFormComponent!: TripFormComponent;
  @ViewChildren(GuestFormComponent) guestForms!: QueryList<GuestFormComponent>;

  @Output() submitForm = new EventEmitter<IGuestsFormSubmit>();

  @Input() guest?: IGuestDetail;
  @Input() group?: IGroupEdit;

  @Input() mode: 'create' | 'edit' = 'create';

  // Group Type
  public selectedGroupType: 'solo' | 'couple' | 'friends' | 'family' | null = null;

  formsToShow = 0;

  // Form
  wasFormSubmitted = false;

  // Add Form
  limitGroupMembers = 5;

  constructor(private _alerts: AlertsService) {}

  ngOnChanges(): void {
    if (this.mode === 'edit') this.loadData();
  }

  private loadData(): void {
    // Solo
    if (this.guest) {
      this.selectGroupType('solo');
      return;
    }

    // Group
    if (this.group) {
      this.selectGroupType(this.group[0].groupType);
      this.formsToShow = this.group.length;
    }
  }

  selectGroupType(type: 'solo' | 'couple' | 'friends' | 'family'): void {
    this.selectedGroupType = type;

    const groupType = {
      solo: 1,
      couple: 2,
      friends: 2,
      family: 2,
      default: 2,
    };

    this.formsToShow = groupType[type] ?? groupType.default;
  }

  submit(): void {
    if (!this.selectedGroupType) return;

    const trip = this.tripFormComponent.getFormValue();
    const guests = this.guestForms.toArray().map(form => form.getFormValue());

    this.submitForm.emit({ groupType: this.selectedGroupType, trip, guests });
  }

  addGuestForm(): void {
    if (this.formsToShow >= this.limitGroupMembers) {
      this._alerts.showToast({ icon: 'warning', title: 'You can add max 5 members' });
      return;
    }

    this.formsToShow++;
  }
}
