import { Component, EventEmitter, Inject, inject, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Interfaces
import { IGuestListItem, IApiCsPag } from '@interfaces/guests.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { Continents } from '@type/word.types';

// Services
import { FormatService } from '@services/format.service';
import { GeonameService } from '@services/geoname.service';

// Helpers
import { isGroup } from '@utils';
import { getGuestDetailRoute } from '../../../utils/helpers/guest-routing.utils';

@Component({
  selector: 'guests-table',
  templateUrl: './guests-table.component.html',
  styleUrls: ['./guests-table.component.css'],
})
export class GuestsTableComponent {
  getGuestDetailRoute = getGuestDetailRoute;

  _format = inject(FormatService);
  csUrl: string = 'https://www.couchsurfing.com/c/users/';

  @Input() pagination?: IApiCsPag;

  @Input() offset = 0;

  private _data: IGuestTableRow[] = [];
  private readonly _geoname = inject(GeonameService);

  @Input() set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
  }

  get data(): IGuestTableRow[] {
    return this._data;
  }

  @Output() remove = new EventEmitter<IGuestListItem>();

  @Output() page = new EventEmitter<PageEvent>();
  @Output() sort = new EventEmitter<Sort>();

  readonly displayedColumns: string[] = [
    'no',
    'hangOut',
    'nights',
    'gender',
    'birth_date',
    'fullName',
    'continent',
    'hometownCode',
    'livingInCode',
    'visitedDate',
    'rating',
    'actions',
  ];

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
  }

  getEditRoute(guest: IGuestListItem): string[] {
    if (isGroup(guest)) return ['/guests/groups', guest.groupId, 'edit'];
    return ['/guests', guest.guestId, 'edit'];
  }

  trackByIndexPhone(index: number): number {
    return index;
  }

  trackByIndexAge(index: number): number {
    return index;
  }
}
