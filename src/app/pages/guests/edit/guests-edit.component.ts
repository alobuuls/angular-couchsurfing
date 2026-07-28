import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@services/alerts.service';
import { Router } from '@angular/router';

// Interfaces
import { IBodyGuest, IGroupDetail, IGroupEdit, IGuestDetail, IGuestsFormSubmit } from '@interfaces/guests.interface';

@Component({
  selector: 'guests-edit',
  templateUrl: './guests-edit.component.html',
  styleUrls: ['./guests-edit.component.css'],
})
export class GuestsEditComponent implements OnInit {
  guest?: IGuestDetail;
  group?: IGroupEdit;

  constructor(
    private _guests: GuestsService,
    private _alerts: AlertsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('guestId');
    const groupId = this.route.snapshot.paramMap.get('groupId');

    if (groupId) {
      this._guests.getGroupById(groupId).subscribe(resp => {
        this.group = resp.data;
      });
      return;
    }

    if (guestId) {
      this._guests.getGuestById(guestId).subscribe(resp => {
        this.guest = resp.data;
      });
    }
  }

  update(data: IGuestsFormSubmit): void {
    // Solo
    if (data.groupType === 'solo') {
      if (!this.guest) {
        return;
      }

      const payload: IBodyGuest = {
        ...data.trip,
        ...data.guests[0],
      };

      this._guests.updateGuestById(this.guest.guestId, payload).subscribe({
        next: () => {
          this._alerts.showToast({ icon: 'success', title: 'Guest updated successfully' });
          this.router.navigateByUrl('/guests');
        },
        error: () => this._alerts.showToast({ icon: 'error', title: 'Error updating guest' }),
      });
      return;
    }

    // Group
    if (!this.group) return;

    const payload: IGroupDetail = {
      groupId: this.group[0].groupId,
      groupType: data.groupType,
      ...data.trip,
      members: data.guests,
    };

    this._guests.updateGroupById(this.group[0].guestId, payload).subscribe({
      next: () => {
        this._alerts.showToast({ icon: 'success', title: 'Guest updated successfully' });
        this.router.navigateByUrl('/guests');
      },
      error: () => this._alerts.showToast({ icon: 'error', title: 'Error updating guest' }),
    });
  }
}
