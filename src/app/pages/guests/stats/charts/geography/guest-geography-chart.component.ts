import { Component, inject, Input } from '@angular/core';

// Interfaces
import { ICountryRanking, IGeographyCountry, IGeographyDistribution, IGeographyLocation, IGeographyRegion, IGeographyView } from '@interfaces/stats-interface';
import { IChartColors, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import { ConsecutiveGuest, GeographyItem, IConsecutiveChartVm, IGeographyChartVm, IGeographyViewConfig } from '@interfaces/charts/stats-chart-vm.interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GeonameService } from '@shared/services/geoname.service';
import { LanguageService } from '@core/services/language.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Constants
import { getCountryLocation, REGION_CONTINENT_INDEX } from '@config/world';
import { Continents, Regions } from '@type/word.types';

// Helpers
import { CHART_UNKNOWN_COLOR, CONTINENT_COLORS, GENDER_COLORS, getColorWithOpacity, getGenderColor, getPodiumColors } from '@utils';

const VIEW_CONFIG: Record<IGeographyView, IGeographyViewConfig> = {
  continents: { titleKey: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_CONTINENT', type: 'pie', getAllData: g => g.continents.all },
  regions: {
    titleKey: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_REGION',
    type: 'bar',
    getAllData: g => g.regions.all,
    getTopData: g => g.regions.top,
    getBottomData: g => g.regions.bottom,
  },
  countries: {
    titleKey: 'STATS.GEOGRAPHY.TITLES.GUESTS_BY_COUNTRY',
    type: 'bar',
    getAllData: g => g.countries.all,
    getTopData: g => g.countries.top,
    getBottomData: g => g.countries.bottom,
  },
  livingIn: { titleKey: 'STATS.GEOGRAPHY.TITLES.GUESTS_LIVING_IN', type: 'bar', getAllData: g => g.livingInState.top },
  hometown: { titleKey: 'STATS.GEOGRAPHY.TITLES.GUESTS_HOMETOWN', type: 'bar', getAllData: g => g.hometownState.top },
};

const ALL_RANKINGS: ICountryRanking[] = ['all', 'top', 'bottom'];
const COUNTRY_RANKINGS: ICountryRanking[] = ['topFemale', 'topMale', 'mostConsecutive'];

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _geoname = inject(GeonameService);
  private readonly _language = inject(LanguageService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() geography!: IGeographyDistribution;

  // Must match `.country-label { height }` and `.country-labels { padding-top }` in the CSS.
  private static readonly ROW_HEIGHT = 25.5;
  private static readonly CHART_TOP = 64; // title + legend (4rem)
  private static readonly CHART_BOTTOM = 60; // x axis ticks + axis title

  // Only one of these two is defined at a time.
  chartVm: IGeographyChartVm | null = null;
  consecutiveVm: IConsecutiveChartVm | null = null;

  selectedView: IGeographyView = 'continents';
  selectedRanking: ICountryRanking = 'all';

  readonly geographyViews: IGeographyView[] = ['continents', 'regions', 'countries', 'livingIn', 'hometown'];

  readonly geographyViewLabels: Record<IGeographyView, string> = {
    continents: 'STATS.GEOGRAPHY.VIEWS.CONTINENTS',
    regions: 'STATS.GEOGRAPHY.VIEWS.REGIONS',
    countries: 'STATS.GEOGRAPHY.VIEWS.COUNTRIES',
    livingIn: 'STATS.GEOGRAPHY.VIEWS.LIVING_IN',
    hometown: 'STATS.GEOGRAPHY.VIEWS.HOMETOWN',
  };

  // Used by the ranking buttons and by the chart title.
  readonly rankingLabels: Record<ICountryRanking, string> = {
    all: 'STATS.GEOGRAPHY.RANKINGS.ALL',
    top: 'STATS.GEOGRAPHY.RANKINGS.TOP',
    bottom: 'STATS.GEOGRAPHY.RANKINGS.BOTTOM',
    topFemale: 'STATS.GEOGRAPHY.RANKINGS.TOP_FEMALE',
    topMale: 'STATS.GEOGRAPHY.RANKINGS.TOP_MALE',
    mostConsecutive: 'STATS.GEOGRAPHY.RANKINGS.MOST_CONSECUTIVE',
  };

  // Ranking buttons available in each view (continents, living in and hometown have none).
  readonly rankingButtons: Partial<Record<IGeographyView, ICountryRanking[]>> = {
    regions: ALL_RANKINGS,
    countries: [...ALL_RANKINGS, ...COUNTRY_RANKINGS],
  };

  // ─────────────────────────────────────────────
  // Template actions
  // ─────────────────────────────────────────────

  selectView(view: IGeographyView): void {
    this.selectedView = view;
    // Reset to the complete data when changing geography.
    this.selectedRanking = 'all';
    this.buildView();
  }

  selectRanking(ranking: ICountryRanking): void {
    this.selectedRanking = ranking;
    this.buildView();
  }

  onChartClick(index: number): void {
    const item = this.chartVm?.items[index];

    if (item) {
      this._nav.toList(this.getFilters(item));
    }
  }

  onConsecutiveClick(index: number): void {
    const guest = this.consecutiveVm?.guests[index];

    if (guest?.guestId) {
      this._nav.toGuest(guest.guestId);
    }
  }

  consecutiveTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.consecutiveVm;
    const guest = vm?.guests[index];

    if (!vm || !guest) return null;

    return {
      title: guest.fullName,
      rows: [
        { label: this.t('GENDER.TXT'), value: this._format.formatGender(guest.gender) },
        { label: this.t('STATS.GEOGRAPHY.LABELS.GROUP'), value: this._labels.groupType(guest.groupType) },
        { label: this.t('STATS.GEOGRAPHY.LABELS.VISIT'), value: this._format.formatDate(guest.visitedDate) },
      ],
      country: this._labels.country(vm.countryCode),
    };
  };

  consecutiveTickFormatter = (value: number | string): string => new Date(Number(value)).toLocaleDateString(this._language.currentLocale, { month: 'short', day: 'numeric' });

  // ─────────────────────────────────────────────
  // View model
  // ─────────────────────────────────────────────

  protected buildView(): void {
    this.chartVm = null;
    this.consecutiveVm = null;

    if (!this.geography) return;

    if (this.selectedView === 'countries' && this.selectedRanking === 'mostConsecutive') {
      this.consecutiveVm = this.buildConsecutiveVm();
    } else {
      this.chartVm = this.buildChartVm();
    }
  }

  private buildChartVm(): IGeographyChartVm | null {
    const config = VIEW_CONFIG[this.selectedView];
    const items = this.getSelectedData(config);

    if (!items.length) return null;

    return {
      type: config.type,
      title: this.getChartTitle(config.titleKey),
      datasetLabel: this.getDatasetLabel(config.titleKey),
      labels: items.map(item => this.getItemLabel(item)),
      values: items.map(item => this.getItemValue(item)),
      colors: this.getColors(items),
      legend: this.getLegend(items),
      height: this.getChartHeight(items.length),
      items,
    };
  }

  private buildConsecutiveVm(): IConsecutiveChartVm | null {
    const consecutive = this.geography.countries.mostConsecutive;

    if (!consecutive?.guests.length) return null;

    const countryName = this._format.formatCountry(consecutive.code);
    const guests = [...consecutive.guests].sort((a, b) => new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime());

    // Add some space around the first and last points.
    const datePadding = 24 * 60 * 60 * 1000;

    return {
      title: this.t('STATS.GEOGRAPHY.TITLES.MOST_CONSECUTIVE_VISITS', { country: countryName, streak: consecutive.streak }),
      countryName,
      countryCode: consecutive.code,
      guests,
      points: guests.map(guest => ({ x: new Date(guest.visitedDate).getTime(), y: guest.fullName })),
      colors: {
        background: guests.map(guest =>
          getColorWithOpacity(GENDER_COLORS[guest.gender.toLowerCase() as keyof typeof GENDER_COLORS] ?? { background: CHART_UNKNOWN_COLOR, border: CHART_UNKNOWN_COLOR })
        ),
        border: guests.map(guest => getGenderColor(guest.gender)),
      },
      legend: this._labels.genderLegend(guests.map((guest: ConsecutiveGuest) => guest.gender)),
      xMin: new Date(consecutive.firstVisit).getTime() - datePadding,
      xMax: new Date(consecutive.lastVisit).getTime() + datePadding,
      height: Math.max(250, guests.length * 70),
    };
  }

  // ─────────────────────────────────────────────
  // Colors, legends, labels
  // ─────────────────────────────────────────────

  private getColors(items: GeographyItem[]): IChartColors {
    const isRankingChart = this.selectedRanking !== 'all' || this.selectedView === 'livingIn' || this.selectedView === 'hometown';

    if (isRankingChart) {
      return getPodiumColors(items.length);
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
      return this._labels.rankingLegend();
    }

    // Regions / countries with all the data use the continent legend.
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

  private getItemLabel(item: GeographyItem): string {
    if ('name' in item) return item.name;

    switch (this.selectedView) {
      case 'continents':
        return this._geoname.getContinentName(item.code.toLowerCase() as Continents);
      case 'regions':
        return this._geoname.getRegionName(item.code as Regions);
      case 'countries':
        return this._format.formatCountry(item.code);
      default:
        return item.code;
    }
  }

  private getItemValue(item: GeographyItem): number {
    if (this.selectedRanking === 'topFemale') return (item as IGeographyCountry).female;
    if (this.selectedRanking === 'topMale') return (item as IGeographyCountry).male;

    return item.total;
  }

  private getDatasetLabel(label: string): string {
    if (this.selectedRanking === 'topFemale') return this.t('STATS.GEOGRAPHY.LABELS.FEMALE_GUESTS');
    if (this.selectedRanking === 'topMale') return this.t('STATS.GEOGRAPHY.LABELS.MALE_GUESTS');

    return this.t(label);
  }

  private getChartTitle(label: string): string {
    const title = this.t(label);

    return this.selectedRanking === 'all' ? title : `${title} - ${this.t(this.rankingLabels[this.selectedRanking])}`;
  }

  // Countries can contain many entries, so each row needs the same height as its flag.
  private getChartHeight(dataLength: number): number | undefined {
    if (this.selectedView !== 'countries' || this.selectedRanking !== 'all') return undefined;

    const { ROW_HEIGHT, CHART_TOP, CHART_BOTTOM } = GuestGeographyChartComponent;
    return Math.ceil(dataLength * ROW_HEIGHT + CHART_TOP + CHART_BOTTOM);
  }

  // ─────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────

  private getContinent(item: GeographyItem): string {
    const code = item.code.toLowerCase();

    // The item is already a continent.
    if (this.selectedView === 'continents') return code;
    // The item is a region.
    if (this.selectedView === 'regions') return REGION_CONTINENT_INDEX[code as Regions] ?? '';
    // The item is a country, livingIn or hometown location.
    return getCountryLocation(code)?.continent ?? '';
  }

  private getSelectedData(config: IGeographyViewConfig): GeographyItem[] {
    const { countries } = this.geography;
    const isCountries = this.selectedView === 'countries';

    const byRanking = {
      all: config.getAllData(this.geography),
      top: config.getTopData?.(this.geography) ?? [],
      bottom: config.getBottomData?.(this.geography) ?? [],
      topFemale: isCountries ? countries.topFemale : [],
      topMale: isCountries ? countries.topMale : [],
    };

    const data = byRanking[this.selectedRanking as keyof typeof byRanking];

    // Living in / hometown keep the order provided by the backend.
    const isSorted = this.selectedView === 'regions' || this.selectedView === 'countries';

    return isSorted ? [...data].sort((a, b) => this.compareItems(a, b)) : data;
  }

  private compareItems(a: GeographyItem, b: GeographyItem): number {
    if (this.selectedRanking === 'topFemale') return (b as IGeographyCountry).female - (a as IGeographyCountry).female;
    if (this.selectedRanking === 'topMale') return (b as IGeographyCountry).male - (a as IGeographyCountry).male;

    const totalDifference = this.selectedRanking === 'bottom' ? a.total - b.total : b.total - a.total;

    if (totalDifference !== 0) return totalDifference;

    // In case of a tie, the earliest first visit wins.
    const firstVisit = (item: GeographyItem) => new Date((item as IGeographyRegion | IGeographyCountry).firstVisit).getTime();

    return firstVisit(a) - firstVisit(b);
  }

  // Guests filter opened by an item.
  private getFilters(item: GeographyItem): Partial<IQueryParamsGuests> {
    switch (this.selectedView) {
      case 'continents':
        return { continent: item.code.toLowerCase() };
      case 'regions':
        return { region: item.code };
      case 'countries':
        return { country: item.code };
      case 'livingIn':
        return { livingInState: this.slug(item) };
      case 'hometown':
        return { hometownState: this.slug(item) };
    }
  }

  private slug(item: GeographyItem): string {
    return (item as IGeographyLocation).name.toLowerCase().replace(/\s+/g, '-');
  }
}
