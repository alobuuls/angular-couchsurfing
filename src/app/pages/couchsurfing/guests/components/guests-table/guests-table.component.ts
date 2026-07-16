import { Component, EventEmitter, Input, Output } from '@angular/core';

// Material
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Interfaces
import { IGuest, IApiCsPag } from '@interfaces/couchsurfing.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-table',
  templateUrl: './guests-table.component.html',
  styleUrls: ['./guests-table.component.css'],
})
export class GuestsTableComponent {
  @Input()
  pagination?: IApiCsPag;

  @Input()
  offset = 0;

  @Input()
  data!: IGuestTableRow[];

  @Output()
  whatsapp = new EventEmitter<IGuest>();

  @Output()
  page = new EventEmitter<PageEvent>();

  @Output()
  sort = new EventEmitter<Sort>();

  readonly displayedColumns: string[] = ['no', 'hangOut', 'nights', 'gender', 'birth_date', 'fullName', 'continent', 'hometownCode', 'livingInCode', 'visitedDate', 'rating'];

  trackByIndex(index: number): number {
    return index;
  }
}
