interface AlertMessages {
  deleteGuest: DeleteGuestFlow;
}

interface DeleteGuestFlow {
  confirmation: ConfirmationAlert;
  warning: WarningAlert;
  typeToConfirm: TypeToConfirmAlert;
  success: SuccessAlert;
}

interface AlertBase {
  title: string;
  message: string;
  confirmButtonText: string;
}

interface DynamicText {
  title: (fullName: string) => string;
  message: (fullName: string) => string;
}

type ConfirmationAlert = Omit<AlertBase, 'title'>;

type WarningAlert = Omit<AlertBase, 'message'> & Pick<DynamicText, 'message'>;

type TypeToConfirmAlert = Pick<AlertBase, 'confirmButtonText'> & Pick<DynamicText, 'title'>;

type SuccessAlert = Pick<DynamicText, 'message'>;

export const ALERT_MESSAGES: AlertMessages = {
  deleteGuest: {
    confirmation: {
      message: 'Are you sure you want to delete?',
      confirmButtonText: 'I want to delete this guest',
    },

    warning: {
      title: 'Please read carefully before continuing',
      message: fullName => `This will permanently delete the guest <strong class="danger">${fullName}</strong>.`,
      confirmButtonText: 'I understand the consequences',
    },

    typeToConfirm: {
      title: fullName => `To confirm, type "<strong class="danger">${fullName}</strong>"`,
      confirmButtonText: 'Delete guest',
    },

    success: {
      message: fullName => `<strong class="danger">${fullName}</strong> has been deleted successfully`,
    },
  },
};
