import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@services/alerts.service';
import { Router } from '@angular/router';

// Interfaces
import { IBodyGuest, IGroupDetail, IGroupEdit, IGuestDetail, IGuestsFormSubmit } from '@interfaces/guests.interface';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'guests-edit',
  templateUrl: './guests-edit.component.html',
  styleUrls: ['./guests-edit.component.css'],
})
export class GuestsEditComponent implements OnInit {
  guest?: IGuestDetail;
  group?: IGroupEdit;
  groupId?: string;

  private _guests = inject(GuestsService);
  private _alerts = inject(AlertsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private _translate = inject(TranslateService);

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('guestId');
    const groupId = this.route.snapshot.paramMap.get('groupId');

    if (groupId) {
      this.groupId = groupId;
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
          this._alerts.showToast({
            icon: 'success',
            title: this._translate.instant('ALERTS.EDIT.GUEST_SUCCESS'),
          });
          this.router.navigateByUrl('/guests');
        },
        error: () =>
          this._alerts.showToast({
            icon: 'error',
            title: this._translate.instant('ALERTS.EDIT.GUEST_ERROR'),
          }),
      });
      return;
    }

    // Group
    if (!this.group || !this.groupId) {
      return;
    }

    const payload: IGroupDetail = {
      groupId: this.groupId,
      groupType: data.groupType,
      ...data.trip,
      members: data.guests,
    };

    this._guests.updateGroupById(this.groupId, payload).subscribe({
      next: () => {
        this._alerts.showToast({
          icon: 'success',
          title: this._translate.instant('ALERTS.EDIT.GROUP_SUCCESS'),
        });
        this.router.navigateByUrl('/guests');
      },
      error: () =>
        this._alerts.showToast({
          icon: 'error',
          title: this._translate.instant('ALERTS.EDIT.GROUP_ERROR'),
        }),
    });
  }
}
