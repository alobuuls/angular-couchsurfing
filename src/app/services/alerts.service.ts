import { inject, Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

// Interfaces
import { IAlert, IToast } from '@interfaces/alerts.interface';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private _translate = inject(TranslateService);

  showToast({ icon, title, time = 3500, stopTimer = true }: IToast) {
    return Swal.mixin({
      toast: true,
      position: 'top-end',
      timer: time,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: 'custom-swal-toast',
      },

      didOpen: toast => {
        if (!stopTimer) return;
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    }).fire({
      icon,
      title,
    });
  }

  showAlert({ title, html, icon, allowClose = true, confirmText, cancelText, showCancelButton = true, opts }: IAlert) {
    const translatedConfirmText = confirmText ?? this._translate.instant('ALERTS.BUTTONS.SAVE');
    const translatedCancelText = cancelText ?? this._translate.instant('ALERTS.BUTTONS.CLOSE');

    return Swal.fire({
      title,
      html,
      icon,
      showConfirmButton: true,
      showCancelButton,
      confirmButtonText: translatedConfirmText,
      cancelButtonText: translatedCancelText,
      allowEscapeKey: allowClose,
      allowOutsideClick: allowClose,
      reverseButtons: true,
      customClass: {
        popup: 'custom-swal',
        confirmButton: 'custom-swal-confirm',
        cancelButton: 'custom-swal-cancel',
      },
      ...opts,
    });
  }

  showDeleteConfirmation(title: string, fullname: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      input: 'text',
      inputPlaceholder: fullname,
      showCancelButton: true,
      confirmButtonText: this._translate.instant('ALERTS.BUTTONS.DELETE'),
      cancelButtonText: this._translate.instant('ALERTS.BUTTONS.CLOSE'),
      reverseButtons: true,
      customClass: {
        popup: 'custom-swal',
        confirmButton: 'custom-swal-danger',
        cancelButton: 'custom-swal-cancel',
      },
      preConfirm: (value: string) => {
        if (value === fullname) return true;

        Swal.showValidationMessage(this._translate.instant('ALERTS.VALIDATION.TYPE_NAME_EXACTLY', { name: fullname }));

        return false;
      },
    });
  }
}
