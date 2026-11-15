import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@core/services/alerts.service';
import { FormDraftService } from '@services/form-draft.service';

// Component
import { GuestsFormComponent } from '@pages/guests/form/guest-visit/guest-visit-form.component';

@Component({
  selector: 'guests-create',
  templateUrl: './guests-create.component.html',
  styleUrls: ['./guests-create.component.css'],
})
export class GuestsCreateComponent {
  @ViewChild('guestsForm')
  private guestsForm?: GuestsFormComponent;

  wasFormSubmitted = false;

  isCreating = false;

  private _guests = inject(GuestsService);
  private _alerts = inject(AlertsService);
  private _translate = inject(TranslateService);
  private router = inject(Router);
  private _draftService = inject(FormDraftService);

  hasPendingChanges(): boolean {
    return this.guestsForm?.hasPendingChanges() ?? false;
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

  create(data: any): void {
    if (this.isCreating) return;

    // CHECK INTERNET CONNECTION
    if (!navigator.onLine) {
      this.showOfflineAlert();
      return;
    }

    let payload: any;

    if (data.groupType === 'solo') {
      payload = {
        ...data.trip,
        ...data.guests[0],
      };

      this.isCreating = true;

      this._guests
        .createNewGuest(payload)
        .pipe(finalize(() => (this.isCreating = false)))
        .subscribe({
          next: () => {
            this.wasFormSubmitted = true;
            this._draftService.clear();
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

    this.isCreating = true;

    this._guests
      .createNewGroup(payload)
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: () => {
          this.wasFormSubmitted = true;
          this._draftService.clear();
          this._alerts.showToast({
            icon: 'success',
            title: this._translate.instant('ALERTS.CREATE.GROUP_SUCCESS'),
          });

          this.router.navigateByUrl('/guests');
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
