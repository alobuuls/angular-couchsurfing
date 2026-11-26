import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

// Services
import { AlertsService } from '@core/services/alerts.service';
import { FormDraftService } from '@shared/services/form-draft.service';

export interface CanComponentDeactivate {
  hasPendingChanges: () => boolean;
  wasFormSubmitted: boolean;
}

export const pendingChangesFormGuard: CanDeactivateFn<CanComponentDeactivate> = async component => {
  const alerts = inject(AlertsService);
  const draftService = inject(FormDraftService);

  // Allow navigation if there are no pending changes
  // or the form was successfully submitted.
  if (component.wasFormSubmitted || !component.hasPendingChanges()) {
    return true;
  }

  const result = await alerts.showDraftExitConfirmation();

  // Leave and keep the saved draft.
  if (result.isConfirmed) {
    return true;
  }

  // Leave and discard the saved draft.
  if (result.isDenied) {
    draftService.clear();
    return true;
  }

  // Stay on the current page.
  return false;
};
