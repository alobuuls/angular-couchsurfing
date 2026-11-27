import { Component, inject, Input } from '@angular/core';

// Interfaces
import { ILongestView, IStaysDistribution, IStaysView } from '@interfaces/stats-interface';
import { IChartColors, IChartEdge, TChartTooltipContent } from '@type/chart.types';
import { IStaysArrivalVm, IStaysMaxPeopleVm, IStaysNetworkVm, IStaysPolarVm } from '@interfaces/charts/stats-chart-vm.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { CHART_NEUTRAL_COLOR, GENDER_COLORS, getGenderColor, getPodiumColors, getTopIndexes, paletteToColors, STAYS_COLORS } from '@utils';

@Component({
  selector: 'guest-stays-chart',
  templateUrl: './guest-stays-chart.component.html',
  styleUrls: ['./guest-stays-chart.component.css'],
})
export class GuestStaysChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() stays!: IStaysDistribution;

  selectedView: IStaysView = 'longest';
  readonly staysViews: IStaysView[] = ['longest', 'shortest', 'maxPeopleTogether', 'sameArrival', 'sameDates'];

  // Longest / Shortest subview.
  selectedStayView: ILongestView = 'overall';
  readonly stayViews: ILongestView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // Same Dates group.
  selectedSameDatesGroup = 0;

  // Only one of them is defined at a time.
  polarVm?: IStaysPolarVm;
  maxPeopleVm?: IStaysMaxPeopleVm;
  arrivalVm?: IStaysArrivalVm;
  networkVm?: IStaysNetworkVm;

  override ngOnChanges(): void {
    // Reset the selected group when new data arrives.
    this.selectedSameDatesGroup = 0;
    super.ngOnChanges();
  }

  selectView(view: IStaysView): void {
    this.selectedView = view;

    // Reset Same Dates group when entering this view.
    if (view === 'sameDates') {
      this.selectedSameDatesGroup = 0;
    }

    this.buildView();
  }

  selectStayView(view: ILongestView): void {
    this.selectedStayView = view;
    this.buildView();
  }

  selectSameDatesGroup(index: number): void {
    this.selectedSameDatesGroup = index;
    this.buildView();
  }

  // CLICKS
  onPolarClick(index: number): void {
    const guest = this.polarVm?.items[index]?.guest;

    if (guest?.guestId) {
      this._nav.toGuest(guest.guestId, guest.groupType, guest.groupId);
    }
  }

  onMaxPeopleClick(index: number): void {
    const guests = this.maxPeopleVm?.entries[index]?.data.guests;

    if (guests?.length) {
      this._nav.toList(this.getDateRange(guests.map(guest => guest.visitedDate)));
    }
  }

  onArrivalClick(index: number): void {
    const date = this.arrivalVm?.items[index]?.date;

    if (date) {
      this._nav.toList({ from: date, to: date });
    }
  }

  onNetworkClick(index: number): void {
    const guest = this.networkVm?.guests[index];

    if (guest?.guestId) {
      this._nav.toGuest(guest.guestId, guest.groupType, guest.groupId);
    }
  }

  // TOOLTIPS
  getPolarTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.polarVm?.items[index];

    if (!item) return null;

    const guest = item.guest;
    const rows: TChartTooltipContent['rows'] = [{ value: this.t('STATS.STAYS.LABELS.TOTAL_NIGHTS', { count: item.nights }) }];

    if (this.selectedStayView === 'overall') {
      rows.push({ value: this.t('STATS.STAYS.LABELS.GROUP', { group: this._labels.groupType(guest.groupType) }) });
    }

    rows.push({ value: this.t('STATS.STAYS.LABELS.VISIT', { date: this._format.formatDate(guest.visitedDate) }) });

    return {
      title: this._labels.guestName(guest.fullName, guest.groupType),
      rows,
      country: this._labels.country(guest.hometownCode),
    };
  };

  getMaxPeopleTooltip = (index: number): TChartTooltipContent | null => {
    const entry = this.maxPeopleVm?.entries[index];

    if (!entry) return null;

    const guests = entry.data.guests;

    return {
      title: guests[0] ? this._format.formatDate(guests[0].visitedDate) : entry.label,
      rows: [{ value: this.t('STATS.STAYS.LABELS.GUESTS_COUNT', { count: entry.data.total }) }, ...this._labels.guestRows(guests)],
    };
  };

  getArrivalTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.arrivalVm?.items[index];

    if (!item) return null;

    return {
      title: this._format.formatDate(item.date),
      rows: [{ value: this.t('STATS.STAYS.LABELS.GUESTS_COUNT', { count: item.total }) }, ...this._labels.guestRows(item.guests)],
    };
  };

  getNetworkTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.networkVm;
    const guest = vm?.guests[index];

    if (!vm || !guest) return null;

    return {
      title: this._labels.guestName(guest.fullName, guest.groupType),
      rows: [
        { value: this.t('STATS.STAYS.LABELS.CONNECTIONS', { count: vm.guests.length - 1 }) },
        { value: this.t('STATS.STAYS.LABELS.GROUP', { group: this._labels.groupType(guest.groupType) }) },
        { value: this.t('STATS.STAYS.LABELS.VISIT', { date: this._format.formatDate(guest.visitedDate) }) },
      ],
      country: this._labels.country(guest.hometownCode),
    };
  };

  // VIEW MODELS
  protected buildView(): void {
    this.polarVm = undefined;
    this.maxPeopleVm = undefined;
    this.arrivalVm = undefined;
    this.networkVm = undefined;

    if (!this.stays) return;

    switch (this.selectedView) {
      case 'longest':
      case 'shortest':
        this.polarVm = this.buildPolarVm(this.selectedView);
        break;
      case 'maxPeopleTogether':
        this.maxPeopleVm = this.buildMaxPeopleVm();
        break;
      case 'sameArrival':
        this.arrivalVm = this.buildArrivalVm();
        break;
      case 'sameDates':
        this.networkVm = this.buildNetworkVm();
        break;
    }
  }

  private buildPolarVm(view: 'longest' | 'shortest'): IStaysPolarVm | undefined {
    const items = this.stays[view]?.[this.selectedStayView];

    if (!items?.length) return undefined;

    return {
      title: this.t(`STATS.STAYS.TITLES.${view.toUpperCase()}`),
      labels: items.map(item => this._labels.guestName(item.guest.fullName, item.guest.groupType)),
      // Number of nights determines the section size.
      values: items.map(item => item.nights),
      colors: this.getGenderColors(items.map(item => item.guest)),
      items,
    };
  }

  private buildMaxPeopleVm(): IStaysMaxPeopleVm | undefined {
    const data = this.stays.maxPeopleTogether;

    if (!data?.overall || !data?.solo) return undefined;

    const labels = [this.t('STATS.STAYS.LABELS.OVERALL'), this.t('STATS.STAYS.LABELS.SOLO')];
    return {
      title: this.t('STATS.STAYS.TITLES.MAXIMUM_GUESTS_TOGETHER'),
      labels,
      values: [data.overall.total, data.solo.total],
      colors: paletteToColors(STAYS_COLORS.maxPeopleTogether),
      valueAxisTitle: this.t('STATS.STAYS.LABELS.GUESTS'),
      categoryAxisTitle: this.t('STATS.STAYS.LABELS.STAY_TYPE'),
      entries: [
        { label: labels[0], data: data.overall },
        { label: labels[1], data: data.solo },
      ],
    };
  }

  private buildArrivalVm(): IStaysArrivalVm | undefined {
    const items = this.stays.sameArrival;

    if (!items?.length) return undefined;

    return {
      title: this.t('STATS.STAYS.TITLES.GUESTS_WITH_SAME_ARRIVAL_DATE'),
      datasetLabel: this.t('STATS.STAYS.VIEWS.SAMEARRIVAL'),
      labels: items.map(item => this._format.formatDate(item.date)),
      values: items.map(item => item.total),
      // Unique podium colors; the earliest arrival date breaks ties.
      colors: getPodiumColors(
        items.length,
        getTopIndexes(
          items,
          item => item.total,
          item => new Date(item.date).getTime()
        )
      ),
      legend: this._labels.rankingLegend(),
      valueAxisTitle: this.t('STATS.STAYS.LABELS.OVERLAPPING_GUESTS'),
      categoryAxisTitle: this.t('STATS.STAYS.LABELS.ARRIVAL_DATE'),
      items,
    };
  }

  private buildNetworkVm(): IStaysNetworkVm | undefined {
    const guests = this.stays.sameDates?.[this.selectedSameDatesGroup]?.guests;

    if (!guests?.length) return undefined;

    return {
      title: this.t('STATS.STAYS.TITLES.SAME_DATES_GROUP', { group: this.selectedSameDatesGroup + 1 }),
      labels: guests.map(guest => this._labels.guestName(guest.fullName, guest.groupType)),
      edges: this.getSameDatesEdges(guests.length),
      colors: { ...this.getGenderColors(guests), edges: STAYS_COLORS.networkEdges },
      legend: this._labels.genderLegend(guests.map(guest => guest.gender)),
      guests,
    };
  }

  // Connects every guest with the other guests in the same group.
  private getSameDatesEdges(total: number): IChartEdge[] {
    const edges: IChartEdge[] = [];

    for (let source = 0; source < total; source++) {
      for (let target = source + 1; target < total; target++) {
        edges.push({ source, target });
      }
    }

    return edges;
  }

  // HELPERS
  // Guest gender decides the section / node colors.
  private getGenderColors(guests: { gender: string }[]): IChartColors {
    return {
      background: guests.map(guest => GENDER_COLORS[guest.gender.toLowerCase() as keyof typeof GENDER_COLORS]?.background ?? CHART_NEUTRAL_COLOR),
      border: guests.map(guest => getGenderColor(guest.gender)),
    };
  }

  // ISO dates can be sorted as strings.
  private getDateRange(dates: string[]): { from: string; to: string } {
    const sorted = [...dates].sort();
    return { from: sorted[0], to: sorted[sorted.length - 1] };
  }
}
