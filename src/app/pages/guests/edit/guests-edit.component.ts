import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { finalize, switchMap } from 'rxjs';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@core/services/alerts.service';
import { TranslateService } from '@ngx-translate/core';

// Interfaces
import { IGroupCreatePayload, IGroupEdit, IGroupUpdatePayload, IGuestCreatePayload, IGuestDetail } from '@interfaces/guests.interface';
import { IGuestsFormSubmit } from '@interfaces/guest-form.interface';

@Component({
  selector: 'guests-edit',
  templateUrl: './guests-edit.component.html',
  styleUrls: ['./guests-edit.component.css'],
})
export class GuestsEditComponent implements OnInit {
  guest?: IGuestDetail;
  group?: IGroupEdit;
  groupId?: string;

  isLoading = true;
  isUpdating = false;

  private location = inject(Location);
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

      this._guests
        .getGroupById(groupId)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(resp => {
          this.group = resp.data;
        });

      return;
    }

    if (guestId) {
      this._guests
        .getGuestById(guestId)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(resp => {
          this.guest = resp.data;
        });

      return;
    }

    this.isLoading = false;
  }

  cancelEdit(): void {
    this.location.back();
  }
  // ALERTS NOTIFICATIONS
  private showToast(icon: 'success' | 'error', title: string): void {
    this._alerts.showToast({
      icon,
      title: this._translate.instant(title),
    });
  }

  private showOfflineAlert(): void {
    this._alerts.showAlert({
      icon: 'error',
      title: this._translate.instant('GENERAL.ERROR'),
      html: this._translate.instant('ERRORS.HTTP.502'),
      showCancelButton: false,
      confirmText: this._translate.instant('GENERAL.CLOSE'),
    });
  }

  update(data: IGuestsFormSubmit): void {
    if (this.isUpdating) return;

    // CHECK INTERNET CONNECTION
    if (!navigator.onLine) {
      this.showOfflineAlert();
      return;
    }

    // SOLO → SOLO
    if (this.guest && data.groupType === 'solo') {
      this.updateSolo(data);
      return;
    }

    // SOLO → GROUP
    if (this.guest && data.groupType !== 'solo') {
      this.convertSoloToGroup(data);
      return;
    }

    // GROUP → SOLO
    if (this.group && data.groupType === 'solo') {
      this.convertGroupToSolo(data);
      return;
    }

    // GROUP → GROUP
    if (this.group && data.groupType !== 'solo') {
      this.updateGroup(data);
    }
  }

  private updateSolo(data: IGuestsFormSubmit): void {
    if (!this.guest) return;

    const payload: IGuestCreatePayload = {
      ...data.trip,
      ...data.guests[0],
      groupType: 'solo',
    };

    this.isUpdating = true;

    this._guests
      .updateGuestById(this.guest.guestId, payload)
      .pipe(finalize(() => (this.isUpdating = false)))
      .subscribe(() => {
        this.showToast('success', 'ALERTS.EDIT.GUEST_SUCCESS');
        this.router.navigate(['/guests']);
      });
  }

  private convertSoloToGroup(data: IGuestsFormSubmit): void {
    if (!this.guest || data.groupType === 'solo') return;

    const payload: IGroupCreatePayload = {
      ...data.trip,
      groupType: data.groupType,
      members: data.guests.map(guest => ({
        ...guest,
        groupType: data.groupType as 'couple' | 'friends' | 'family',
      })),
    };

    this.isUpdating = true;

    this._guests
      .createNewGroup(payload)
      .pipe(
        switchMap(() => this._guests.removeGuestById(this.guest!.guestId)),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe(() => {
        this.showToast('success', 'ALERTS.EDIT.GROUP_SUCCESS');
        this.router.navigate(['/guests']);
      });
  }

  private convertGroupToSolo(data: IGuestsFormSubmit): void {
    if (!this.groupId || data.groupType !== 'solo') return;

    const payload: IGuestCreatePayload = {
      ...data.trip,
      ...data.guests[0],
      groupType: 'solo',
    };

    this.isUpdating = true;

    this._guests
      .createNewGuest(payload)
      .pipe(
        switchMap(() => this._guests.removeGroupById(this.groupId!)),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe(() => {
        this.showToast('success', 'ALERTS.EDIT.GUEST_SUCCESS');
        this.router.navigate(['/guests']);
      });
  }

  private updateGroup(data: IGuestsFormSubmit): void {
    if (!this.groupId || data.groupType === 'solo') return;

    const payload: IGroupUpdatePayload = {
      groupId: this.groupId,
      groupType: data.groupType,
      ...data.trip,
      members: data.guests.map(guest => ({
        ...guest,
        groupType: data.groupType as 'couple' | 'friends' | 'family',
      })),
    };

    this.isUpdating = true;

    this._guests
      .updateGroupById(this.groupId, payload)
      .pipe(finalize(() => (this.isUpdating = false)))
      .subscribe(() => {
        this.showToast('success', 'ALERTS.EDIT.GROUP_SUCCESS');
        this.router.navigate(['/guests']);
      });
  }
}
