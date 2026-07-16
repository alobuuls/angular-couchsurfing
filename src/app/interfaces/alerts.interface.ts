import { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
export interface IToast {
  icon: SweetAlertIcon;
  title: string;
  time?: number;
  stopTimer?: boolean;
}
export interface IAlert {
  title: string;
  html: string;
  icon: SweetAlertIcon;
  allowClose?: boolean;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  opts?: SweetAlertOptions;
}
