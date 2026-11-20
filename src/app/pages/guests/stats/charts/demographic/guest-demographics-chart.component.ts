import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Services
import { FormatService } from '@services/format.service';
import { LanguageService } from '@core/services/language.service';

// Pipes
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

// Interfaces
import { IDemographicsDistribution, IDemographicsView, IDemographicsTotalsView, IDemographicsOldestView } from '@interfaces/stats-interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';
import { IFirstLastRow, TColor, TGroupRow } from '@interfaces/charts/chart-demographics.interface';
import { IChartColors, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import {
  IDemographicsBubbleVm,
  IDemographicsFirstLastItem,
  IDemographicsFirstLastVm,
  IDemographicsGroupsBarVm,
  IDemographicsPerson,
  IDemographicsPersonItem,
  IDemographicsPieVm,
  IDemographicsRankingBarVm,
  IDemographicsScatterVm,
  TAgeMode,
  TDemographicKey,
  TGroupKey,
} from '@interfaces/charts/chart-demographics.interface';

// Helpers
import { CHART_NEUTRAL_COLOR, GENDER_COLORS, getColorWithOpacity, getRankingColors, GROUP_COLORS, RANKING_COLORS } from '@utils';

const DEMOGRAPHIC_KEYS: TDemographicKey[] = ['male', 'female', 'trans', 'isGay'];
const GROUP_KEYS: TGroupKey[] = ['couple', 'friends', 'family'];
const GROUP_ROWS: TGroupRow[] = ['solo', ...GROUP_KEYS];

const GENDER_LABELS: Record<TDemographicKey, string> = {
  male: 'GENDER.MALE',
  female: 'GENDER.FEMALE',
  trans: 'GENDER.TRANS',
  isGay: 'GENDER.GAY',
};

const GENDER_PALETTE: Record<TDemographicKey, TColor> = {
  male: GENDER_COLORS.male,
  female: GENDER_COLORS.female,
  trans: GENDER_COLORS.trans,
  isGay: GENDER_COLORS.gay,
};

const GROUP_PALETTE: Record<TGroupKey, TColor> = {
  couple: GROUP_COLORS.Couple,
  friends: GROUP_COLORS.Friends,
  family: GROUP_COLORS.Family,
};

// When a guest appears in several solo lists: isGay wins over trans, trans wins over the rest.
const DEMOGRAPHIC_PRIORITY: Record<TDemographicKey, number> = { male: 0, female: 0, trans: 1, isGay: 2 };

const GENDER_NAVIGATION: Record<TDemographicKey, Partial<IQueryParamsGuests>> = {
  male: { gender: 'male' },
  female: { gender: 'female' },
  trans: { gender: 'trans' },
  isGay: { gay: true },
};

const GROUP_NAVIGATION: Record<TGroupRow, IQueryParamsGuests['groupType']> = {
  solo: 'solo',
  couple: 'couple',
  friends: 'friends',
  family: 'family',
};

@Component({
  selector: 'guest-demographics-chart',
  templateUrl: './guest-demographics-chart.component.html',
  styleUrls: ['./guest-demographics-chart.component.css'],
})
export class GuestDemographicsChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private _language = inject(LanguageService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  // Demographic data received from the parent component.
  @Input() demographics!: IDemographicsDistribution;

  // Main views.
  selectedView: IDemographicsView = 'totals';
  readonly demographicsViews: IDemographicsView[] = ['totals', 'oldest', 'youngest', 'firstLast'];
  readonly demographicsViewLabels: Record<IDemographicsView, string> = {
    totals: 'STATS.DEMOGRAPHICS.VIEWS.TOTALS',
    oldest: 'STATS.DEMOGRAPHICS.VIEWS.OLDEST',
    youngest: 'STATS.DEMOGRAPHICS.VIEWS.YOUNGEST',
    firstLast: 'STATS.DEMOGRAPHICS.VIEWS.FIRST_LAST',
  };

  // Sub-views.
  selectedTotalsView: IDemographicsTotalsView = 'overall';
  readonly demographicTotalsViews: IDemographicsTotalsView[] = ['overall', 'groups'];

  selectedAgeView: IDemographicsOldestView = 'overall';
  readonly demographicAgeViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  selectedFirstLastView: IDemographicsOldestView = 'overall';
  readonly demographicFirstLastViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  // Only one of them is defined at a time.
  pieVm?: IDemographicsPieVm;
  groupsBarVm?: IDemographicsGroupsBarVm;
  rankingBarVm?: IDemographicsRankingBarVm;
  scatterVm?: IDemographicsScatterVm;
  bubbleVm?: IDemographicsBubbleVm;
  firstLastVm?: IDemographicsFirstLastVm;

  // Shared axis titles.
  ageTitle = '';
  visitDateTitle = '';
  groupTitle = '';

  get dateLocale() {
    return this._language.dateFnsLocale;
  }

  // Translated group labels used in chart tooltips.
  get groupLabels(): Record<string, string> {
    return {
      couple: this.translate('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
      friends: this.translate('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
      family: this.translate('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
    };
  }

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildView());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['demographics']) {
      this.buildView();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  getSubViewLabel(view: string): string {
    return this.translate(`STATS.DEMOGRAPHICS.SUBVIEWS.${view.toUpperCase()}`);
  }

  selectView(view: IDemographicsView): void {
    this.selectedView = view;
    this.buildView();
  }

  selectTotalsView(view: IDemographicsTotalsView): void {
    this.selectedTotalsView = view;
    this.buildView();
  }

  selectAgeView(view: IDemographicsOldestView): void {
    this.selectedAgeView = view;
    this.buildView();
  }

  selectFirstLastView(view: IDemographicsOldestView): void {
    this.selectedFirstLastView = view;
    this.buildView();
  }

  // FORMATTERS (arrow functions: stable references that keep `this`)
  // Y axis of the groups bubble chart: 1 = couple, 2 = friends, 3 = family.
  groupTickFormatter = (value: number | string): string => {
    const key = GROUP_KEYS[Number(value) - 1];
    return key ? this.translate(`STATS.DEMOGRAPHICS.GROUPS.${key.toUpperCase()}`) : '';
  };

  // CLICKS
  onPieClick(index: number): void {
    const filters = GENDER_NAVIGATION[DEMOGRAPHIC_KEYS[index]];

    if (filters) {
      this._router.navigate(['/guests'], { queryParams: { view: 'cards', ...filters } });
    }
  }

  onGroupsBarClick({ datasetIndex, index }: { datasetIndex: number; index: number }): void {
    const gender = GENDER_NAVIGATION[DEMOGRAPHIC_KEYS[datasetIndex]];
    const groupType = GROUP_NAVIGATION[GROUP_ROWS[index]];

    if (!gender || !groupType) {
      return;
    }

    this._router.navigate(['/guests'], { queryParams: { view: 'cards', ...gender, groupType } });
  }

  onRankingClick(index: number): void {
    this.navigateToItem(this.rankingBarVm?.items[index]);
  }

  onScatterClick(index: number): void {
    this.navigateToItem(this.scatterVm?.items[index]);
  }

  onBubbleClick(index: number): void {
    this.navigateToItem(this.bubbleVm?.items[index]);
  }

  onFirstLastClick({ datasetIndex, index }: { datasetIndex: number; index: number }): void {
    const entry = this.firstLastVm?.items[datasetIndex]?.[index];

    if (entry) {
      this.navigateToGuest(entry.person.guestId, entry.person.groupType, entry.person.groupId);
    }
  }

  // TOOLTIPS
  getRankingTooltip = (index: number): TChartTooltipContent | null => this.personTooltip(this.rankingBarVm?.items[index], { gender: true });

  getScatterTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.scatterVm?.items[index];
    // The gender is only shown when it is not obvious from the color.
    return this.personTooltip(item, { gender: item?.demographic === 'isGay' || item?.demographic === 'trans' });
  };

  getBubbleTooltip = (index: number): TChartTooltipContent | null => this.personTooltip(this.bubbleVm?.items[index], { gender: true, group: true });

  getFirstLastTooltip = (index: number, datasetIndex: number): TChartTooltipContent | null => {
    const vm = this.firstLastVm;
    const entry = vm?.items[datasetIndex]?.[index];

    if (!vm || !entry) {
      return null;
    }

    const { person, type } = entry;
    const typeLabel = this.translate(type === 'first' ? 'STATS.DEMOGRAPHICS.RANKING.FIRST' : 'STATS.DEMOGRAPHICS.RANKING.LAST');
    const groupLabel = person.groupType && person.groupType !== 'solo' ? ` and ${this.groupLabels[person.groupType]}` : '';

    return {
      title: `${typeLabel}: ${person.fullName}${groupLabel}`,
      rows: [
        ...(vm.showGender ? [{ label: this.translate('GENDER.TXT'), value: this._format.formatGender(person.gender) }] : []),
        ...(vm.yTitle ? [{ label: vm.yTitle, value: vm.yLabels[datasetIndex] }] : []),
        { label: this.translate('STATS.DEMOGRAPHICS.LABELS.VISIT'), value: this._format.formatDate(person.visitedDate) },
      ],
      country: this.country(person.hometownCode),
    };
  };

  // VIEW MODELS
  private buildView(): void {
    this.pieVm = this.groupsBarVm = this.rankingBarVm = this.scatterVm = this.bubbleVm = this.firstLastVm = undefined;

    if (!this.demographics) {
      return;
    }

    this.ageTitle = this.translate('STATS.DEMOGRAPHICS.LABELS.AGE');
    this.visitDateTitle = this.translate('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE');
    this.groupTitle = this.translate('STATS.DEMOGRAPHICS.LABELS.GROUP');

    switch (this.selectedView) {
      case 'totals':
        if (this.selectedTotalsView === 'overall') {
          this.pieVm = this.buildPieVm();
        } else {
          this.groupsBarVm = this.buildGroupsBarVm();
        }
        break;

      case 'oldest':
      case 'youngest':
        this.buildAgeView(this.selectedView);
        break;

      case 'firstLast':
        this.firstLastVm = this.buildFirstLastVm();
        break;
    }
  }

  private buildAgeView(mode: TAgeMode): void {
    switch (this.selectedAgeView) {
      case 'overall':
        this.rankingBarVm = this.buildRankingBarVm(mode);
        break;
      case 'solo':
        this.scatterVm = this.buildSoloScatterVm(mode);
        break;
      case 'groups':
        this.bubbleVm = this.buildGroupsBubbleVm(mode);
        break;
    }
  }

  // TOTALS
  private buildPieVm(): IDemographicsPieVm {
    const overall = this.demographics.totals.overall;
    const palette = DEMOGRAPHIC_KEYS.map(key => GENDER_PALETTE[key]);

    return {
      datasetLabel: this.translate('GENDER.TXT'),
      labels: DEMOGRAPHIC_KEYS.map(key => this.translate(GENDER_LABELS[key])),
      values: DEMOGRAPHIC_KEYS.map(key => overall[key]),
      colors: { background: palette.map(color => getColorWithOpacity(color)), border: palette.map(color => color.border) },
    };
  }

  private buildGroupsBarVm(): IDemographicsGroupsBarVm {
    const groups = this.demographics.totals.groups;

    return {
      labels: [this.translate('STATS.DEMOGRAPHICS.SUBVIEWS.SOLO'), ...GROUP_KEYS.map(key => this.translate(`STATS.DEMOGRAPHICS.GROUPS.${key.toUpperCase()}`))],
      // One series per demographic, one value per group (solo, couple, friends, family).
      series: DEMOGRAPHIC_KEYS.map(key => ({
        label: this.translate(GENDER_LABELS[key]),
        values: GROUP_ROWS.map(row => groups[row][key]),
        colors: this.uniformColors(GENDER_PALETTE[key], GROUP_ROWS.length),
      })),
    };
  }

  // OLDEST / YOUNGEST - OVERALL
  private buildRankingBarVm(mode: TAgeMode): IDemographicsRankingBarVm | undefined {
    const items = (this.demographics[mode].overall.people as IDemographicsPerson[])
      .filter(person => person.birthDate)
      .map(person => this.toItem(person))
      .sort((a, b) => (mode === 'oldest' ? b.age - a.age : a.age - b.age));

    if (!items.length) {
      return undefined;
    }

    const suffix = mode.toUpperCase();
    const podium = [
      { key: `RANKING.${suffix}`, color: RANKING_COLORS.gold },
      { key: `RANKING.SECOND_${suffix}`, color: RANKING_COLORS.silver },
      { key: `RANKING.THIRD_${suffix}`, color: RANKING_COLORS.bronze },
    ];

    const legend: IChartLegendItem[] = podium.map(({ key, color }) => ({
      text: this.translate(`STATS.DEMOGRAPHICS.${key}`),
      background: getColorWithOpacity(color),
      border: color.border,
    }));

    if (mode === 'oldest') {
      legend.push({
        text: this.translate('STATS.DEMOGRAPHICS.RANKING.OTHER'),
        background: RANKING_COLORS.neutral.background,
        border: RANKING_COLORS.neutral.border,
      });
    }

    const ages = items.map(item => item.age);

    return {
      datasetLabel: this.ageTitle,
      labels: items.map(item => item.name),
      values: ages,
      colors: getRankingColors(ages),
      legend,
      items,
    };
  }

  // OLDEST / YOUNGEST - SOLO
  private buildSoloScatterVm(mode: TAgeMode): IDemographicsScatterVm | undefined {
    const items = this.getSoloPeople(mode)
      .filter(person => person.birthDate)
      .map(person => this.toItem(person, person.demographic));

    if (!items.length) {
      return undefined;
    }

    return {
      datasetLabel: this.translate('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS'),
      points: items.map(item => ({ x: new Date(item.visitedDate).getTime(), y: item.age })),
      colors: {
        background: items.map(item => GENDER_PALETTE[item.demographic].background),
        border: items.map(item => GENDER_PALETTE[item.demographic].border),
      },
      legend: this.buildGenderLegend(items.map(item => item.demographic)),
      items,
    };
  }

  // OLDEST / YOUNGEST - GROUPS
  private buildGroupsBubbleVm(mode: TAgeMode): IDemographicsBubbleVm | undefined {
    const data = this.demographics[mode];

    const items = GROUP_KEYS.flatMap(group => (data[group] as IDemographicsPerson[]).filter(person => person.birthDate).map(person => ({ ...this.toItem(person), group })));

    if (!items.length) {
      return undefined;
    }

    return {
      datasetLabel: this.translate('STATS.DEMOGRAPHICS.LABELS.GROUPS'),
      // Y axis: 1 = couple, 2 = friends, 3 = family (see groupTickFormatter).
      points: items.map(item => ({ x: item.age, y: GROUP_KEYS.indexOf(item.group) + 1, r: 20 })),
      colors: {
        background: items.map(item => getColorWithOpacity(GROUP_PALETTE[item.group])),
        border: items.map(item => GROUP_PALETTE[item.group].border),
      },
      legend: this.buildGroupLegend(items.map(item => item.group)),
      items,
    };
  }

  // FIRST LAST
  private buildFirstLastVm(): IDemographicsFirstLastVm | undefined {
    switch (this.selectedFirstLastView) {
      case 'overall':
        return this.buildOverallFirstLastVm();
      case 'solo':
        return this.buildSoloFirstLastVm();
      case 'groups':
        return this.buildGroupsFirstLastVm();
    }
  }

  private buildOverallFirstLastVm(): IDemographicsFirstLastVm | undefined {
    const { first, last } = this.demographics.firstLast.overall.people;
    const entries = this.toEntries(first, last, person => GENDER_PALETTE[person.gender as TDemographicKey]);

    return this.toFirstLastVm({
      rows: entries.length ? [{ label: this.translate('STATS.DEMOGRAPHICS.LABELS.OVERALL_DEMOGRAPHICS'), entries, lineColor: CHART_NEUTRAL_COLOR }] : [],
      yTitle: '',
      showGender: true,
      legend: this.buildGenderLegend(entries.map(entry => entry.person.gender as TDemographicKey)),
    });
  }

  private buildSoloFirstLastVm(): IDemographicsFirstLastVm | undefined {
    const solo = this.demographics.firstLast.solo;
    // Only categories with both a first and a last guest are drawn.
    const keys = DEMOGRAPHIC_KEYS.filter(key => solo[key].first && solo[key].last);

    return this.toFirstLastVm({
      rows: keys.map(key => ({
        label: `${this.translate(GENDER_LABELS[key])} (${this.translate('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        entries: this.toEntries(solo[key].first, solo[key].last, () => GENDER_PALETTE[key]),
        lineColor: GENDER_PALETTE[key].border,
      })),
      yTitle: this.translate('STATS.DEMOGRAPHICS.LABELS.CATEGORY'),
      showGender: false,
      legend: this.buildGenderLegend(keys),
    });
  }

  private buildGroupsFirstLastVm(): IDemographicsFirstLastVm | undefined {
    const firstLast = this.demographics.firstLast;
    const keys = GROUP_KEYS.filter(key => firstLast[key].first && firstLast[key].last);

    return this.toFirstLastVm({
      rows: keys.map(key => ({
        label: this.translate(`STATS.DEMOGRAPHICS.GROUPS.${key.toUpperCase()}`),
        entries: this.toEntries(firstLast[key].first, firstLast[key].last, () => GROUP_PALETTE[key]),
        lineColor: GROUP_PALETTE[key].border,
      })),
      yTitle: this.groupTitle,
      showGender: true,
      legend: this.buildGroupLegend(keys),
    });
  }

  private toFirstLastVm(config: { rows: IFirstLastRow[]; yTitle: string; showGender: boolean; legend: IChartLegendItem[] }): IDemographicsFirstLastVm | undefined {
    const { rows, yTitle, showGender, legend } = config;

    if (!rows.length) {
      return undefined;
    }

    return {
      yLabels: rows.map(row => row.label),
      yTitle,
      showGender,
      legend,
      series: rows.map(row => ({
        label: row.label,
        // Each row is a category of the Y axis; first and last share the same Y.
        points: row.entries.map(entry => ({ x: new Date(entry.person.visitedDate).getTime(), y: row.label })),
        colors: {
          background: row.entries.map(entry => entry.color.background),
          border: row.entries.map(entry => entry.color.border),
        },
        lineColor: row.lineColor,
      })),
      items: rows.map(row => row.entries.map(({ type, person }) => ({ type, person }))),
    };
  }

  // HELPERS
  private translate(key: string, params?: Record<string, unknown>): string {
    return this._translate.instant(key, params);
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthday = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

    if (!hasHadBirthday) {
      age--;
    }

    return age;
  }

  // Only call with people that have a birth date.
  private toItem(person: IDemographicsPerson, demographic: TDemographicKey = person.gender as TDemographicKey): IDemographicsPersonItem {
    return {
      name: person.fullName,
      guestId: person.guestId,
      age: this.calculateAge(person.birthDate!),
      gender: person.gender,
      demographic,
      visitedDate: person.visitedDate,
      country: person.hometownCode,
    };
  }

  // Solo guests from every demographic list, without duplicates (the highest priority wins).
  private getSoloPeople(mode: TAgeMode): (IDemographicsPerson & { demographic: TDemographicKey })[] {
    const solo = this.demographics[mode].solo;
    const people = DEMOGRAPHIC_KEYS.flatMap(key => (solo[key] as IDemographicsPerson[]).map(person => ({ ...person, demographic: key })));

    const byGuest = new Map<string, (typeof people)[number]>();

    for (const person of people) {
      const existing = byGuest.get(person.guestId);

      if (!existing || DEMOGRAPHIC_PRIORITY[person.demographic] > DEMOGRAPHIC_PRIORITY[existing.demographic]) {
        byGuest.set(person.guestId, person);
      }
    }

    return Array.from(byGuest.values());
  }

  private toEntries(
    first: IDemographicsPerson | null | undefined,
    last: IDemographicsPerson | null | undefined,
    colorFor: (person: IDemographicsPerson) => TColor
  ): IFirstLastRow['entries'] {
    return [
      ...(first ? [{ type: 'first' as const, person: first, color: colorFor(first) }] : []),
      ...(last ? [{ type: 'last' as const, person: last, color: colorFor(last) }] : []),
    ];
  }

  private uniformColors(color: TColor, count: number): IChartColors {
    return {
      background: Array(count).fill(getColorWithOpacity(color)),
      border: Array(count).fill(color.border),
    };
  }

  private buildGenderLegend(keys: TDemographicKey[]): IChartLegendItem[] {
    return DEMOGRAPHIC_KEYS.filter(key => keys.includes(key)).map(key => ({
      text: this.translate(GENDER_LABELS[key]),
      background: getColorWithOpacity(GENDER_PALETTE[key]),
      border: GENDER_PALETTE[key].border,
    }));
  }

  private buildGroupLegend(keys: TGroupKey[]): IChartLegendItem[] {
    return GROUP_KEYS.filter(key => keys.includes(key)).map(key => ({
      text: this.translate(`STATS.DEMOGRAPHICS.GROUPS.${key.toUpperCase()}`),
      background: getColorWithOpacity(GROUP_PALETTE[key]),
      border: GROUP_PALETTE[key].border,
    }));
  }

  private country(code: string) {
    return { name: this._format.formatCountry(code), flagClass: this._flag.transform(code) };
  }

  private personTooltip(item: IDemographicsPersonItem | undefined, options: { gender?: boolean; group?: boolean } = {}): TChartTooltipContent | null {
    if (!item) {
      return null;
    }

    return {
      title: item.name,
      rows: [
        { label: this.ageTitle, value: String(item.age) },
        ...(options.gender ? [{ label: this.translate('GENDER.TXT'), value: this._format.formatGender(item.gender) }] : []),
        ...(options.group && item.group ? [{ label: this.groupTitle, value: this.groupLabels[item.group] }] : []),
        { label: this.translate('STATS.DEMOGRAPHICS.LABELS.VISIT'), value: this._format.formatDate(item.visitedDate) },
      ],
      country: this.country(item.country),
    };
  }

  // NAVIGATION
  private navigateToItem(item?: IDemographicsPersonItem): void {
    if (item) {
      this.navigateToGuest(item.guestId);
    }
  }

  private navigateToGuest(guestId: string, groupType?: string, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }
}
