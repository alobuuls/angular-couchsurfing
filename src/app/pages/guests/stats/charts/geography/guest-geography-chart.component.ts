import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

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

// Constants
import { REGION_NAMES } from '@config/world/regions';
import { CountriesCodes, Regions } from '@type/word.types';
import { WORLD } from '@config/world';

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent implements AfterViewInit, OnChanges {
  private _format = inject(FormatService);
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

  getAvailableRankingViews(): ICountryRanking[] {
    if (this.selectedView === 'continents') {
      return ['all'];
    }

    return this.rankingViews;
  }

  private chart?: Chart;

  // Colors used to identify each continent across all geography charts.
  private readonly continentColors: Record<string, string> = {
    america: 'rgba(53, 164, 249, 0.7)',
    europe: 'rgba(246, 77, 77, 0.7)',
    africa: 'rgba(75, 192, 93, 0.7)',
    asia: 'rgba(255, 207, 96, 0.7)',
    oceania: 'rgba(128, 96, 255, 0.7)',
  };

  private readonly continentBorderColors: Record<string, string> = {
    america: 'rgb(86, 213, 255)',
    europe: 'rgb(248, 114, 114)',
    africa: 'rgb(147, 213, 145)',
    asia: 'rgb(209, 224, 110)',
    oceania: 'rgb(181, 153, 241)',
  };

  private getContinent(item: IGeographyContinent | IGeographyRegion | IGeographyCountry | IGeographyLocation): string {
    if (this.selectedView === 'continents') {
      return item.code.toLowerCase();
    }

    if (this.selectedView === 'regions') {
      const country = Object.values(WORLD).find(country => country.region === item.code);
      return country?.continent ?? '';
    }

    const countryCode = item.code.toLowerCase() as CountriesCodes;
    
    return WORLD[countryCode]?.continent ?? '';
  }

  // Configuration for each geography view.
  private readonly chartConfig: Record<
    IGeographyView,
    {
      label: string;
      type: IChartType;
      getAllData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];

      getTopData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];

      getBottomData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
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
      // The API currently provides only the top locations.
      getAllData: geography => geography.livingIn.top,
      getTopData: geography => geography.livingIn.top,
      getBottomData: () => [],
    },

    hometown: {
      label: 'Guests Hometown',
      type: 'bar',
      // The API currently provides only the top hometowns.
      getAllData: geography => geography.hometown.top,
      getTopData: geography => geography.hometown.top,
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
            backgroundColor: geographyData.map(item => {
              const continent = this.getContinent(item);
              return this.continentColors[continent] ?? 'rgba(128, 128, 128, 0.7)';
            }),
            borderColor: geographyData.map(item => {
              const continent = this.getContinent(item);
              return this.continentBorderColors[continent] ?? 'rgb(128, 128, 128)';
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: config.type === 'bar' ? 'y' : 'x',
        plugins: {
          title: {
            display: true,
            text: this.getChartTitle(config.label),
          },
          legend: {
            display: this.selectedView === 'continents',
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
    getTopData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
    getBottomData: (geography: IGeographyDistribution) => IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
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

    const genderColors: Record<string, string> = {
      female: 'rgb(255, 99, 132)',
      male: 'rgb(54, 162, 235)',
      gay: 'rgb(255, 205, 86)',
      trans: 'rgb(153, 102, 255)',
    };

    const getGenderColor = (gender: string): string => genderColors[gender.toLowerCase()] ?? 'rgb(128, 128, 128)';

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
            display: false,
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
}
