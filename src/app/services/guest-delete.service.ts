import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

// Services
import { GuestsService } from '@services/guests.service';
import { GroupsService } from '@services/groups.service';
import { AlertsService } from '@services/alerts.service';

// Interfaces
import { IGuestListItem } from '@interfaces/couchsurfing.interface';

// Utils
import { isGroup } from '@helpers/guests-table.utils';

// Const
import { ALERT_MESSAGES } from '@const/alerts';

@Injectable({
  providedIn: 'root',
})
export class GuestDeleteService {
  constructor(
    private _guests: GuestsService,
    private _groups: GroupsService,
    private _alerts: AlertsService
  ) {}

  async confirmAndDelete(guest: IGuestListItem): Promise<boolean> {
    const group = isGroup(guest);
    const fullname = group ? guest.members[0].fullName : guest.fullName;

    const alerts = ALERT_MESSAGES.deleteGuest;

    const first = await this._alerts.showAlert({
      icon: 'question',
      title: '',
      html: alerts.confirmation.message,
      confirmText: alerts.confirmation.confirmButtonText,
      showCancelButton: false,
    });

    if (!first.isConfirmed) return false;

    const second = await this._alerts.showAlert({
      icon: 'warning',
      title: alerts.warning.title,
      html: alerts.warning.message(fullname),
      confirmText: alerts.warning.confirmButtonText,
      showCancelButton: false,
    });

    if (!second.isConfirmed) return false;

    const { isConfirmed } = await Swal.fire({
      title: alerts.typeToConfirm.title(fullname),
      input: 'text',
      inputPlaceholder: fullname,
      confirmButtonColor: '#ff0000',
      showCancelButton: true,

      preConfirm: (value: string) => {
        if (value === fullname) {
          return true;
        }

        Swal.showValidationMessage(`Must type "${fullname}" exactly`);

        return false;
      },
    });

    if (!isConfirmed) return false;

    const id = group ? guest.groupId : guest.guestId;

    const request$ = group ? this._groups.removeGroupById(id) : this._guests.removeGuestById(id);

    await firstValueFrom(request$);

    this._alerts.showToast({
      icon: 'success',
      title: alerts.success.message(fullname),
      time: 6000,
    });

    return true;
  }
}
