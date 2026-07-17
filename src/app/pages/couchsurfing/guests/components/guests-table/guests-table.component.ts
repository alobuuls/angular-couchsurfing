import { Component, EventEmitter, Input, Output } from '@angular/core';

// Material
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Interfaces
import { IGuest, IGuestListItem, IApiCsPag } from '@interfaces/couchsurfing.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-table',
  templateUrl: './guests-table.component.html',
  styleUrls: ['./guests-table.component.css'],
})
export class GuestsTableComponent {
  @Input() pagination?: IApiCsPag;

  @Input() offset = 0;

  @Input() data!: IGuestTableRow[];

  @Output() detail = new EventEmitter<IGuestListItem>();

  @Output() edit = new EventEmitter<IGuestListItem>();

  @Output() remove = new EventEmitter<IGuestListItem>();

  @Output() whatsapp = new EventEmitter<string>();

  @Output() couchsurfing = new EventEmitter<IGuestListItem>();

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
