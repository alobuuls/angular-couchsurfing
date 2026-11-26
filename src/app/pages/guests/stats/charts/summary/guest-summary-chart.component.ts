import { Component, inject, Input } from '@angular/core';

// Interfaces
import { ISummaryDistribution, ISummaryView } from '@interfaces/stats-interface';
import { ISummaryDoughnutVm, ISummaryRadarVm } from '@interfaces/charts/chart-summary.interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';
import { TChartTooltipContent } from '@type/chart.types';

// Services
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { GIFTS_COLORS, paletteToColors, RATINGS_COLORS, SUMMARY_COLORS } from '@utils';

interface ISummaryCardVm {
  key: string;
  icon: string;
  value: number;
  groupType?: IQueryParamsGuests['groupType'];
}

// One entry per card: i18n key (STATS.SUMMARY.CARDS.<key>), icon, value and the guests filter it opens.
const SUMMARY_CARDS: {
  key: string;
  icon: string;
  value: (summary: ISummaryDistribution) => number;
  groupType?: IQueryParamsGuests['groupType'];
}[] = [
  { key: 'TOTAL_GUESTS', icon: 'groups', value: s => s.totalGuests },
  { key: 'SOLO_GUESTS', icon: 'person', value: s => s.totalGuestsSolo, groupType: 'solo' },
  { key: 'GROUP_GUESTS', icon: 'group', value: s => s.totalGuestsGroups, groupType: 'all-groups' },
  { key: 'TOTAL_VISITS', icon: 'event', value: s => s.totalVisits },
  { key: 'TOTAL_NIGHTS', icon: 'hotel', value: s => s.totalNights },
];

@Component({
  selector: 'guest-summary-chart',
  templateUrl: './guest-summary-chart.component.html',
  styleUrls: ['./guest-summary-chart.component.css'],
})
export class GuestSummaryChartComponent extends StatsChartContainer {
  private readonly _nav = inject(GuestsNavigationService);

  @Input() summary!: ISummaryDistribution;

  selectedView: ISummaryView = 'total';
  readonly summaryViews: ISummaryView[] = ['total', 'nights', 'rating', 'gifts'];
  cards: ISummaryCardVm[] = [];

  // Only one of them is defined at a time.
  radarVm?: ISummaryRadarVm;
  doughnutVm?: ISummaryDoughnutVm;

  selectView(view: ISummaryView): void {
    this.selectedView = view;
    this.buildView();
  }

  navigateToCard(card: ISummaryCardVm): void {
    this._nav.toList({ groupType: card.groupType });
  }

  // Index 0 = guests with a gift, index 1 = guests without one.
  onGiftClick(index: number): void {
    if (index <= 1) this._nav.toList({ gift: index === 0 });
  }

  trackByKey = (_: number, card: ISummaryCardVm): string => card.key;

  getRadarTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.radarVm;
    return vm ? { title: vm.labels[index], rows: [{ value: `${vm.datasetLabel}: ${vm.values[index]}` }] } : null;
  };

  getDoughnutTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.doughnutVm;
    return vm ? { title: vm.labels[index], rows: [{ value: String(vm.values[index]) }] } : null;
  };

  protected buildView(): void {
    this.radarVm = undefined;
    this.doughnutVm = undefined;
    this.cards = [];

    if (!this.summary) return;

    const s = this.summary;
    this.cards = SUMMARY_CARDS.map(card => ({ ...card, value: card.value(s) }));

    switch (this.selectedView) {
      case 'nights':
        this.radarVm = this.buildRadarVm('STATS.SUMMARY.CHARTS.AVERAGE_NIGHTS', [s.averageNightsGeneral, s.averageNightsSolo, s.averageNightsGroup], 4);
        break;
      case 'rating':
        this.radarVm = this.buildRadarVm('STATS.SUMMARY.CHARTS.AVERAGE_RATING', [s.averageRatingGeneral, s.averageRatingSolo, s.averageRatingGroup], 5);
        break;
      case 'gifts':
        this.doughnutVm = this.buildGiftsVm();
        break;
    }
  }

  private buildRadarVm(labelKey: string, values: number[], max: number): ISummaryRadarVm {
    const points = SUMMARY_COLORS.radarPoints;

    return {
      datasetLabel: this.t(labelKey),
      labels: [this.t('STATS.SUMMARY.CHARTS.GUEST_TYPES.GENERAL'), this.t('STATS.SUMMARY.CHARTS.GUEST_TYPES.SOLO'), this.t('STATS.SUMMARY.CHARTS.GUEST_TYPES.GROUPS')],
      values,
      max,
      colors: paletteToColors([RATINGS_COLORS[0]]),
      pointColors: paletteToColors([points.general, points.solo, points.groups]),
    };
  }

  private buildGiftsVm(): ISummaryDoughnutVm {
    return {
      datasetLabel: this.t('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'),
      labels: [this.t('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'), this.t('STATS.SUMMARY.CHARTS.GIFTS.WITHOUT_GIFT')],
      values: [this.summary.giftsReceived, this.summary.guestsWithoutGift],
      colors: paletteToColors(GIFTS_COLORS.slice(0, 2)),
    };
  }
}
