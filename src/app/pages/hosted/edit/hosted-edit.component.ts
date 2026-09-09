import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { HostedService } from '@services/hosted.service';
import { AlertsService } from '@services/alerts.service';
import { Router } from '@angular/router';

// Interfaces
import { IBodyGuest, IGroupDetail, IGroupEdit, IGuestDetail, IGuestsFormSubmit } from '@interfaces/guests.interface';

@Component({
  selector: 'hosted-edit',
  templateUrl: './hosted-edit.component.html',
  styleUrls: ['./hosted-edit.component.css'],
})
export class HostedEditComponent implements OnInit {
  guest?: IGuestDetail;
  group?: IGroupEdit;

  constructor(
    private _hosted: HostedService,
    private _alerts: AlertsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('hostedId');
    if (guestId) this._hosted.getGuestById(guestId).subscribe(resp => (this.guest = resp.data));
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

      this._hosted.updateGuestById(this.guest.guestId, payload).subscribe({
        next: () => {
          this._alerts.showToast({ icon: 'success', title: 'Guest updated successfully' });
          this.router.navigateByUrl('/hosted');
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
  }
}
