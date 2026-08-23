import { Component, Input } from '@angular/core';

import { IGuestTableMember, IGuestTableRow, IGuestYearGroup } from '@interfaces/data-structure-api';

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
  selectedCard: IGuestTableMember | null = null;

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
    if (!g.guestId) return;
  }
}
