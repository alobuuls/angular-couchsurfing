import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';

// Interfaces
import { IGuestTableRow, IGuestYearGroup } from '@interfaces/data-structure-api';
import { ICardGuest } from '@interfaces/guests.interface';

// Services
import { GuestsService } from '@services/guests.service';
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guests-cards',
  templateUrl: './guests-cards.component.html',
  styleUrls: ['./guests-cards.component.css'],
})
export class GuestsCardsComponent {
  _format = inject(FormatService);
  private _guests = inject(GuestsService);
  private _data: IGuestTableRow[] = [];

  @Input()
  set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
    this.groupGuestsByDate();
  }

  get data(): IGuestTableRow[] {
    return this._data;
  }

  // To infinite Scroll
  @Output() loadMore = new EventEmitter<void>();

  // Listen for scroll events on the browser window.
  @HostListener('window:scroll')
  onScroll(): void {
    // Get the current position of the bottom of the visible viewport.
    const scrollPosition = window.innerHeight + window.scrollY;

    // Get the total height of the document.
    const pageHeight = document.documentElement.scrollHeight;

    // Start loading more cards when 300px remain before reaching the bottom.
    const threshold = 800;

    // Emit the event when the user is close to the bottom of the page.
    if (scrollPosition >= pageHeight - threshold) {
      this.loadMore.emit();
    }
  }

  // Cards
  cardDetails = new Map<string, ICardGuest[]>();
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
      .map(([year, months]) => {
        const monthGroups = [...months.entries()]
          .sort(([monthA], [monthB]) => monthB - monthA)
          .map(([month, guests]) => ({
            month,
            monthName: this.getMonthName(month),
            guests,
            totalGuests: guests.reduce((total, guest) => total + guest.people.length, 0),
            totalVisits: guests.length,
          }));

        return {
          year,
          totalGuests: monthGroups.reduce((total, month) => total + month.totalGuests, 0),
          totalVisits: monthGroups.reduce((total, month) => total + month.totalVisits, 0),
          months: monthGroups,
        };
      });
  }

  private getMonthName(month: number): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
    }).format(new Date(2024, month, 1));
  }

  // Open / close a card
  private getCardId(guest: IGuestTableRow): string | undefined {
    if ('groupId' in guest) {
      return guest.groupId;
    }

    if ('guestId' in guest) {
      return guest.guestId;
    }

    return undefined;
  }

  toggleCard(guest: IGuestTableRow): void {
    const cardId = this.getCardId(guest);

    if (!cardId) return;

    if (this.openCards.has(cardId)) {
      this.openCards.delete(cardId);
      return;
    }

    this.openCards.add(cardId);

    if (this.cardDetails.has(cardId)) {
      return;
    }

    if (guest.groupType === 'solo') {
      this._guests.getGuestById(guest.guestId).subscribe(response => {
        this.cardDetails.set(cardId, [response.data]);
      });

      return;
    }

    if ('groupId' in guest) {
      this._guests.getGroupById(guest.groupId).subscribe(response => {
        this.cardDetails.set(cardId, response.data);
      });
    }
  }

  isCardOpen(guest: IGuestTableRow): boolean {
    const cardId = this.getCardId(guest);

    if (!cardId) return false;

    return this.openCards.has(cardId);
  }

  getCardDetails(guest: IGuestTableRow): ICardGuest[] {
    const cardId = this.getCardId(guest);

    if (!cardId) return [];
    return this.cardDetails.get(cardId) ?? [];
  }

  //  Get the names of the people in the guest/trip
  getGuestNames(guest: IGuestTableRow): string {
    return guest.people.map(person => person.fullName).join(' & ');
  }
}
