// guests/stats/guests-navigation.service.ts
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { IQueryParamsGuests } from '@interfaces/guests.interface';

@Injectable({ providedIn: 'root' })
export class GuestsNavigationService {
  private readonly _router = inject(Router);

  // /guests?view=cards&...filters
  toList(filters: Partial<IQueryParamsGuests> = {}): void {
    this._router.navigate(['/guests'], { queryParams: { view: 'cards', ...filters } });
  }

  // Group details for group guests, guest details otherwise.
  toGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }
    this._router.navigate(['/guests', guestId]);
  }
}
