import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

// Interfaces
import { IAlert, IToast } from '@interfaces/alerts.interface';

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
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

  showAlert({ title, html, icon, allowClose = true, confirmText = 'Guardar', cancelText = 'Cerrar', showCancelButton = true, opts }: IAlert) {
    return Swal.fire({
      title,
      html,
      icon,
      showConfirmButton: true,
      showCancelButton,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
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
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cerrar',
      reverseButtons: true,
      customClass: {
        popup: 'custom-swal',
        confirmButton: 'custom-swal-danger',
        cancelButton: 'custom-swal-cancel',
      },

      preConfirm: (value: string) => {
        if (value === fullname) return true;
        Swal.showValidationMessage(`Must type "${fullname}" exactly`);
        return false;
      },
    });
  }
}
