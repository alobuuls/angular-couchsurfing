import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';

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

// Services
import { FormatService } from '@services/format.service';
import { GeonameService } from '@services/geoname.service';

// Constants
import { REGION_NAMES } from '@config/world/regions';
import { Continents, CountriesCodes, Language, Regions } from '@type/word.types';
import { WORLD } from '@config/world';

// Helpers
import { CHART_UNKNOWN_COLOR, CONTINENT_COLORS, GENDER_COLORS, getColorWithOpacity, getGenderColor, getRankingColors, RANKING_COLORS } from '@utils';

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private _geoname = inject(GeonameService);

  private langChangeSubscription?: Subscription;
  @Input() geography!: IGeographyDistribution;

  @ViewChild('geographyChart')
  geographyChart!: ElementRef<HTMLCanvasElement>;

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

  private chart?: Chart;

  private getContinent(item: IGeographyContinent | IGeographyRegion | IGeographyCountry | IGeographyLocation): string {
    const code = item.code.toLowerCase();

    // When the item is already a continent.
    if (this.selectedView === 'continents') return code;

    // When the item is a region.
    if (this.selectedView === 'regions') {
      const country = Object.values(WORLD).find(country => country.region.toLowerCase() === code);
      return country?.continent?.toLowerCase() ?? '';
    }

    // When the item is a country, livingIn or hometown location.
    const country = WORLD[code as CountriesCodes];
    return country?.continent?.toLowerCase() ?? '';
  }

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
      getAllData: geography => geography.livingIn.top,
      getTopData: () => [],
      getBottomData: () => [],
    },
    hometown: {
      label: 'STATS.GEOGRAPHY.TITLES.GUESTS_HOMETOWN',
      type: 'bar',
      getAllData: geography => geography.hometown.top,
      getTopData: () => [],
      getBottomData: () => [],
    },
  };

  ngAfterViewInit(): void {
    // Create the initial geography chart after the canvas is rendered.
    if (this.geography) {
      this.createChart();
    }

    // Recreate the chart when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.destroyChart();
      this.createChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when geography data changes.
    if (changes['geography'] && this.geographyChart) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.destroyChart();
  }

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
  }

  selectView(view: IGeographyView): void {
    this.selectedView = view;

    // Reset to the complete data when changing geography.
    this.selectedRanking = 'all';

    // Destroy the previous chart before creating a new one.
    this.destroyChart();

    // Wait for Angular to update the view before creating a new chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  selectRanking(ranking: ICountryRanking): void {
    this.selectedRanking = ranking;

    // Destroy the previous chart before creating a new one.
    this.destroyChart();

    // Create the chart using the selected ranking.
    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    if (!this.geographyChart || !this.geography) {
      return;
    }

    if (this.selectedView === 'countries' && this.selectedRanking === 'mostConsecutive') {
      this.createMostConsecutiveChart();
      return;
    }

    const config = this.chartConfig[this.selectedView];
    const geographyData = this.getSelectedData(config);

    if (!geographyData.length) {
      return;
    }

    this.destroyChart();
    this.setChartHeight(geographyData.length);

    const chartValues =
      this.selectedRanking === 'topFemale'
        ? geographyData.map(item => (item as IGeographyCountry).female)
        : this.selectedRanking === 'topMale'
          ? geographyData.map(item => (item as IGeographyCountry).male)
          : geographyData.map(item => item.total);

    const isRankingChart = this.selectedRanking !== 'all' || this.selectedView === 'livingIn' || this.selectedView === 'hometown';

    const colors = isRankingChart
      ? getRankingColors(chartValues)
      : {
          background: geographyData.map(item => {
            const continent = this.getContinent(item);
            return CONTINENT_COLORS[continent as keyof typeof CONTINENT_COLORS]?.background;
          }),

          border: geographyData.map(item => {
            const continent = this.getContinent(item);
            return CONTINENT_COLORS[continent as keyof typeof CONTINENT_COLORS]?.border;
          }),
        };

    const datasetLabel =
      this.selectedRanking === 'topFemale'
        ? this._translate.instant('STATS.GEOGRAPHY.LABELS.FEMALE_GUESTS')
        : this.selectedRanking === 'topMale'
          ? this._translate.instant('STATS.GEOGRAPHY.LABELS.MALE_GUESTS')
          : this._translate.instant(config.label);

    this.chart = new Chart(this.geographyChart.nativeElement, {
      type: config.type,
      data: {
        labels: geographyData.map(item => {
          if ('name' in item) return item.name;

          if (this.selectedView === 'continents') return this.getContinentName(item.code.toLowerCase() as Continents);

          if (this.selectedView === 'regions')
            return REGION_NAMES[item.code as Regions]?.[this._translate.currentLang as Language] ?? REGION_NAMES[item.code as Regions]?.en ?? item.code;

          if (this.selectedView === 'countries') {
            const code = item.code.toLowerCase() as CountriesCodes;
            return WORLD[code]?.name?.[this._translate.currentLang as Language] ?? WORLD[code]?.name?.en ?? item.code;
          }

          return item.code;
        }),
        datasets: [
          {
            label: datasetLabel,
            data: chartValues,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) return;

          const index = elements[0].index;
          const item = geographyData[index];

          if (!item) return;

          if (this.selectedView === 'continents') {
            const continent = item as IGeographyContinent;
            this.navigateToContinent(continent.code.toLowerCase());
          }

          if (this.selectedView === 'regions') {
            const region = item as IGeographyRegion;
            this.navigateToRegion(region.code);
          }

          if (this.selectedView === 'countries') {
            const country = item as IGeographyCountry;
            this.navigateToCountry(country.code);
          }

          if (this.selectedView === 'livingIn') {
            const location = item as IGeographyLocation;
            this.navigateToLivingIn(location.name);
          }

          if (this.selectedView === 'hometown') {
            const location = item as IGeographyLocation;
            this.navigateToHometown(location.name);
          }
        },
        indexAxis: config.type === 'bar' ? 'y' : 'x',
        plugins: {
          title: {
            display: true,
            text: this.getChartTitle(config.label),
          },
          legend: {
            display: true,
            labels:
              this.selectedView === 'regions' || this.selectedView === 'countries' || this.selectedView === 'livingIn' || this.selectedView === 'hometown'
                ? {
                    generateLabels: () => {
                      const labels = [];

                      // REGIONS
                      if (this.selectedView === 'regions') {
                        // Regions - All
                        if (this.selectedRanking === 'all') {
                          const regions = this.getSelectedData(this.chartConfig.regions) as IGeographyRegion[];

                          if (regions.some(region => this.getContinent(region) === 'america')) {
                            labels.push({
                              text: this._geoname.getContinentName('america'),
                              fillStyle: CONTINENT_COLORS.america.background,
                              strokeStyle: CONTINENT_COLORS.america.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'europe')) {
                            labels.push({
                              text: this._geoname.getContinentName('europe'),
                              fillStyle: CONTINENT_COLORS.europe.background,
                              strokeStyle: CONTINENT_COLORS.europe.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'africa')) {
                            labels.push({
                              text: this._geoname.getContinentName('africa'),
                              fillStyle: CONTINENT_COLORS.africa.background,
                              strokeStyle: CONTINENT_COLORS.africa.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'asia')) {
                            labels.push({
                              text: this._geoname.getContinentName('asia'),
                              fillStyle: CONTINENT_COLORS.asia.background,
                              strokeStyle: CONTINENT_COLORS.asia.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'oceania')) {
                            labels.push({
                              text: this._geoname.getContinentName('oceania'),
                              fillStyle: CONTINENT_COLORS.oceania.background,
                              strokeStyle: CONTINENT_COLORS.oceania.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }
                        }

                        // Regions - Top / Bottom
                        if (this.selectedRanking === 'top' || this.selectedRanking === 'bottom') {
                          labels.push(
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.FIRST'),
                              fillStyle: RANKING_COLORS.gold.background,
                              strokeStyle: RANKING_COLORS.gold.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.SECOND'),
                              fillStyle: RANKING_COLORS.silver.background,
                              strokeStyle: RANKING_COLORS.silver.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.THIRD'),
                              fillStyle: RANKING_COLORS.bronze.background,
                              strokeStyle: RANKING_COLORS.bronze.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.OTHERS'),
                              fillStyle: RANKING_COLORS.neutral.background,
                              strokeStyle: RANKING_COLORS.neutral.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            }
                          );
                        }
                      }
                      // COUNTRIES
                      if (this.selectedView === 'countries') {
                        // Countries - All
                        if (this.selectedRanking === 'all') {
                          const countries = this.getSelectedData(this.chartConfig.countries) as IGeographyCountry[];

                          if (countries.some(country => this.getContinent(country) === 'america')) {
                            labels.push({
                              text: this._geoname.getContinentName('america'),
                              fillStyle: CONTINENT_COLORS.america.background,
                              strokeStyle: CONTINENT_COLORS.america.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'europe')) {
                            labels.push({
                              text: this._geoname.getContinentName('europe'),
                              fillStyle: CONTINENT_COLORS.europe.background,
                              strokeStyle: CONTINENT_COLORS.europe.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'africa')) {
                            labels.push({
                              text: this._geoname.getContinentName('africa'),
                              fillStyle: CONTINENT_COLORS.africa.background,
                              strokeStyle: CONTINENT_COLORS.africa.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'asia')) {
                            labels.push({
                              text: this._geoname.getContinentName('asia'),
                              fillStyle: CONTINENT_COLORS.asia.background,
                              strokeStyle: CONTINENT_COLORS.asia.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'oceania')) {
                            labels.push({
                              text: this._geoname.getContinentName('oceania'),
                              fillStyle: CONTINENT_COLORS.oceania.background,
                              strokeStyle: CONTINENT_COLORS.oceania.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            });
                          }
                        }

                        // Countries - Top / Bottom / Top Female / Top Male
                        if (this.selectedRanking === 'top' || this.selectedRanking === 'bottom' || this.selectedRanking === 'topFemale' || this.selectedRanking === 'topMale') {
                          labels.push(
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.FIRST'),
                              fillStyle: RANKING_COLORS.gold.background,
                              strokeStyle: RANKING_COLORS.gold.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.SECOND'),
                              fillStyle: RANKING_COLORS.silver.background,
                              strokeStyle: RANKING_COLORS.silver.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.THIRD'),
                              fillStyle: RANKING_COLORS.bronze.background,
                              strokeStyle: RANKING_COLORS.bronze.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            },
                            {
                              text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.OTHERS'),
                              fillStyle: RANKING_COLORS.neutral.background,
                              strokeStyle: RANKING_COLORS.neutral.border,
                              lineWidth: 1,
                              fontColor: CHART_UNKNOWN_COLOR,
                            }
                          );
                        }
                      }

                      // LIVING IN / HOMETOWN
                      if (this.selectedView === 'livingIn' || this.selectedView === 'hometown') {
                        labels.push(
                          {
                            text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.FIRST'),
                            fillStyle: RANKING_COLORS.gold.background,
                            strokeStyle: RANKING_COLORS.gold.border,
                            lineWidth: 1,
                            fontColor: CHART_UNKNOWN_COLOR,
                          },
                          {
                            text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.SECOND'),
                            fillStyle: RANKING_COLORS.silver.background,
                            strokeStyle: RANKING_COLORS.silver.border,
                            lineWidth: 1,
                            fontColor: CHART_UNKNOWN_COLOR,
                          },
                          {
                            text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.THIRD'),
                            fillStyle: RANKING_COLORS.bronze.background,
                            strokeStyle: RANKING_COLORS.bronze.border,
                            lineWidth: 1,
                            fontColor: CHART_UNKNOWN_COLOR,
                          },
                          {
                            text: this._translate.instant('STATS.GEOGRAPHY.RANKING_LABELS.OTHERS'),
                            fillStyle: RANKING_COLORS.neutral.background,
                            strokeStyle: RANKING_COLORS.neutral.border,
                            lineWidth: 1,
                            fontColor: CHART_UNKNOWN_COLOR,
                          }
                        );
                      }

                      return labels;
                    },
                  }
                : undefined,
          },
        },
        scales:
          config.type === 'bar'
            ? {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: this._translate.instant('STATS.GEOGRAPHY.LABELS.NUMBER_OF_GUESTS'),
                  },
                },
                y: {
                  beginAtZero: true,
                },
              }
            : undefined,
      },
    });
  }

  private getTranslatedGender(gender: string): string {
    const key = `GENDER.${gender.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? gender : translated;
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

        if (this.selectedRanking === 'bottom') {
          return a.total - b.total;
        }

        return b.total - a.total;
      }) as IGeographyRegion[] | IGeographyCountry[];
    }

    return data;
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

  // Change the chart height.
  private setChartHeight(dataLength: number): void {
    const canvas = this.geographyChart.nativeElement;

    // Countries can contain many entries, so give each item
    // enough vertical space to remain readable.
    if (this.selectedView === 'countries' && this.selectedRanking === 'all') {
      const height = Math.max(500, dataLength * 10);
      canvas.style.height = `${height}px`;
    } else {
      canvas.style.height = '';
    }
  }

  private destroyChart(): void {
    // Destroy the current Chart.js instance.
    this.chart?.destroy();
    this.chart = undefined;
  }

  // FLAG
  getSelectedCountries(): IGeographyCountry[] {
    if (this.selectedRanking === 'mostConsecutive') {
      return [];
    }

    const data = this.getSelectedData(this.chartConfig.countries);
    return data as IGeographyCountry[];
  }

  getCountryName(code: string) {
    return this._format.formatCountry(code);
  }

  // COUNTRY - MOST CONSECUTIVE
  private createMostConsecutiveChart(): void {
    const consecutive = this.geography.countries.mostConsecutive;

    if (!consecutive || !consecutive.guests.length) return;
    this.destroyChart();

    const countryName = this.getCountryName(consecutive.code);
    const guests = [...consecutive.guests].sort((a, b) => new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime());
    const startDate = new Date(consecutive.firstVisit);
    const endDate = new Date(consecutive.lastVisit);
    const minDate = startDate.getTime();
    const maxDate = endDate.getTime();

    // Add some space around the first and last points.
    const datePadding = 24 * 60 * 60 * 1000;

    this.geographyChart.nativeElement.style.height = `${Math.max(250, guests.length * 70)}px`;

    this.chart = new Chart(this.geographyChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.GEOGRAPHY.TITLES.MOST_CONSECUTIVE_VISITS', {
              country: countryName,
              streak: consecutive.streak,
            }),
            data: guests.map(guest => ({
              x: new Date(guest.visitedDate).getTime(),
              y: guest.fullName,
            })),
            pointRadius: 20,
            pointHoverRadius: 10,
            pointBackgroundColor: guests.map(guest =>
              getColorWithOpacity(
                GENDER_COLORS[guest.gender.toLowerCase() as keyof typeof GENDER_COLORS] ?? {
                  background: CHART_UNKNOWN_COLOR,
                  border: CHART_UNKNOWN_COLOR,
                }
              )
            ),
            pointBorderColor: guests.map(guest => getGenderColor(guest.gender)),
            showLine: false,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const guest = guests[index];

          if (!guest?.guestId) {
            return;
          }

          this.navigateToGuest(guest.guestId);
        },
        layout: {
          padding: {
            left: 15,
            right: 15,
            top: 10,
            bottom: 10,
          },
        },
        plugins: {
          title: {
            display: true,
            text: this._translate.instant('STATS.GEOGRAPHY.TITLES.MOST_CONSECUTIVE_VISITS', {
              country: countryName,
              streak: consecutive.streak,
            }),
          },
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (guests.some(guest => guest.gender.toLowerCase() === 'female')) {
                  labels.push({
                    text: this._translate.instant('GENDER.FEMALE'),
                    fillStyle: GENDER_COLORS.female.background,
                    strokeStyle: GENDER_COLORS.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'male')) {
                  labels.push({
                    text: this._translate.instant('GENDER.MALE'),
                    fillStyle: GENDER_COLORS.male.background,
                    strokeStyle: GENDER_COLORS.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'gay')) {
                  labels.push({
                    text: this._translate.instant('GENDER.GAY'),
                    fillStyle: GENDER_COLORS.gay.background,
                    strokeStyle: GENDER_COLORS.gay.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'trans')) {
                  labels.push({
                    text: this._translate.instant('GENDER.TRANS'),
                    fillStyle: GENDER_COLORS.trans.background,
                    strokeStyle: GENDER_COLORS.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const guest = guests[context.dataIndex];

                return [
                  guest.fullName,
                  `${this._translate.instant('GENDER.TXT')}: ${this.getTranslatedGender(guest.gender)}`,
                  `${this._translate.instant('STATS.GEOGRAPHY.LABELS.GROUP')}: ${this._translate.instant(`STATS.DEMOGRAPHICS.GROUPS.${guest.groupType.toUpperCase()}`)}`,
                  `${this._translate.instant('STATS.GEOGRAPHY.LABELS.VISIT')}: ${this._format.formatDate(guest.visitedDate)}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: minDate - datePadding,
            max: maxDate + datePadding,
            ticks: {
              callback: value => {
                const locale = this._translate.currentLang === 'es' ? 'es-CO' : 'en-US';

                return new Date(Number(value)).toLocaleDateString(locale, {
                  month: 'short',
                  day: 'numeric',
                });
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.GEOGRAPHY.LABELS.VISIT_DATE'),
            },
          },
          y: {
            type: 'category',
            labels: guests.map(guest => guest.fullName),
            title: {
              display: true,
              text: this._translate.instant('STATS.GEOGRAPHY.LABELS.GUESTS'),
            },
          },
        },
      },
    });
  }

  // Click on chart
  private navigateToContinent(continent: string): void {
    const filters = continent;
    if (!filters) return;

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        continent: filters,
      },
    });
  }

  private navigateToRegion(region: string): void {
    const filters = region;
    if (!filters) return;

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        region: filters,
      },
    });
  }

  private navigateToCountry(country: string): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        country,
      },
    });
  }

  private navigateToLivingIn(location: string): void {
    if (!location) return;

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        livingIn: location.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  private navigateToHometown(location: string): void {
    if (!location) return;

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        hometown: location.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  private navigateToGuest(guestId: string): void {
    this._router.navigate(['/guests', guestId]);
  }
}
