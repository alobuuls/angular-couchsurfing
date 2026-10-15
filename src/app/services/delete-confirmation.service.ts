import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

// Services
import { AlertsService } from '@services/alerts.service';

// Interfaces
import { IGuestListItem } from '@interfaces/guests.interface';

// Utils
import { isGroup } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class GuestDeleteService {
  private _alerts = inject(AlertsService);
  private _translate = inject(TranslateService);

  async confirmAndDelete(guest: IGuestListItem, deleteFn: (guest: IGuestListItem) => Observable<unknown>): Promise<boolean> {
    const group = isGroup(guest);
    const fullname = group ? guest.members[0].fullName : guest.fullName;

    // First confirmation
    const first = await this._alerts.showAlert({
      icon: 'question',
      title: '',
      html: this._translate.instant('ALERTS.DELETE_GUEST.CONFIRMATION.MESSAGE'),
      confirmText: this._translate.instant('ALERTS.DELETE_GUEST.CONFIRMATION.CONFIRM_BUTTON'),
      showCancelButton: false,
    });

    if (!first.isConfirmed) return false;

    // Warning
    const second = await this._alerts.showAlert({
      icon: 'warning',
      title: this._translate.instant('ALERTS.DELETE_GUEST.WARNING.TITLE'),
      html: this._translate.instant('ALERTS.DELETE_GUEST.WARNING.MESSAGE', { name: fullname }),
      confirmText: this._translate.instant('ALERTS.DELETE_GUEST.WARNING.CONFIRM_BUTTON'),
      showCancelButton: false,
    });

    if (!second.isConfirmed) return false;

    // Type fullname to confirm
    const { isConfirmed } = await this._alerts.showDeleteConfirmation(this._translate.instant('ALERTS.DELETE_GUEST.TYPE_TO_CONFIRM.TITLE', { name: fullname }), fullname);

    if (!isConfirmed) return false;

    // Delete
    const request$ = deleteFn(guest);
    await firstValueFrom(request$);

    // Success
    this._alerts.showToast({
      icon: 'success',
      title: this._translate.instant('ALERTS.DELETE_GUEST.SUCCESS.MESSAGE', { name: fullname }),
      time: 6000,
    });

    return true;
  }
}
