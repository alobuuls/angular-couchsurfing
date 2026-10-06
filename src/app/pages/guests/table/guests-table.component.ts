import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Interfaces
import { IGuestListItem, IApiCsPag } from '@interfaces/guests.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';

// Services
import { FormatService } from '@services/format.service';

// Helpers
import { isGroup } from '@utils';

@Component({
  selector: 'guests-table',
  templateUrl: './guests-table.component.html',
  styleUrls: ['./guests-table.component.css'],
})
export class GuestsTableComponent {
  _format = inject(FormatService);
  csUrl: string = 'https://www.couchsurfing.com/c/users/';

  @Input() pagination?: IApiCsPag;

  @Input() offset = 0;

  private _data: IGuestTableRow[] = [];

  @Input() set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
  }

  get data(): IGuestTableRow[] {
    return this._data;
  }

  @Output() remove = new EventEmitter<IGuestListItem>();
  @Output() detailGuest = new EventEmitter<string>();

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

  openCouchsurfing(profileId: string): void {
    window.open(`${profileId}`, '_blank');
  }

  openWhatsapp(whatsapp: string): void {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
  }

  getDetailRoute(guest: IGuestListItem): string[] {
    if (isGroup(guest)) return ['/guests/groups', guest.groupId];
    return ['/guests', guest.guestId];
  }

  getEditRoute(guest: IGuestListItem): string[] {
    if (isGroup(guest)) return ['/guests/groups/edit', guest.groupId];
    return ['/guests/edit', guest.guestId];
  }

  trackByIndexPhone(index: number): number {
    return index;
  }

  trackByIndexAge(index: number): number {
    return index;
  }
}
