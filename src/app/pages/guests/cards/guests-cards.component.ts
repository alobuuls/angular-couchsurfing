import { Component, OnInit, inject } from '@angular/core';

import { GuestsService } from '@services/guests.service';

import { IGuestTableMember, IGuestTableRow, IGuestYearGroup } from '@interfaces/data-structure-api';

import { mapGuestTable } from 'src/app/utils/mappers/guest-table.mapper';

@Component({
  selector: 'guests-cards',
  templateUrl: './guests-cards.component.html',
  styleUrls: ['./guests-cards.component.css'],
})
export class GuestsCardsComponent implements OnInit {
  private _guests = inject(GuestsService);

  data: IGuestTableRow[] = [];

  cardsGuest: IGuestYearGroup[] = [];

  selectedCard: IGuestTableMember | null = null;

  ngOnInit(): void {
    this.loadGuests();
  }

  private loadGuests(): void {
    this._guests
      .getAllGuests({
        page: 1,
        limit: 200,
      })
      .subscribe(res => {
        this.data = mapGuestTable(res.data);

        this.groupGuestsByDate();
      });
  }

  private groupGuestsByDate(): void {
    const years = new Map<number, Map<number, IGuestTableRow[]>>();

    for (const guest of this.data) {
      if (!guest.visitedDate) continue;

      const date = new Date(guest.visitedDate);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!years.has(year)) {
        years.set(year, new Map());
      }

      const months = years.get(year)!;

      if (!months.has(month)) {
        months.set(month, []);
      }

      months.get(month)!.push(guest);
    }

    this.cardsGuest = [...years.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, months]) => ({
        year,
        months: [...months.entries()]
          .sort(([monthA], [monthB]) => monthB - monthA)
          .map(([month, guests]) => ({
            month,
            monthName: this.getMonthName(month),
            guests,
          })),
      }));
  }

  private getMonthName(month: number): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
    }).format(new Date(2024, month, 1));
  }

  toggleCard(person: IGuestTableMember): void {
    this.selectedCard = this.selectedCard === person ? null : person;
  }

  getDetailGuest(g: IGuestTableMember): void {
    console.log('Persona recibida:', g);
    console.log('Guest ID:', g.guestId);

    if (!g.guestId) {
      console.error('no tiene guestId', g);
      return;
    }

    console.log(' Guest ID', g.guestId);
  }
}
