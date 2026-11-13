import { Component, EventEmitter, Input, Output, SimpleChanges, inject, NgZone, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { FormatService } from '@services/format.service';
import { GeonameService } from '@services/geoname.service';
import { LanguageService } from '@core/services/language.service';
import { AlertsService } from '@core/services/alerts.service';
import { ErrorHandlerService } from '@core/services/err-handler.service';

// Interfaces
import { IGuestTableMember, IGuestTableRow } from '@interfaces/data-structure-api';
import { ICardGuest, IGuestListItem, IGuestYearGroup, IYearlyStat } from '@interfaces/guests.interface';
import { Continents, Regions } from '@type/word.types';
import { DataState } from '@interfaces/data-structure-api';

// Const
import { LINK_BASE_COUCHSURFING, LINK_BASE_INSTAGRAM, LINK_BASE_WHATSAPP } from '@config/social/social-links';

// Utils
import { withReqStateSimple, getGuestDetailRoute } from '@utils';

@Component({
  selector: 'guests-cards',
  templateUrl: './guests-cards.component.html',
  styleUrls: ['./guests-cards.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestsCardsComponent implements OnInit, OnDestroy {
  // Scroll
  private readonly _ngZone = inject(NgZone);
  private scrollListener?: () => void;
  private scrollFrame: number | null = null;

  readonly ratingStars = [1, 2, 3, 4, 5];

  getGuestDetailRoute = getGuestDetailRoute;
  private canLoadMore = true;
  private _data: IGuestTableRow[] = [];

  linkBaseCouchsurfing: string = LINK_BASE_COUCHSURFING;
  linkBaseInstagram: string = LINK_BASE_INSTAGRAM;
  linkBaseWhatsapp: string = LINK_BASE_WHATSAPP;

  // Cards
  cardStates = new Map<string, DataState<ICardGuest[]>>();
  cardsGuest: IGuestYearGroup[] = [];
  // Cards that are currently open
  openCards = new Set<string>();

  showBackToTop = false;

  private _guests = inject(GuestsService);
  _format = inject(FormatService);
  private readonly _translate = inject(TranslateService);
  private readonly _language = inject(LanguageService);
  private readonly _geoname = inject(GeonameService);
  private readonly _alerts = inject(AlertsService);
  private readonly _errHandler = inject(ErrorHandlerService);
  private readonly _router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly _langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildCardsGroups());
  readonly skeletonCards = Array.from({ length: 10 });
  readonly skeletonStars = [1, 2, 3, 4, 5];
  private _monthlyStats: IYearlyStat[] = [];

  @Input() loading = false;
  @Input() cardsHasMore: boolean = false;

  @Input()
  set data(value: IGuestTableRow[]) {
    this._data = value ?? [];
    this.buildCardsGroups();
  }

  @Input()
  set monthlyStats(value: IYearlyStat[] | undefined) {
    this._monthlyStats = value ?? [];
    this.buildCardsGroups();
  }

  @Output() remove = new EventEmitter<IGuestListItem>();
  // To infinite Scroll
  @Output() loadMore = new EventEmitter<void>();

  get data(): IGuestTableRow[] {
    return this._data;
  }

  ngOnInit(): void {
    this.initScrollListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading'] && !this.loading) {
      this.canLoadMore = true;
    }

    if (changes['cardsHasMore'] && !this.cardsHasMore) {
      this.canLoadMore = false;
    }
  }

  private initScrollListener(): void {
    this._ngZone.runOutsideAngular(() => {
      this.scrollListener = () => {
        if (this.scrollFrame !== null) return;

        this.scrollFrame = requestAnimationFrame(() => {
          this.scrollFrame = null;

          // BACK TO TOP
          const shouldShowBackToTop = window.scrollY > 900;

          // INFINITE SCROLL
          const scrollPosition = window.innerHeight + window.scrollY;
          const pageHeight = document.documentElement.scrollHeight;

          const shouldLoadMore = this.canLoadMore && !this.loading && this.cardsHasMore && scrollPosition >= pageHeight - 900;

          if (shouldShowBackToTop !== this.showBackToTop || shouldLoadMore) {
            this._ngZone.run(() => {
              this.showBackToTop = shouldShowBackToTop;
              this.cdr.markForCheck();

              if (shouldLoadMore) {
                this.canLoadMore = false;
                this.loadMore.emit();
              }
            });
          }
        });
      };

      window.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }

  private removeScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = undefined;
    }

    if (this.scrollFrame !== null) {
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
    }
  }

  // Open / close a card
  getCardId(guest: IGuestTableRow): string | undefined {
    if ('groupId' in guest) return guest.groupId;
    if ('guestId' in guest) return guest.guestId;
    return undefined;
  }

  private buildCardsGroups(): void {
    const guestsByMonth = new Map<string, IGuestTableRow[]>();
    this._data.forEach(guest => {
      if (!guest.visitedDate) return;

      const dateParts = String(guest.visitedDate).match(/^(\d{4})-(\d{2})-\d{2}/);

      if (!dateParts) return;

      const year = Number(dateParts[1]);
      const month = Number(dateParts[2]);
      if (month < 1 || month > 12) return;

      const key = `${year}-${month}`;
      if (!guestsByMonth.has(key)) guestsByMonth.set(key, []);
      guestsByMonth.get(key)!.push(guest);
    });

    this.cardsGuest = this._monthlyStats
      .map(yearStat => ({
        year: yearStat.year,
        totalVisits: yearStat.totalVisits,
        totalPeople: yearStat.totalPeople,
        months: yearStat.months
          .filter(month => month.totalVisits > 0)
          .map(month => ({
            month: month.month,
            monthName: this.getMonthName(month.month - 1),
            totalVisits: month.totalVisits,
            totalPeople: month.totalPeople,
            guests: guestsByMonth.get(`${yearStat.year}-${month.month}`) ?? [],
          }))
          .filter(month => month.guests.length > 0)
          .sort((a, b) => b.month - a.month),
      }))
      .filter(year => year.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }

  private getMonthName(month: number): string {
    return new Intl.DateTimeFormat(this._language.currentLocale, {
      month: 'long',
    }).format(new Date(2024, month, 1));
  }

  // NAVIGATE TO GUEST/GROUP DETAIL WITH VIEW TRANSITION
  async navigateWithTransition(guest: IGuestListItem): Promise<void> {
    // Get the route corresponding to the selected guest or group.
    const route = getGuestDetailRoute(guest);

    // Store the current URL to return to the same view and preserve its query parameters.
    const returnUrl = this._router.url;

    // Extend the Document type to include the native View Transitions API.
    // The optional (?) indicates that the browser might not support this API.
    const documentWithTransitions = document as Document & {
      startViewTransition?: (callback: () => Promise<void>) => {
        finished: Promise<void>;
      };
    };

    // FALLBACK: Navigate normally if the browser does not support View Transitions.
    if (!documentWithTransitions.startViewTransition) {
      await this._router.navigate(route, {
        state: { returnUrl },
      });
      return;
    }

    // Add the forward class to <html> to trigger the forward CSS animations.
    const root = document.documentElement;
    root.classList.add('forward');

    try {
      // Start the View Transition and navigate to the guest or group detail.
      const transition = documentWithTransitions.startViewTransition(async () => {
        await this._router.navigate(route, {
          state: { returnUrl },
        });
      });

      // Wait until the visual transition finishes.
      await transition.finished;
    } finally {
      // Remove the forward class to prevent it from affecting future navigations.
      root.classList.remove('forward');
    }
  }

  formatDate(value: Date | string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return this._format.formatDate(date.toISOString());
  }

  toggleCard(guest: IGuestTableRow): void {
    const cardId = this.getCardId(guest);
    if (!cardId) return;

    // CLOSE CARD
    if (this.openCards.has(cardId)) {
      this.openCards.delete(cardId);
      this.cdr.markForCheck();
      return;
    }

    // OPEN CARD
    this.openCards.add(cardId);
    this.cdr.markForCheck();

    const currentState = this.cardStates.get(cardId);

    // Already loading or successfully loaded
    if (currentState?.status === 'loading' || currentState?.status === 'success') return;

    // Handle request states
    const handleRequestState = (state: DataState<ICardGuest[]>): void => {
      // Save every state: loading, success or error
      this.cardStates.set(cardId, state);
      this.cdr.markForCheck();

      if (state.status === 'error' && state.error) {
        // Close card so the user can retry
        this.openCards.delete(cardId);
        this.cdr.markForCheck();

        this._alerts.showAlert({
          icon: 'error',
          title: 'Error',
          html: state.error.message,
          showCancelButton: false,
          confirmText: 'Close',
        });
      }
    };

    // LOAD SOLO GUEST
    if (guest.groupType === 'solo') {
      const request$ = this._guests.getGuestById(guest.guestId).pipe(map(response => ({ data: [response.data] })));

      withReqStateSimple<ICardGuest[]>(request$, this._errHandler).subscribe(handleRequestState);
      return;
    }

    // LOAD GROUP
    if (!guest.groupId) {
      this.openCards.delete(cardId);
      this.cdr.markForCheck();
      return;
    }

    const isAGroup = ['couple', 'friends', 'family'].includes(guest.groupType);

    if (isAGroup) {
      withReqStateSimple<ICardGuest[]>(this._guests.getGroupById(guest.groupId), this._errHandler).subscribe(handleRequestState);
    }
  }

  isCardOpenById(cardId: string | undefined): boolean {
    return !!cardId && this.openCards.has(cardId);
  }

  isCardLoading(guest: IGuestTableRow): boolean {
    const cardId = this.getCardId(guest);
    return cardId ? this.cardStates.get(cardId)?.status === 'loading' : false;
  }

  getRegionName(region: Regions): string {
    return this._geoname.getRegionName(region);
  }

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
  }

  getCardDetails(guest: IGuestTableRow): ICardGuest[] {
    const cardId = this.getCardId(guest);
    if (!cardId) return [];

    const state = this.cardStates.get(cardId);
    return state?.status === 'success' ? state.data : [];
  }

  //  Get the names of the people in the guest/trip
  getGuestNames(guest: IGuestTableRow): string {
    return guest.people.map(person => person.fullName).join(' & ');
  }

  hasFiveStars(guest: IGuestTableRow): boolean {
    return guest.people.length > 0 && guest.people.every(person => person.rating === 5);
  }

  hasAmbassador(guest: IGuestTableRow): boolean {
    return guest.people.some(person => person.ambassador);
  }

  // Show one badge on the card when the solo guest or all group members are first time
  showFirstTimeCardBadge(guest: IGuestTableRow): boolean {
    if (guest.groupType === 'solo') return guest.isFirstTime === true;
    return guest.people.length > 0 && guest.people.every(person => person.isFirstTime === true);
  }

  // Show individual badges when only some group members are first time
  showFirstTimePersonBadge(guest: IGuestTableRow, person: IGuestTableMember): boolean {
    return guest.groupType !== 'solo' && !this.showFirstTimeCardBadge(guest) && person.isFirstTime === true;
  }

  // Show guest name and the first letter os the last name
  formatGuestName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  trackByYear(index: number, year: IGuestYearGroup): number {
    return year.year;
  }

  trackByMonth(index: number, month: IGuestYearGroup['months'][number]): number {
    return month.month;
  }

  trackByGuest = (index: number, guest: IGuestTableRow): string => {
    return this.getCardId(guest) ?? String(index);
  };

  ngOnDestroy(): void {
    this.removeScrollListener();
    this._langChangeSubscription.unsubscribe();
  }
}
