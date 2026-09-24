import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

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
import { IQueryParamsGuests } from '@interfaces/guests.interface';

// Services
import { FormatService } from '@services/format.service';

// Constants
import { REGION_NAMES } from '@config/world/regions';
import { CountriesCodes, Regions } from '@type/word.types';
import { WORLD } from '@config/world';

// Helpers
import { CONTINENT_COLORS, GENDER_COLORS, getGenderColor, getRankingColors, RANKING_COLORS } from '../../../../../utils/helpers/chart-colors';

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent implements AfterViewInit, OnChanges {
  private _format = inject(FormatService);
  private _router = inject(Router);

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
    continents: 'Continents',
    regions: 'Regions',
    countries: 'Countries',
    livingIn: 'Living In',
    hometown: 'Hometown',
  };

  // Available ranking views.
  readonly countryRankingViews: ICountryRanking[] = ['topFemale', 'topMale', 'mostConsecutive'];

  readonly rankingViews: ICountryRanking[] = ['all', 'top', 'bottom'];

  private chart?: Chart;

  private getContinent(item: IGeographyContinent | IGeographyRegion | IGeographyCountry | IGeographyLocation): string {
    const code = item.code.toLowerCase();
    // When the item is already a continent.
    if (this.selectedView === 'continents') {
      return code;
    }
    // When the item is a region.
    if (this.selectedView === 'regions') {
      const country = Object.values(WORLD).find(country => country.region.toLowerCase() === code);
      return country?.continent?.toLowerCase() ?? '';
    }
    // When the item is a country, livingIn or hometown location.
    const country = WORLD[code as CountriesCodes];
    return country?.continent?.toLowerCase() ?? '';
  }

  private isRankingView(): boolean {
    return ['top', 'bottom', 'topFemale', 'topMale'].includes(this.selectedRanking) || this.selectedView === 'livingIn' || this.selectedView === 'hometown';
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
      label: 'Guests by Continent',
      type: 'pie',
      getAllData: geography => geography.continents.all,
      getTopData: () => [],
      getBottomData: () => [],
    },
    regions: {
      label: 'Guests by Region',
      type: 'bar',
      getAllData: geography => geography.regions.all,
      getTopData: geography => geography.regions.top,
      getBottomData: geography => geography.regions.bottom,
    },
    countries: {
      label: 'Guests by Country',
      type: 'bar',
      getAllData: geography => geography.countries.all,
      getTopData: geography => geography.countries.top,
      getBottomData: geography => geography.countries.bottom,
    },
    livingIn: {
      label: 'Guests Living In',
      type: 'bar',
      getAllData: geography => geography.livingIn.top,
      getTopData: () => [],
      getBottomData: () => [],
    },
    hometown: {
      label: 'Guests Hometown',
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when geography data changes.
    if (changes['geography'] && this.geographyChart) {
      this.createChart();
    }
  }

  selectView(view: IGeographyView): void {
    this.selectedView = view;

    // Reset to the complete data when changing geography.
    this.selectedRanking = 'all';

    // Destroy the previous chart before creating a new one.
    this.destroyChart();

    // Wait for Angular to update the view before creating the chart.
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

    const datasetLabel = this.selectedRanking === 'topFemale' ? 'Female Guests' : this.selectedRanking === 'topMale' ? 'Male Guests' : config.label;
    this.chart = new Chart(this.geographyChart.nativeElement, {
      type: config.type,
      data: {
        labels: geographyData.map(item => {
          if ('name' in item) {
            return item.name;
          }
          if (this.selectedView === 'regions') {
            return REGION_NAMES[item.code as Regions] ?? item.code;
          }
          if (this.selectedView === 'countries') {
            const code = item.code.toLowerCase() as CountriesCodes;
            return WORLD[code]?.name ?? item.code;
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
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const item = geographyData[index];

          if (!item) {
            return;
          }

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
                              text: 'America',
                              fillStyle: CONTINENT_COLORS.america.background,
                              strokeStyle: CONTINENT_COLORS.america.border,
                              lineWidth: 1,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'europe')) {
                            labels.push({
                              text: 'Europe',
                              fillStyle: CONTINENT_COLORS.europe.background,
                              strokeStyle: CONTINENT_COLORS.europe.border,
                              lineWidth: 1,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'africa')) {
                            labels.push({
                              text: 'Africa',
                              fillStyle: CONTINENT_COLORS.africa.background,
                              strokeStyle: CONTINENT_COLORS.africa.border,
                              lineWidth: 1,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'asia')) {
                            labels.push({
                              text: 'Asia',
                              fillStyle: CONTINENT_COLORS.asia.background,
                              strokeStyle: CONTINENT_COLORS.asia.border,
                              lineWidth: 1,
                            });
                          }

                          if (regions.some(region => this.getContinent(region) === 'oceania')) {
                            labels.push({
                              text: 'Oceania',
                              fillStyle: CONTINENT_COLORS.oceania.background,
                              strokeStyle: CONTINENT_COLORS.oceania.border,
                              lineWidth: 1,
                            });
                          }
                        }

                        // Regions - Top / Bottom
                        if (this.selectedRanking === 'top' || this.selectedRanking === 'bottom') {
                          labels.push(
                            {
                              text: '1st',
                              fillStyle: RANKING_COLORS.gold.background,
                              strokeStyle: RANKING_COLORS.gold.border,
                              lineWidth: 1,
                            },
                            {
                              text: '2nd',
                              fillStyle: RANKING_COLORS.silver.background,
                              strokeStyle: RANKING_COLORS.silver.border,
                              lineWidth: 1,
                            },
                            {
                              text: '3rd',
                              fillStyle: RANKING_COLORS.bronze.background,
                              strokeStyle: RANKING_COLORS.bronze.border,
                              lineWidth: 1,
                            },
                            {
                              text: 'Others',
                              fillStyle: RANKING_COLORS.neutral.background,
                              strokeStyle: RANKING_COLORS.neutral.border,
                              lineWidth: 1,
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
                              text: 'America',
                              fillStyle: CONTINENT_COLORS.america.background,
                              strokeStyle: CONTINENT_COLORS.america.border,
                              lineWidth: 1,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'europe')) {
                            labels.push({
                              text: 'Europe',
                              fillStyle: CONTINENT_COLORS.europe.background,
                              strokeStyle: CONTINENT_COLORS.europe.border,
                              lineWidth: 1,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'africa')) {
                            labels.push({
                              text: 'Africa',
                              fillStyle: CONTINENT_COLORS.africa.background,
                              strokeStyle: CONTINENT_COLORS.africa.border,
                              lineWidth: 1,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'asia')) {
                            labels.push({
                              text: 'Asia',
                              fillStyle: CONTINENT_COLORS.asia.background,
                              strokeStyle: CONTINENT_COLORS.asia.border,
                              lineWidth: 1,
                            });
                          }

                          if (countries.some(country => this.getContinent(country) === 'oceania')) {
                            labels.push({
                              text: 'Oceania',
                              fillStyle: CONTINENT_COLORS.oceania.background,
                              strokeStyle: CONTINENT_COLORS.oceania.border,
                              lineWidth: 1,
                            });
                          }
                        }

                        // Countries - Top / Bottom / Top Female / Top Male
                        if (this.selectedRanking === 'top' || this.selectedRanking === 'bottom' || this.selectedRanking === 'topFemale' || this.selectedRanking === 'topMale') {
                          labels.push(
                            {
                              text: '1st',
                              fillStyle: RANKING_COLORS.gold.background,
                              strokeStyle: RANKING_COLORS.gold.border,
                              lineWidth: 1,
                            },
                            {
                              text: '2nd',
                              fillStyle: RANKING_COLORS.silver.background,
                              strokeStyle: RANKING_COLORS.silver.border,
                              lineWidth: 1,
                            },
                            {
                              text: '3rd',
                              fillStyle: RANKING_COLORS.bronze.background,
                              strokeStyle: RANKING_COLORS.bronze.border,
                              lineWidth: 1,
                            },
                            {
                              text: 'Others',
                              fillStyle: RANKING_COLORS.neutral.background,
                              strokeStyle: RANKING_COLORS.neutral.border,
                              lineWidth: 1,
                            }
                          );
                        }
                      }

                      // LIVING IN / HOMETOWN
                      if (this.selectedView === 'livingIn' || this.selectedView === 'hometown') {
                        labels.push(
                          {
                            text: '1st',
                            fillStyle: RANKING_COLORS.gold.background,
                            strokeStyle: RANKING_COLORS.gold.border,
                            lineWidth: 1,
                          },
                          {
                            text: '2nd',
                            fillStyle: RANKING_COLORS.silver.background,
                            strokeStyle: RANKING_COLORS.silver.border,
                            lineWidth: 1,
                          },
                          {
                            text: '3rd',
                            fillStyle: RANKING_COLORS.bronze.background,
                            strokeStyle: RANKING_COLORS.bronze.border,
                            lineWidth: 1,
                          },
                          {
                            text: 'Others',
                            fillStyle: RANKING_COLORS.neutral.background,
                            strokeStyle: RANKING_COLORS.neutral.border,
                            lineWidth: 1,
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
                    text: 'Number of Guests',
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
    const rankingTitles: Record<ICountryRanking, string> = {
      all: label,
      top: `${label} - Top`,
      bottom: `${label} - Bottom`,
      topFemale: `${label} - Top Female`,
      topMale: `${label} - Top Male`,
      mostConsecutive: `${label} - Most Consecutive`,
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

  getCountryName(code: string): string {
    const countryCode = code.toLowerCase() as CountriesCodes;
    return WORLD[countryCode]?.name ?? code;
  }

  // COUNTRY - MOST CONSECUTIVE
  private createMostConsecutiveChart(): void {
    const consecutive = this.geography.countries.mostConsecutive;
    if (!consecutive || !consecutive.guests.length) {
      return;
    }
    this.destroyChart();

    const countryName = this.getCountryName(consecutive.code);
    const guests = [...consecutive.guests].sort((a, b) => new Date(a.visitedDate).getTime() - new Date(b.visitedDate).getTime());
    const startDate = new Date(consecutive.firstVisit);
    const endDate = new Date(consecutive.lastVisit);
    const minDate = startDate.getTime();
    const maxDate = endDate.getTime();

    // Add some space around the first and last points
    const datePadding = 24 * 60 * 60 * 1000;

    this.geographyChart.nativeElement.style.height = `${Math.max(250, guests.length * 70)}px`;

    this.chart = new Chart(this.geographyChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: `${countryName} - ${consecutive.streak} Consecutive Visits`,
            data: guests.map(guest => ({
              x: new Date(guest.visitedDate).getTime(),
              y: guest.fullName,
            })),
            pointRadius: 20,
            pointHoverRadius: 10,
            pointBackgroundColor: guests.map(guest => getGenderColor(guest.gender)),
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
            text: `${countryName} — ${consecutive.streak} Consecutive Visits`,
          },
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (guests.some(guest => guest.gender.toLowerCase() === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: GENDER_COLORS.female.background,
                    strokeStyle: GENDER_COLORS.female.border,
                    lineWidth: 1,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: GENDER_COLORS.male.background,
                    strokeStyle: GENDER_COLORS.male.border,
                    lineWidth: 1,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'gay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: GENDER_COLORS.gay.background,
                    strokeStyle: GENDER_COLORS.gay.border,
                    lineWidth: 1,
                  });
                }

                if (guests.some(guest => guest.gender.toLowerCase() === 'trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: GENDER_COLORS.trans.background,
                    strokeStyle: GENDER_COLORS.trans.border,
                    lineWidth: 1,
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
                return [guest.fullName, `Gender: ${guest.gender}`, `Group: ${guest.groupType}`, `Visit: ${this._format.formatDate(guest.visitedDate)}`];
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
                return new Date(Number(value)).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              },
            },
            title: {
              display: true,
              text: 'Visit Date',
            },
          },
          y: {
            type: 'category',
            labels: guests.map(guest => guest.fullName),
            title: {
              display: true,
              text: 'Guests',
            },
          },
        },
      },
    });
  }

  // Click on chart
  private readonly continentNavigation: Record<string, IQueryParamsGuests['continent']> = {
    america: 'america',
    asia: 'asia',
    africa: 'africa',
    europe: 'europe',
    oceania: 'oceania',
  };

  private navigateToContinent(continent: string): void {
    const filters = this.continentNavigation[continent];

    if (!filters) {
      return;
    }

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        continent: filters,
      },
    });
  }

  private readonly regionNavigation: Record<string, IQueryParamsGuests['region']> = {
    northern_africa: 'northern_africa',
    western_africa: 'western_africa',
    central_africa: 'central_africa',
    eastern_africa: 'eastern_africa',
    southern_africa: 'southern_africa',

    north_america: 'north_america',
    south_america: 'south_america',
    caribbean: 'caribbean',
    central_america: 'central_america',

    central_asia: 'central_asia',
    east_asia: 'east_asia',
    south_asia: 'south_asia',
    southeast_asia: 'southeast_asia',
    west_asia: 'west_asia',

    northern_europe: 'northern_europe',
    scandinavia: 'scandinavia',
    baltics: 'baltics',
    central_europe: 'central_europe',
    western_europe: 'western_europe',
    eastern_europe: 'eastern_europe',
    southern_europe: 'southern_europe',

    melanesia: 'melanesia',
    micronesia: 'micronesia',
    polinesia: 'polinesia',
    oceania: 'oceania',
  };

  private navigateToRegion(region: string): void {
    const filters = this.regionNavigation[region];

    if (!filters) {
      return;
    }

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
    if (!location) {
      return;
    }

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        livingIn: location.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  private navigateToHometown(location: string): void {
    if (!location) {
      return;
    }

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
