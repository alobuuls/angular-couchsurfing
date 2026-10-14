import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@services/alerts.service';

@Component({
  selector: 'guests-create',
  templateUrl: './guests-create.component.html',
  styleUrls: ['./guests-create.component.css'],
})
export class GuestsCreateComponent {
  private _guests = inject(GuestsService);
  private _alerts = inject(AlertsService);
  private _translate = inject(TranslateService);
  private router = inject(Router);

  create(data: any): void {
    let payload: any;

    if (data.groupType === 'solo') {
      payload = {
        ...data.trip,
        ...data.guests[0],
      };

      this._guests.createNewGuest(payload).subscribe({
        next: () => {
          this._alerts.showToast({
            icon: 'success',
            title: this._translate.instant('ALERTS.CREATE.GUEST_SUCCESS'),
          });

          this.router.navigateByUrl('/guests');
        },
        error: () => {
          this._alerts.showToast({
            icon: 'error',
            title: this._translate.instant('ALERTS.CREATE.GUEST_ERROR'),
          });
        },
      });

      return;
    }

    payload = {
      ...data.trip,
      groupType: data.groupType,
      members: data.guests,
    };

    this._guests.createNewGroup(payload).subscribe({
      next: () => {
        this._alerts.showToast({
          icon: 'success',
          title: this._translate.instant('ALERTS.CREATE.GROUP_SUCCESS'),
        });

        this.router.navigateByUrl('/guests'); // TODO
      },
      error: () => {
        this._alerts.showToast({
          icon: 'error',
          title: this._translate.instant('ALERTS.CREATE.GROUP_ERROR'),
        });
      },
    });
  }
}
