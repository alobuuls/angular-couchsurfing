import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { ISummaryCard, ISummaryDistribution, ISummaryView } from '@interfaces/stats-interface';
import { ISummaryDoughnutVm, ISummaryRadarVm } from '@interfaces/charts/chart-summary.interface';
import { TChartTooltipContent } from '@type/chart.types';

// Helpers
import { GIFTS_COLORS, RATINGS_COLORS, SUMMARY_COLORS } from '@utils';

@Component({
  selector: 'guest-summary-chart',
  templateUrl: './guest-summary-chart.component.html',
  styleUrls: ['./guest-summary-chart.component.css'],
})
export class GuestSummaryChartComponent implements OnInit, OnChanges, OnDestroy {
  private readonly _router = inject(Router);
  private readonly _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  // Summary data received from parent.
  @Input() summary!: ISummaryDistribution;

  selectedView: ISummaryView = 'total';
  readonly summaryViews: ISummaryView[] = ['total', 'nights', 'rating', 'gifts'];

  cards: ISummaryCard[] = [];

  // Only one of them is defined at a time.
  radarVm?: ISummaryRadarVm;
  doughnutVm?: ISummaryDoughnutVm;

  private readonly cardKeys: Record<string, string> = {
    'Total Guests': 'TOTAL_GUESTS',
    'Solo Guests': 'SOLO_GUESTS',
    'Group Guests': 'GROUP_GUESTS',
    'Total Visits': 'TOTAL_VISITS',
    'Total Nights': 'TOTAL_NIGHTS',
  };

  private readonly cardNavigation: Record<string, string> = {
    'Total Guests': '',
    'Solo Guests': 'solo',
    'Group Guests': 'all-groups',
    'Total Visits': '',
    'Total Nights': '',
    default: 'solo',
  };

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildView());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['summary']) {
      this.buildCards();
      this.buildView();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  selectView(view: ISummaryView): void {
    if (this.selectedView === view) {
      return;
    }

    this.selectedView = view;
    this.buildView();
  }

  // CLICKS
  onGiftClick(index: number): void {
    if (index === 0) this.navigateToGiftGuests(true);
    if (index === 1) this.navigateToGiftGuests(false);
  }

  navigateToCard(label: string): void {
    const groupType = this.cardNavigation[label] ?? this.cardNavigation['default'];

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', groupType: groupType || undefined },
    });
  }

  // TOOLTIPS
  getRadarTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.radarVm;

    if (!vm) {
      return null;
    }

    return { title: vm.labels[index], rows: [{ value: `${vm.datasetLabel}: ${vm.values[index]}` }] };
  };

  getDoughnutTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.doughnutVm;

    if (!vm) {
      return null;
    }

    return { title: vm.labels[index], rows: [{ value: String(vm.values[index]) }] };
  };

  // VIEW MODELS
  private buildView(): void {
    this.radarVm = undefined;
    this.doughnutVm = undefined;

    if (!this.summary) {
      return;
    }

    switch (this.selectedView) {
      case 'nights':
        this.radarVm = this.buildNightsVm();
        break;
      case 'rating':
        this.radarVm = this.buildRatingVm();
        break;
      case 'gifts':
        this.doughnutVm = this.buildGiftsVm();
        break;
    }
  }

  private buildNightsVm(): ISummaryRadarVm {
    const s = this.summary;

    return this.buildRadarVm('STATS.SUMMARY.CHARTS.AVERAGE_NIGHTS', [s.averageNightsGeneral, s.averageNightsSolo, s.averageNightsGroup], 4);
  }

  private buildRatingVm(): ISummaryRadarVm {
    const s = this.summary;

    return this.buildRadarVm('STATS.SUMMARY.CHARTS.AVERAGE_RATING', [s.averageRatingGeneral, s.averageRatingSolo, s.averageRatingGroup], 5);
  }

  private buildRadarVm(labelKey: string, values: number[], max: number): ISummaryRadarVm {
    const points = SUMMARY_COLORS.radarPoints;

    return {
      datasetLabel: this.translate(labelKey),
      labels: [
        this.translate('STATS.SUMMARY.CHARTS.GUEST_TYPES.GENERAL'),
        this.translate('STATS.SUMMARY.CHARTS.GUEST_TYPES.SOLO'),
        this.translate('STATS.SUMMARY.CHARTS.GUEST_TYPES.GROUPS'),
      ],
      values,
      max,
      colors: { background: [RATINGS_COLORS[0].background], border: [RATINGS_COLORS[0].border] },
      pointColors: {
        background: [points.general.background, points.solo.background, points.groups.background],
        border: [points.general.border, points.solo.border, points.groups.border],
      },
    };
  }

  private buildGiftsVm(): ISummaryDoughnutVm {
    const colors = GIFTS_COLORS.slice(0, 2);

    return {
      datasetLabel: this.translate('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'),
      labels: [this.translate('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'), this.translate('STATS.SUMMARY.CHARTS.GIFTS.WITHOUT_GIFT')],
      values: [this.summary.giftsReceived, this.summary.guestsWithoutGift],
      colors: { background: colors.map(c => c.background), border: colors.map(c => c.border) },
    };
  }

  private buildCards(): void {
    const s = this.summary;

    this.cards = [
      { label: 'Total Guests', value: s.totalGuests, icon: 'groups' },
      { label: 'Solo Guests', value: s.totalGuestsSolo, icon: 'person' },
      { label: 'Group Guests', value: s.totalGuestsGroups, icon: 'group' },
      { label: 'Total Visits', value: s.totalVisits, icon: 'event' },
      { label: 'Total Nights', value: s.totalNights, icon: 'hotel' },
    ];
  }

  // HELPERS
  private translate(key: string, params?: Record<string, unknown>): string {
    return this._translate.instant(key, params);
  }

  getCardTranslationKey(label: string): string {
    return `STATS.SUMMARY.CARDS.${this.cardKeys[label] ?? 'TOTAL_GUESTS'}`;
  }

  trackById(index: number, item: ISummaryCard): string {
    return item.label;
  }

  private navigateToGiftGuests(hasGift: boolean): void {
    this._router.navigate(['/guests'], { queryParams: { view: 'cards', gift: hasGift } });
  }
}
