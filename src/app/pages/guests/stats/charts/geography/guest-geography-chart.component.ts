import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import {
  IChartType,
  ICountryRanking,
  IGeographyContinent,
  IGeographyCountry,
  IGeographyDistribution,
  IGeographyLocation,
  IGeographyRegion,
  IGeographyView,
} from '@interfaces/stats-interface';
import { IChartColors, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import { ConsecutiveGuest, GeographyItem, IConsecutiveChartVm, IGeographyChartVm } from '@interfaces/charts/chart-geography.interface';

// Services
import { FormatService } from '@services/format.service';
import { GeonameService } from '@services/geoname.service';

// Constants
import { getCountryLocation, REGION_CONTINENT_INDEX, REGION_NAMES, WORLD } from '@config/world';
import { Continents, CountriesCodes, Language, Regions } from '@type/word.types';

// Helpers
import { CHART_UNKNOWN_COLOR, CONTINENT_COLORS, GENDER_COLORS, getColorWithOpacity, getGenderColor, getRankingColors, RANKING_COLORS } from '@utils';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private _geoname = inject(GeonameService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  @Input() geography!: IGeographyDistribution;

  // Only one of these two is defined at a time.
  chartVm: IGeographyChartVm | null = null;
  consecutiveVm: IConsecutiveChartVm | null = null;

  // Controls the currently selected geography view.
  selectedView: IGeographyView = 'continents';

  // Controls which part of the selected geography is displayed.
  selectedRanking: ICountryRanking = 'all';

  // Available geography views.
  readonly geographyViews: IGeographyView[] = ['continents', 'regions', 'countries', 'livingIn', 'hometown'];

  readonly geographyViewLabels: Record<IGeographyView, string> = {
    continents: 'STATS.GEOGRAPHY.VIEWS.CONTINENTS',
    regions: 'STATS.GEOGRAPHY.VIEWS.REGIONS',
    countries: 'STATS.GEOGRAPHY.VIEWS.COUNTRIES',
    livingIn: 'STATS.GEOGRAPHY.VIEWS.LIVING_IN',
    hometown: 'STATS.GEOGRAPHY.VIEWS.HOMETOWN',
  };

  // Available ranking views.
  readonly countryRankingViews: ICountryRanking[] = ['topFemale', 'topMale', 'mostConsecutive'];

  readonly rankingViews: ICountryRanking[] = ['all', 'top', 'bottom'];

  // Configuration for each geography view.
  private readonly chartConfig: Record<
    IGeographyView,
    {
      label: string;
      type: IChartType;
      getAllData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
      getTopData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[];
      getBottomData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[];
    }
  > = {
    continents: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_CONTINENT',
      type: 'pie',
      getAllData: geography => geography.continents.all,
      getTopData: () => [],
      getBottomData: () => [],
    },
    regions: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_REGION',
      type: 'bar',
      getAllData: geography => geography.regions.all,
      getTopData: geography => geography.regions.top,
      getBottomData: geography => geography.regions.bottom,
    },
    countries: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_COUNTRY',
      type: 'bar',
      getAllData: geography => geography.countries.all,
      getTopData: geography => geography.countries.top,
      getBottomData: geography => geography.countries.bottom,
    },
    livingIn: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_LIVING_IN',
      type: 'bar',
      getAllData: geography => geography.livingInState.top,
      getTopData: () => [],
      getBottomData: () => [],
    },
    hometown: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_HOMETOWN',
      type: 'bar',
      getAllData: geography => geography.hometownState.top,
      getTopData: () => [],
      getBottomData: () => [],
    },
  };

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    // Rebuild the chart data when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildVm());
  }

  ngOnChanges(): void {
    // Rebuild the chart data when geography data changes.
    this.buildVm();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // ─────────────────────────────────────────────
  // Template actions
  // ─────────────────────────────────────────────

  selectView(view: IGeographyView): void {
    this.selectedView = view;

    // Reset to the complete data when changing geography.
    this.selectedRanking = 'all';
    this.buildVm();
  }

  selectRanking(ranking: ICountryRanking): void {
    this.selectedRanking = ranking;
    this.buildVm();
  }

  // Click on a pie / bar item.
  onChartClick(index: number): void {
    const item = this.chartVm?.items[index];

    if (!item) return;

    switch (this.selectedView) {
      case 'continents':
        this.navigateToContinent(item.code.toLowerCase());
        break;
      case 'regions':
        this.navigateToRegion(item.code);
        break;
      case 'countries':
        this.navigateToCountry(item.code);
        break;
      case 'livingIn':
        this.navigateToLivingIn((item as IGeographyLocation).name);
        break;
      case 'hometown':
        this.navigateToHometown((item as IGeographyLocation).name);
        break;
    }
  }

  // Click on a most consecutive point.
  onConsecutiveClick(index: number): void {
    const guest = this.consecutiveVm?.guests[index];

    if (!guest?.guestId) return;

    this.navigateToGuest(guest.guestId);
  }

  // Tooltip of the most consecutive chart.
  consecutiveTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.consecutiveVm;
    const guest = vm?.guests[index];

    if (!vm || !guest) return null;

    return {
      title: guest.fullName,
      rows: [
        {
          label: this._translate.instant('GENDER.TXT'),
          value: this.getTranslatedGender(guest.gender),
        },
        {
          label: this._translate.instant('STATS.GEOGRAPHY.LABELS.GROUP'),
          value: this._translate.instant(`STATS.DEMOGRAPHICS.GROUPS.${guest.groupType.toUpperCase()}`),
        },
        {
          label: this._translate.instant('STATS.GEOGRAPHY.LABELS.VISIT'),
          value: this._format.formatDate(guest.visitedDate),
        },
      ],
      country: {
        name: vm.countryName,
        flagClass: this._flag.transform(vm.countryCode),
      },
    };
  };

  consecutiveTickFormatter = (value: number | string): string => {
    const locale = this._translate.currentLang === 'es' ? 'es-CO' : 'en-US';

    return new Date(Number(value)).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  // ─────────────────────────────────────────────
  // View model
  // ─────────────────────────────────────────────

  private buildVm(): void {
    this.chartVm = null;
    this.consecutiveVm = null;

    if (!this.geography) return;

    if (this.selectedView === 'countries' && this.selectedRanking === 'mostConsecutive') {
      this.consecutiveVm = this.buildConsecutiveVm();
      return;
    }

    this.chartVm = this.buildChartVm();
  }

  private buildChartVm(): IGeographyChartVm | null {
    const config = this.chartConfig[this.selectedView];
    const items = this.getSelectedData(config) as GeographyItem[];

    if (!items.length) return null;

    const values = items.map(item => {
      if (this.selectedRanking === 'topFemale') return (item as IGeographyCountry).female;
      if (this.selectedRanking === 'topMale') return (item as IGeographyCountry).male;
      return item.total;
    });

    return {
      type: config.type as 'pie' | 'bar',
      title: this.getChartTitle(config.label),
      datasetLabel: this.getDatasetLabel(config.label),
      labels: items.map(item => this.getItemLabel(item)),
      values,
      colors: this.getColors(items, values),
      legend: this.getLegend(items),
      height: this.getChartHeight(items.length),
      items,
    };
  }

  private buildConsecutiveVm(): IConsecutiveChartVm | null {
    const consecutive = this.geography.countries.mostConsecutive;

    if (!consecutive || !consecutive.guests.length) return null;

    const countryName = this.getCountryName(consecutive.code);
    const guests = [...consecutive.guests].sort((a, b) => new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime());

    // Add some space around the first and last points.
    const datePadding = 24 * 60 * 60 * 1000;

    return {
      title: this._translate.instant('STATS.GEOGRAPHY.TITLES.MOST_CONSECUTIVE_VISITS', {
        country: countryName,
        streak: consecutive.streak,
      }),
      countryName,
      countryCode: consecutive.code,
      guests,
      points: guests.map(guest => ({
        x: new Date(guest.visitedDate).getTime(),
        y: guest.fullName,
      })),
      colors: {
        background: guests.map(guest =>
          getColorWithOpacity(
            GENDER_COLORS[guest.gender.toLowerCase() as keyof typeof GENDER_COLORS] ?? {
              background: CHART_UNKNOWN_COLOR,
              border: CHART_UNKNOWN_COLOR,
            }
          )
        ),
        border: guests.map(guest => getGenderColor(guest.gender)),
      },
      legend: this.getGenderLegend(guests),
      xMin: new Date(consecutive.firstVisit).getTime() - datePadding,
      xMax: new Date(consecutive.lastVisit).getTime() + datePadding,
      height: Math.max(250, guests.length * 70),
    };
  }

  // ─────────────────────────────────────────────
  // Colors, legends, labels
  // ─────────────────────────────────────────────

  private getColors(items: GeographyItem[], values: number[]): IChartColors {
    const isRankingChart = this.selectedRanking !== 'all' || this.selectedView === 'livingIn' || this.selectedView === 'hometown';

    if (isRankingChart) {
      const rankingColors = [RANKING_COLORS.gold, RANKING_COLORS.silver, RANKING_COLORS.bronze];

      return {
        background: items.map((_, index) => rankingColors[index]?.background ?? RANKING_COLORS.neutral.background),
        border: items.map((_, index) => rankingColors[index]?.border ?? RANKING_COLORS.neutral.border),
      };
    }

    const continentColor = (item: GeographyItem, key: 'background' | 'border'): string =>
      CONTINENT_COLORS[this.getContinent(item) as keyof typeof CONTINENT_COLORS]?.[key] ?? CHART_UNKNOWN_COLOR;

    return {
      background: items.map(item => continentColor(item, 'background')),
      border: items.map(item => continentColor(item, 'border')),
    };
  }

  private getLegend(items: GeographyItem[]): IChartLegendItem[] | null {
    // Pie chart uses the default legend.
    if (this.selectedView === 'continents') return null;

    // Living in / hometown and every ranking use the ranking legend.
    if (this.selectedView === 'livingIn' || this.selectedView === 'hometown' || this.selectedRanking !== 'all') {
      return this.getRankingLegend();
    }

    // Regions / countries with all data use the continent legend.
    return this.getContinentLegend(items);
  }

  private getContinentLegend(items: GeographyItem[]): IChartLegendItem[] {
    const present = new Set(items.map(item => this.getContinent(item)));

    return (['america', 'europe', 'africa', 'asia', 'oceania'] as const)
      .filter(continent => present.has(continent))
      .map(continent => ({
        text: this._geoname.getContinentName(continent),
        background: CONTINENT_COLORS[continent].background,
        border: CONTINENT_COLORS[continent].border,
      }));
  }

  private getRankingLegend(): IChartLegendItem[] {
    const text = (key: string) => this._translate.instant(`STATS.GEOGRAPHY.RANKING_LABELS.${key}`);

    return [
      { text: text('FIRST'), background: RANKING_COLORS.gold.background, border: RANKING_COLORS.gold.border },
      { text: text('SECOND'), background: RANKING_COLORS.silver.background, border: RANKING_COLORS.silver.border },
      { text: text('THIRD'), background: RANKING_COLORS.bronze.background, border: RANKING_COLORS.bronze.border },
      { text: text('OTHERS'), background: RANKING_COLORS.neutral.background, border: RANKING_COLORS.neutral.border },
    ];
  }

  private getGenderLegend(guests: ConsecutiveGuest[]): IChartLegendItem[] {
    return (['female', 'male', 'gay', 'trans'] as const)
      .filter(gender => guests.some(guest => guest.gender.toLowerCase() === gender))
      .map(gender => ({
        text: this._translate.instant(`GENDER.${gender.toUpperCase()}`),
        background: GENDER_COLORS[gender].background,
        border: GENDER_COLORS[gender].border,
      }));
  }

  private getItemLabel(item: GeographyItem): string {
    if ('name' in item) return item.name;

    const lang = this._translate.currentLang as Language;

    if (this.selectedView === 'continents') {
      return this._geoname.getContinentName(item.code.toLowerCase() as Continents);
    }

    if (this.selectedView === 'regions') {
      return REGION_NAMES[item.code as Regions]?.[lang] ?? REGION_NAMES[item.code as Regions]?.en ?? item.code;
    }

    if (this.selectedView === 'countries') {
      const code = item.code.toLowerCase() as CountriesCodes;
      return WORLD[code]?.name?.[lang] ?? WORLD[code]?.name?.en ?? item.code;
    }

    return item.code;
  }

  private getDatasetLabel(label: string): string {
    if (this.selectedRanking === 'topFemale') return this._translate.instant('STATS.GEOGRAPHY.LABELS.FEMALE_GUESTS');
    if (this.selectedRanking === 'topMale') return this._translate.instant('STATS.GEOGRAPHY.LABELS.MALE_GUESTS');
    return this._translate.instant(label);
  }

  private getChartTitle(label: string): string {
    const translatedLabel = this._translate.instant(label);

    const rankingTitles: Record<ICountryRanking, string> = {
      all: translatedLabel,
      top: `${translatedLabel} - ${this._translate.instant('STATS.GEOGRAPHY.RANKINGS.TOP')}`,
      bottom: `${translatedLabel} - ${this._translate.instant('STATS.GEOGRAPHY.RANKINGS.BOTTOM')}`,
      topFemale: `${translatedLabel} - ${this._translate.instant('STATS.GEOGRAPHY.RANKINGS.TOP_FEMALE')}`,
      topMale: `${translatedLabel} - ${this._translate.instant('STATS.GEOGRAPHY.RANKINGS.TOP_MALE')}`,
      mostConsecutive: `${translatedLabel} - ${this._translate.instant('STATS.GEOGRAPHY.RANKINGS.MOST_CONSECUTIVE')}`,
    };

    return rankingTitles[this.selectedRanking];
  }

  // Countries can contain many entries, so give each item
  // enough vertical space to remain readable.
  private getChartHeight(dataLength: number): number | undefined {
    if (this.selectedView === 'countries' && this.selectedRanking === 'all') {
      return Math.max(500, dataLength * 10);
    }

    return undefined;
  }

  private getTranslatedGender(gender: string): string {
    const key = `GENDER.${gender.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? gender : translated;
  }

  private getCountryName(code: string): string {
    return this._format.formatCountry(code);
  }

  // ─────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────

  private getContinent(item: GeographyItem): string {
    const code = item.code.toLowerCase();
    // When the item is already a continent.
    if (this.selectedView === 'continents') return code;
    // When the item is a region.
    if (this.selectedView === 'regions') return REGION_CONTINENT_INDEX[code as Regions] ?? '';
    // When the item is a country, livingIn or hometown location.
    return getCountryLocation(code)?.continent ?? '';
  }

  private getSelectedData(config: {
    getAllData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
    getTopData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[];
    getBottomData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[];
  }): IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[] {
    const rankingData = {
      all: config.getAllData(this.geography),
      top: config.getTopData(this.geography) ?? [],
      bottom: config.getBottomData(this.geography) ?? [],
      topFemale: this.selectedView === 'countries' ? this.geography.countries.topFemale : [],
      topMale: this.selectedView === 'countries' ? this.geography.countries.topMale : [],
    };

    const ranking = this.selectedRanking as 'all' | 'top' | 'bottom' | 'topFemale' | 'topMale';
    const data = rankingData[ranking];

    if (this.selectedView === 'regions' || this.selectedView === 'countries') {
      return [...data].sort((a, b) => {
        if (this.selectedRanking === 'topFemale') {
          return (b as IGeographyCountry).female - (a as IGeographyCountry).female;
        }

        if (this.selectedRanking === 'topMale') {
          return (b as IGeographyCountry).male - (a as IGeographyCountry).male;
        }

        const totalComparison = this.selectedRanking === 'bottom' ? a.total - b.total : b.total - a.total;

        if (totalComparison !== 0) return totalComparison;

        // In case of a tie, the earliest first visit wins.
        const firstVisitA = (a as IGeographyRegion | IGeographyCountry).firstVisit;
        const firstVisitB = (b as IGeographyRegion | IGeographyCountry).firstVisit;

        return new Date(firstVisitA).getTime() - new Date(firstVisitB).getTime();
      }) as IGeographyRegion[] | IGeographyCountry[];
    }

    // Living in / hometown keep the order provided by the backend.
    if (this.selectedView === 'livingIn' || this.selectedView === 'hometown') {
      return data;
    }

    return data;
  }

  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────

  private navigateToContinent(continent: string): void {
    if (!continent) return;

    this._router.navigate(['/guests'], { queryParams: { view: 'cards', continent } });
  }

  private navigateToRegion(region: string): void {
    if (!region) return;

    this._router.navigate(['/guests'], { queryParams: { view: 'cards', region } });
  }

  private navigateToCountry(country: string): void {
    this._router.navigate(['/guests'], { queryParams: { view: 'cards', country } });
  }

  private navigateToLivingIn(location: string): void {
    if (!location) return;

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', livingInState: location.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  private navigateToHometown(location: string): void {
    if (!location) return;

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', hometownState: location.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  private navigateToGuest(guestId: string): void {
    this._router.navigate(['/guests', guestId]);
  }
}
