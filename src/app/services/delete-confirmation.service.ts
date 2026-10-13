import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

// Services
import { AlertsService } from '@services/alerts.service';

// Interfaces
import { IGuestListItem } from '@interfaces/guests.interface';

// Utils
import { isGroup } from '@utils';

// Const
import { ALERT_MESSAGES } from '@const/alerts';

@Injectable({
  providedIn: 'root',
})
export class GuestDeleteService {
  constructor(private _alerts: AlertsService) {}

  async confirmAndDelete(guest: IGuestListItem, deleteFn: (guest: IGuestListItem) => Observable<unknown>): Promise<boolean> {
    const group = isGroup(guest);
    const fullname = group ? guest.members[0].fullName : guest.fullName;

    const alerts = ALERT_MESSAGES.deleteGuest;

    // First confirmation
    const first = await this._alerts.showAlert({
      icon: 'question',
      title: '',
      html: alerts.confirmation.message,
      confirmText: alerts.confirmation.confirmButtonText,
      showCancelButton: false,
    });

    if (!first.isConfirmed) return false;

    // Warning
    const second = await this._alerts.showAlert({
      icon: 'warning',
      title: alerts.warning.title,
      html: alerts.warning.message(fullname),
      confirmText: alerts.warning.confirmButtonText,
      showCancelButton: false,
    });

    if (!second.isConfirmed) return false;

    // Type fullname to confirm
    const { isConfirmed } = await this._alerts.showDeleteConfirmation(alerts.typeToConfirm.title(fullname), fullname);

    if (!isConfirmed) return false;

    // Delete
    const request$ = deleteFn(guest);
    await firstValueFrom(request$);

    // Success
    this._alerts.showToast({
      icon: 'success',
      title: alerts.success.message(fullname),
      time: 6000,
    });

    return true;
  }
}
