import { Component, inject, Input } from '@angular/core';

// Services
import { FormatService } from '@shared/services/format.service';
import { LanguageService } from '@core/services/language.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Interfaces
import { IDemographicsDistribution, IDemographicsView, IDemographicsTotalsView, IDemographicsOldestView } from '@interfaces/stats-interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';
import { IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import {
  IDemographicsBubbleVm,
  IDemographicsFirstLastVm,
  IDemographicsGroupsBarVm,
  IDemographicsPerson,
  IDemographicsPersonItem,
  IDemographicsPieVm,
  IDemographicsRankingBarVm,
  IDemographicsScatterVm,
  IFirstLastRow,
  TAgeMode,
  TColor,
  TDemographicKey,
  TGroupKey,
  TGroupRow,
} from '@interfaces/charts/chart-demographics.interface';

// Helpers
import {
  CHART_NEUTRAL_COLOR,
  GENDER_COLORS,
  getApproximateAge,
  getBirthYear,
  getColorWithOpacity,
  getPodiumColors,
  GROUP_COLORS,
  paletteToColors,
  RANKING_COLORS,
} from '@utils';

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
export class GuestDemographicsChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _language = inject(LanguageService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

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

  // ─────────────────────────────────────────────
  // Template actions
  // ─────────────────────────────────────────────

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

  // Y axis of the groups bubble chart: 1 = couple, 2 = friends, 3 = family.
  groupTickFormatter = (value: number | string): string => {
    const key = GROUP_KEYS[Number(value) - 1];

    return key ? this._labels.groupType(key) : '';
  };

  // CLICKS
  onPieClick(index: number): void {
    const filters = GENDER_NAVIGATION[DEMOGRAPHIC_KEYS[index]];

    if (filters) this._nav.toList(filters);
  }

  onGroupsBarClick({ datasetIndex, index }: { datasetIndex: number; index: number }): void {
    const gender = GENDER_NAVIGATION[DEMOGRAPHIC_KEYS[datasetIndex]];
    const groupType = GROUP_NAVIGATION[GROUP_ROWS[index]];

    if (gender && groupType) this._nav.toList({ ...gender, groupType });
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
    const person = this.firstLastVm?.items[datasetIndex]?.[index]?.person;

    if (person) this._nav.toGuest(person.guestId, person.groupType, person.groupId);
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

    if (!vm || !entry) return null;

    const { person, type } = entry;
    const typeLabel = this.t(type === 'first' ? 'STATS.DEMOGRAPHICS.RANKING.FIRST' : 'STATS.DEMOGRAPHICS.RANKING.LAST');
    const hasGroup = !!person.groupType && person.groupType !== 'solo';

    return {
      title: hasGroup
        ? this.t('STATS.DEMOGRAPHICS.TOOLTIPS.FIRST_LAST_WITH_GROUP', {
            type: typeLabel,
            name: person.fullName,
            group: this._labels.groupType(person.groupType),
          })
        : `${typeLabel}: ${person.fullName}`,
      rows: [
        ...(vm.showGender ? [{ label: this.t('GENDER.TXT'), value: this._format.formatGender(person.gender) }] : []),
        ...(vm.yTitle ? [{ label: vm.yTitle, value: vm.yLabels[datasetIndex] }] : []),
        { label: this.t('STATS.DEMOGRAPHICS.LABELS.VISIT'), value: this._format.formatDate(person.visitedDate) },
      ],
      country: this._labels.country(person.hometownCode),
    };
  };

  // ─────────────────────────────────────────────
  // View models
  // ─────────────────────────────────────────────

  protected buildView(): void {
    this.resetVms();

    if (!this.demographics) return;

    this.ageTitle = this.t('STATS.DEMOGRAPHICS.LABELS.AGE');
    this.visitDateTitle = this.t('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE');
    this.groupTitle = this.t('STATS.DEMOGRAPHICS.LABELS.GROUP');

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

  private resetVms(): void {
    this.pieVm = undefined;
    this.groupsBarVm = undefined;
    this.rankingBarVm = undefined;
    this.scatterVm = undefined;
    this.bubbleVm = undefined;
    this.firstLastVm = undefined;
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

    return {
      datasetLabel: this.t('GENDER.TXT'),
      labels: DEMOGRAPHIC_KEYS.map(key => this.t(GENDER_LABELS[key])),
      values: DEMOGRAPHIC_KEYS.map(key => overall[key]),
      colors: paletteToColors(DEMOGRAPHIC_KEYS.map(key => GENDER_PALETTE[key])),
    };
  }

  private buildGroupsBarVm(): IDemographicsGroupsBarVm {
    const groups = this.demographics.totals.groups;

    return {
      labels: GROUP_ROWS.map(row => this._labels.groupType(row)),
      // One series per demographic, one value per group (solo, couple, friends, family).
      series: DEMOGRAPHIC_KEYS.map(key => ({
        label: this.t(GENDER_LABELS[key]),
        values: GROUP_ROWS.map(row => groups[row][key]),
        colors: paletteToColors(GROUP_ROWS.map(() => GENDER_PALETTE[key])),
      })),
    };
  }

  // OLDEST / YOUNGEST - OVERALL
  private buildRankingBarVm(mode: TAgeMode): IDemographicsRankingBarVm | undefined {
    const people = [...this.demographics[mode].overall.people]
      .filter(person => getBirthYear(person.birthDate) !== null)
      .sort((a, b) => {
        const birthComparison = this.compareBirthDates(a.birthDate!, b.birthDate!);

        // Oldest: earlier birth dates first. Youngest: later birth dates first.
        if (birthComparison !== 0) return mode === 'oldest' ? birthComparison : -birthComparison;

        // Tie-breaker: the guest who was hosted first wins.
        return new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime();
      });

    const items = people.map(person => this.toItem(person));

    if (!items.length) return undefined;

    const podium = [
      { key: `RANKING.${mode.toUpperCase()}`, color: RANKING_COLORS.gold },
      { key: `RANKING.SECOND_${mode.toUpperCase()}`, color: RANKING_COLORS.silver },
      { key: `RANKING.THIRD_${mode.toUpperCase()}`, color: RANKING_COLORS.bronze },
    ];

    const legend: IChartLegendItem[] = [
      ...podium.map(({ key, color }) => ({
        text: this.t(`STATS.DEMOGRAPHICS.${key}`),
        background: getColorWithOpacity(color),
        border: color.border,
      })),
      { text: this.t('STATS.DEMOGRAPHICS.RANKING.OTHER'), background: RANKING_COLORS.neutral.background, border: RANKING_COLORS.neutral.border },
    ];

    return {
      datasetLabel: this.ageTitle,
      labels: items.map(item => item.name),
      values: items.map(item => item.age),
      colors: getPodiumColors(items.length),
      legend,
      items,
    };
  }

  // Month and day are compared only when both dates have them.
  private compareBirthDates(a: string, b: string): number {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);

    return ay - by || (am && bm ? am - bm : 0) || (ad && bd ? ad - bd : 0);
  }

  // OLDEST / YOUNGEST - SOLO
  private buildSoloScatterVm(mode: TAgeMode): IDemographicsScatterVm | undefined {
    const items = this.getSoloPeople(mode)
      .filter(person => getBirthYear(person.birthDate) !== null)
      .map(person => this.toItem(person, person.demographic));

    if (!items.length) return undefined;

    return {
      datasetLabel: this.t('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS'),
      points: items.map(item => ({ x: new Date(item.visitedDate).getTime(), y: item.age })),
      colors: paletteToColors(items.map(item => GENDER_PALETTE[item.demographic])),
      legend: this.buildGenderLegend(items.map(item => item.demographic)),
      items,
    };
  }

  // OLDEST / YOUNGEST - GROUPS
  private buildGroupsBubbleVm(mode: TAgeMode): IDemographicsBubbleVm | undefined {
    const data = this.demographics[mode];

    const items = GROUP_KEYS.flatMap(group =>
      (data[group] as IDemographicsPerson[]).filter(person => getBirthYear(person.birthDate) !== null).map(person => ({ ...this.toItem(person), group }))
    );

    if (!items.length) return undefined;

    return {
      datasetLabel: this.t('STATS.DEMOGRAPHICS.LABELS.GROUPS'),
      // Y axis: 1 = couple, 2 = friends, 3 = family (see groupTickFormatter).
      points: items.map(item => ({ x: item.age, y: GROUP_KEYS.indexOf(item.group) + 1, r: 20 })),
      colors: paletteToColors(items.map(item => GROUP_PALETTE[item.group])),
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
      rows: entries.length ? [{ label: this.t('STATS.DEMOGRAPHICS.LABELS.OVERALL_DEMOGRAPHICS'), entries, lineColor: CHART_NEUTRAL_COLOR }] : [],
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
        label: `${this.t(GENDER_LABELS[key])} (${this.t('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        entries: this.toEntries(solo[key].first, solo[key].last, () => GENDER_PALETTE[key]),
        lineColor: GENDER_PALETTE[key].border,
      })),
      yTitle: this.t('STATS.DEMOGRAPHICS.LABELS.CATEGORY'),
      showGender: false,
      legend: this.buildGenderLegend(keys),
    });
  }

  private buildGroupsFirstLastVm(): IDemographicsFirstLastVm | undefined {
    const firstLast = this.demographics.firstLast;
    const keys = GROUP_KEYS.filter(key => firstLast[key].first && firstLast[key].last);

    return this.toFirstLastVm({
      rows: keys.map(key => ({
        label: this._labels.groupType(key),
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

    if (!rows.length) return undefined;

    return {
      yLabels: rows.map(row => row.label),
      yTitle,
      showGender,
      legend,
      series: rows.map(row => ({
        label: row.label,
        // Each row is a category of the Y axis; first and last share the same Y.
        points: row.entries.map(entry => ({ x: new Date(entry.person.visitedDate).getTime(), y: row.label })),
        colors: paletteToColors(row.entries.map(entry => entry.color)),
        lineColor: row.lineColor,
      })),
      items: rows.map(row => row.entries.map(({ type, person }) => ({ type, person }))),
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  // Only call with people that have a birth date.
  private toItem(person: IDemographicsPerson, demographic: TDemographicKey = person.gender as TDemographicKey): IDemographicsPersonItem {
    return {
      name: person.fullName,
      guestId: person.guestId,
      age: getApproximateAge(person.birthDate) ?? 0,
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

  // Legend with the `present` keys, always in the order of `all`.
  private buildLegend<K extends string>(present: K[], all: K[], palette: Record<K, TColor>, label: (key: K) => string): IChartLegendItem[] {
    return all.filter(key => present.includes(key)).map(key => ({ text: label(key), background: getColorWithOpacity(palette[key]), border: palette[key].border }));
  }

  private buildGenderLegend(keys: TDemographicKey[]): IChartLegendItem[] {
    return this.buildLegend(keys, DEMOGRAPHIC_KEYS, GENDER_PALETTE, key => this.t(GENDER_LABELS[key]));
  }

  private buildGroupLegend(keys: TGroupKey[]): IChartLegendItem[] {
    return this.buildLegend(keys, GROUP_KEYS, GROUP_PALETTE, key => this._labels.groupType(key));
  }

  private personTooltip(item: IDemographicsPersonItem | undefined, options: { gender?: boolean; group?: boolean } = {}): TChartTooltipContent | null {
    if (!item) return null;

    return {
      title: item.name,
      rows: [
        { label: this.ageTitle, value: String(item.age) },
        ...(options.gender ? [{ label: this.t('GENDER.TXT'), value: this._format.formatGender(item.gender) }] : []),
        ...(options.group && item.group ? [{ label: this.groupTitle, value: this._labels.groupType(item.group) }] : []),
        { label: this.t('STATS.DEMOGRAPHICS.LABELS.VISIT'), value: this._format.formatDate(item.visitedDate) },
      ],
      country: this._labels.country(item.country),
    };
  }

  private navigateToItem(item?: IDemographicsPersonItem): void {
    if (item) this._nav.toGuest(item.guestId);
  }
}
