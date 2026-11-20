import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { ILongestView, IStaysDistribution, IStaysView } from '@interfaces/stats-interface';
import { IChartEdge, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';

// Services
import { FormatService } from '@services/format.service';

// Helpers
import { CHART_NEUTRAL_COLOR, GENDER_COLORS, getGenderColor, getRankingColors, RANKING_COLORS, STAYS_COLORS } from '@utils';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';
import { IStaysArrivalVm, IStaysMaxPeopleVm, IStaysNetworkVm, IStaysPolarVm, TMaxPeople, TSameDatesGuest } from '@interfaces/charts/chart-stays.interface';

@Component({
  selector: 'guest-stays-chart',
  templateUrl: './guest-stays-chart.component.html',
  styleUrls: ['./guest-stays-chart.component.css'],
})
export class GuestStaysChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  // Stays data received from parent.
  @Input() stays!: IStaysDistribution;

  // Stores the main selected Stays view.
  selectedView: IStaysView = 'longest';

  // Main Stays views.
  readonly staysViews: IStaysView[] = ['longest', 'shortest', 'maxPeopleTogether', 'sameArrival', 'sameDates'];

  // Stores the selected Longest/Shortest subview.
  selectedStayView: ILongestView = 'overall';

  // Longest and Shortest subviews.
  readonly stayViews: ILongestView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // Stores the selected Same Dates group.
  selectedSameDatesGroup = 0;

  // Only one of them is defined at a time.
  polarVm?: IStaysPolarVm;
  maxPeopleVm?: IStaysMaxPeopleVm;
  arrivalVm?: IStaysArrivalVm;
  networkVm?: IStaysNetworkVm;

  // Configuration for Longest and Shortest views.
  private readonly chartConfig: Record<'longest' | 'shortest', { labelKey: string; getData: (stays: IStaysDistribution) => IStaysDistribution['longest'] }> = {
    longest: { labelKey: 'STATS.STAYS.TITLES.LONGEST', getData: stays => stays.longest },
    shortest: { labelKey: 'STATS.STAYS.TITLES.SHORTEST', getData: stays => stays.shortest },
  };

  // Group type translation keys for tooltips and guest labels.
  private readonly groupTypeKeys: Record<string, string> = {
    solo: 'STATS.STAYS.GROUP_LABELS.SOLO',
    couple: 'STATS.STAYS.GROUP_LABELS.COUPLE',
    friends: 'STATS.STAYS.GROUP_LABELS.FRIENDS',
    family: 'STATS.STAYS.GROUP_LABELS.FAMILY',
  };

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildView());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stays']) {
      // Reset the selected group when new data arrives.
      this.selectedSameDatesGroup = 0;
      this.buildView();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // Changes the main Stays view.
  selectView(view: IStaysView): void {
    this.selectedView = view;

    // Reset Same Dates group when entering this view.
    if (view === 'sameDates') {
      this.selectedSameDatesGroup = 0;
    }

    this.buildView();
  }

  // Changes the selected Longest/Shortest subview.
  selectStayView(view: ILongestView): void {
    this.selectedStayView = view;
    this.buildView();
  }

  // Changes the selected Same Dates group.
  selectSameDatesGroup(index: number): void {
    this.selectedSameDatesGroup = index;
    this.buildView();
  }

  // CLICKS
  onPolarClick(index: number): void {
    const guest = this.polarVm?.items[index]?.guest;

    if (guest?.guestId) {
      this.navigateToGuest(guest.guestId, guest.groupType, guest.groupId);
    }
  }

  onMaxPeopleClick(index: number): void {
    const entry = this.maxPeopleVm?.entries[index];

    if (entry) {
      this.navigateToPeopleTogether(entry.data.guests);
    }
  }

  onArrivalClick(index: number): void {
    const item = this.arrivalVm?.items[index];

    if (!item?.date) {
      return;
    }

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', from: item.date, to: item.date },
    });
  }

  onNetworkClick(index: number): void {
    const guest = this.networkVm?.guests[index];

    if (guest?.guestId) {
      this.navigateToGuest(guest.guestId, guest.groupType, guest.groupId);
    }
  }

  // TOOLTIPS (arrow functions: stable references that keep `this`)
  getPolarTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.polarVm?.items[index];

    if (!item) {
      return null;
    }

    const guest = item.guest;
    const rows: TChartTooltipContent['rows'] = [{ value: this.translate('STATS.STAYS.LABELS.TOTAL_NIGHTS', { count: item.nights }) }];

    if (this.selectedStayView === 'overall') {
      rows.push({ value: this.translate('STATS.STAYS.LABELS.GROUP', { group: this.translateGroupType(guest.groupType) }) });
    }

    rows.push({ value: this.translate('STATS.STAYS.LABELS.VISIT', { date: this._format.formatDate(guest.visitedDate) }) });

    return {
      title: this.getGuestDisplayName(guest.fullName, guest.groupType),
      rows,
      country: {
        name: this._format.formatCountry(guest.hometownCode),
        flagClass: this._flag.transform(guest.hometownCode),
      },
    };
  };

  getMaxPeopleTooltip = (index: number): TChartTooltipContent | null => {
    const entry = this.maxPeopleVm?.entries[index];

    if (!entry) {
      return null;
    }

    const guests = entry.data.guests;

    return {
      title: guests[0] ? this._format.formatDate(guests[0].visitedDate) : entry.label,
      rows: [{ value: this.translate('STATS.STAYS.LABELS.GUESTS_COUNT', { count: entry.data.total }) }, ...this.getGuestRows(guests)],
    };
  };

  getArrivalTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.arrivalVm?.items[index];

    if (!item) {
      return null;
    }

    return {
      title: this._format.formatDate(item.date),
      rows: [{ value: this.translate('STATS.STAYS.LABELS.GUESTS_COUNT', { count: item.total }) }, ...this.getGuestRows(item.guests)],
    };
  };

  getNetworkTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.networkVm;
    const guest = vm?.guests[index];

    if (!vm || !guest) {
      return null;
    }

    return {
      title: this.getGuestDisplayName(guest.fullName, guest.groupType),
      rows: [
        { value: this.translate('STATS.STAYS.LABELS.CONNECTIONS', { count: vm.guests.length - 1 }) },
        { value: this.translate('STATS.STAYS.LABELS.GROUP', { group: this.translateGroupType(guest.groupType) }) },
        { value: this.translate('STATS.STAYS.LABELS.VISIT', { date: this._format.formatDate(guest.visitedDate) }) },
      ],
      country: {
        name: this._format.formatCountry(guest.hometownCode),
        flagClass: this._flag.transform(guest.hometownCode),
      },
    };
  };

  // VIEW MODELS
  private buildView(): void {
    this.polarVm = undefined;
    this.maxPeopleVm = undefined;
    this.arrivalVm = undefined;
    this.networkVm = undefined;

    if (!this.stays) {
      return;
    }

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
    const config = this.chartConfig[view];
    const items = config.getData(this.stays)?.[this.selectedStayView];

    if (!items?.length) {
      return undefined;
    }

    return {
      title: this.translate(config.labelKey),
      labels: items.map(item => this.getGuestDisplayName(item.guest.fullName, item.guest.groupType)),
      // Number of nights determines the section size.
      values: items.map(item => item.nights),
      // Use guest gender for section colors.
      colors: {
        background: items.map(item => this.getGenderBackground(item.guest.gender)),
        border: items.map(item => getGenderColor(item.guest.gender)),
      },
      items,
    };
  }

  private buildMaxPeopleVm(): IStaysMaxPeopleVm | undefined {
    const data = this.stays.maxPeopleTogether;

    if (!data?.overall || !data?.solo) {
      return undefined;
    }

    const labels = [this.translate('STATS.STAYS.LABELS.OVERALL'), this.translate('STATS.STAYS.LABELS.SOLO')];

    return {
      title: this.translate('STATS.STAYS.TITLES.MAXIMUM_GUESTS_TOGETHER'),
      labels,
      values: [data.overall.total, data.solo.total],
      colors: {
        background: STAYS_COLORS.maxPeopleTogether.map(color => color.background),
        border: STAYS_COLORS.maxPeopleTogether.map(color => color.border),
      },
      valueAxisTitle: this.translate('STATS.STAYS.LABELS.GUESTS'),
      categoryAxisTitle: this.translate('STATS.STAYS.LABELS.STAY_TYPE'),
      entries: [
        { label: labels[0], data: data.overall },
        { label: labels[1], data: data.solo },
      ],
    };
  }

  private buildArrivalVm(): IStaysArrivalVm | undefined {
    const items = this.stays.sameArrival;

    if (!items?.length) {
      return undefined;
    }

    const title = this.translate('STATS.STAYS.TITLES.GUESTS_WITH_SAME_ARRIVAL_DATE');

    return {
      title,
      datasetLabel: this.translate('STATS.STAYS.VIEWS.SAMEARRIVAL'),
      labels: items.map(item => this._format.formatDate(item.date)),
      values: items.map(item => item.total),
      // Get ranking colors based on the number of guests.
      colors: getRankingColors(items.map(item => item.total)),
      legend: this.getRankingLegend(),
      valueAxisTitle: this.translate('STATS.STAYS.LABELS.OVERLAPPING_GUESTS'),
      categoryAxisTitle: this.translate('STATS.STAYS.LABELS.ARRIVAL_DATE'),
      items,
    };
  }

  private buildNetworkVm(): IStaysNetworkVm | undefined {
    const group = this.stays.sameDates?.[this.selectedSameDatesGroup];

    if (!group?.guests?.length) {
      return undefined;
    }

    const guests = group.guests;

    return {
      title: this.translate('STATS.STAYS.TITLES.SAME_DATES_GROUP', { group: this.selectedSameDatesGroup + 1 }),
      labels: guests.map(guest => this.getGuestDisplayName(guest.fullName, guest.groupType)),
      edges: this.getSameDatesEdges(guests.length),
      // Use guest gender for node colors.
      colors: {
        background: guests.map(guest => this.getGenderBackground(guest.gender)),
        border: guests.map(guest => getGenderColor(guest.gender)),
        edges: STAYS_COLORS.networkEdges,
      },
      legend: this.getGenderLegend(guests),
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

  private getRankingLegend(): IChartLegendItem[] {
    const entries = [
      ['FIRST', RANKING_COLORS.gold],
      ['SECOND', RANKING_COLORS.silver],
      ['THIRD', RANKING_COLORS.bronze],
      ['OTHERS', RANKING_COLORS.neutral],
    ] as const;

    return entries.map(([key, color]) => ({
      text: this.translate(`STATS.STAYS.LABELS.${key}`),
      background: color.background,
      border: color.border,
    }));
  }

  private getGenderLegend(guests: TSameDatesGuest[]): IChartLegendItem[] {
    const genders = [...new Set(guests.map(guest => guest.gender.toLowerCase()))];

    return genders
      .filter(gender => gender in GENDER_COLORS)
      .map(gender => {
        const color = GENDER_COLORS[gender as keyof typeof GENDER_COLORS];

        return { text: this.translateGender(gender), background: color.background, border: color.border };
      });
  }

  // HELPERS
  private getGenderBackground(gender: string): string {
    return GENDER_COLORS[gender.toLowerCase() as keyof typeof GENDER_COLORS]?.background ?? CHART_NEUTRAL_COLOR;
  }

  private getGuestRows(guests: { fullName: string; hometownCode?: string | null }[]): TChartTooltipContent['rows'] {
    return guests.map(guest => ({
      value: `• ${guest.fullName}`,
      ...(guest.hometownCode
        ? {
            country: {
              name: this._format.formatCountry(guest.hometownCode),
              flagClass: this._flag.transform(guest.hometownCode),
            },
          }
        : {}),
    }));
  }

  private getGuestDisplayName(fullName: string, groupType: string | null): string {
    if (!groupType || groupType === 'solo') {
      return fullName;
    }

    const groupLabelKey = this.groupTypeKeys[groupType];

    if (!groupLabelKey) {
      return fullName;
    }

    return this.translate('STATS.STAYS.LABELS.GROUP_NAME', {
      name: fullName,
      group: this.translate(groupLabelKey),
    });
  }

  // Translate a group type, keeping the original value as fallback.
  private translateGroupType(groupType: string | null): string {
    if (!groupType) {
      return '';
    }

    const key = this.groupTypeKeys[groupType];

    return key ? this.translate(key) : groupType;
  }

  // Translate a gender, keeping the original value if no translation exists.
  private translateGender(gender: string): string {
    const key = `GENDER.${gender.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? gender.charAt(0).toUpperCase() + gender.slice(1) : translated;
  }

  // Return a translated string using the current language.
  private translate(key: string, params?: Record<string, string | number>): string {
    const translated = this._translate.instant(key, params);

    // Keep a readable fallback if a translation key is missing.
    return translated === key ? (key.split('.').pop() ?? key) : translated;
  }

  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }

  private navigateToPeopleTogether(guests: TMaxPeople['guests']): void {
    if (!guests.length) {
      return;
    }

    const dates = guests.map(guest => guest.visitedDate);
    const from = dates.reduce((earliest, date) => (date < earliest ? date : earliest));
    const to = dates.reduce((latest, date) => (date > latest ? date : latest));

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', from, to },
    });
  }
}
