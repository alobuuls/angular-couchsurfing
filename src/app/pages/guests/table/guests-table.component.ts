import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { IGuestListItem, IApiCsPag } from '@interfaces/guests.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-table',
  templateUrl: './guests-table.component.html',
  styleUrls: ['./guests-table.component.css'],
})
export class GuestsTableComponent {
  @Input() pagination?: IApiCsPag;

  @Input() offset = 0;

  private _data: IGuestTableRow[] = [];

  @Input() set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
  }

  get data(): IGuestTableRow[] {
    return this._data;
  }

  @Output() detail = new EventEmitter<IGuestListItem>();
  @Output() edit = new EventEmitter<IGuestListItem>();
  @Output() remove = new EventEmitter<IGuestListItem>();
  @Output() whatsapp = new EventEmitter<string>();
  @Output() couchsurfing = new EventEmitter<string>();
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

  trackByIndexPhone(index: number): number {
    return index;
  }

  trackByIndexAge(index: number): number {
    return index;
  }
}
