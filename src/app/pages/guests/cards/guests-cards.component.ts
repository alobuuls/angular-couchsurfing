import { Component, Input } from '@angular/core';

import { IGuestTableRow, IGuestYearGroup } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-cards',
  templateUrl: './guests-cards.component.html',
  styleUrls: ['./guests-cards.component.css'],
})
export class GuestsCardsComponent {
  private _data: IGuestTableRow[] = [];

  @Input()
  set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
    this.groupGuestsByDate();
  }

  get data(): IGuestTableRow[] {
    return this._data;
  }

  cardsGuest: IGuestYearGroup[] = [];

  // Cards that are currently open
  openCards = new Set<string>();

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

  // Open / close a card
  toggleCard(guest: any): void {
    const cardId = guest.groupId ?? guest.guestId;

    if (!cardId) return;

    if (this.openCards.has(cardId)) {
      this.openCards.delete(cardId);
    } else {
      this.openCards.add(cardId);
    }
  }

  isCardOpen(guest: any): boolean {
    const cardId = guest.groupId ?? guest.guestId;

    if (!cardId) return false;

    return this.openCards.has(cardId);
  }

  //  Get the names of the people in the guest/trip
  getGuestNames(guest: IGuestTableRow): string {
    return guest.people.map(person => person.fullName).join(' & ');
  }

  // Get guest details
  getDetailGuest(guest: IGuestTableRow): void {
    console.log(guest);
  }
}
