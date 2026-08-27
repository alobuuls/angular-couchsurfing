import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { IChartType, IGeographyContinent, IGeographyCountry, IGeographyDistribution, IGeographyLocation, IGeographyRegion, IGeographyView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-geography-chart',
  templateUrl: './guest-geography-chart.component.html',
  styleUrls: ['./guest-geography-chart.component.css'],
})
export class GuestGeographyChartComponent implements AfterViewInit, OnChanges {
  @Input() geography!: IGeographyDistribution;

  @ViewChild('geographyChart')
  geographyChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected geography view.
  selectedView: IGeographyView = 'continents';

  // Controls which part of the selected geography is displayed.
  selectedRanking: 'all' | 'top' | 'bottom' = 'all';

  // Available geography views.
  readonly geographyViews: IGeographyView[] = ['continents', 'regions', 'countries', 'livingIn', 'hometown'];

  // Available ranking views.
  readonly rankingViews: ('all' | 'top' | 'bottom')[] = ['all', 'top', 'bottom'];

  private chart?: Chart;

  // Configuration for each geography view.
  private readonly chartConfig: Record<
    IGeographyView,
    {
      label: string;
      type: IChartType;
      getAllData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
      getTopData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
      getBottomData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
    }
  > = {
    continents: {
      label: 'Guests by Continent',
      type: 'doughnut',
      getAllData: geography => geography.continents.all,
      getTopData: geography => geography.continents.top,
      getBottomData: geography => geography.continents.bottom,
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

  selectRanking(ranking: 'all' | 'top' | 'bottom'): void {
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
    const config = this.chartConfig[this.selectedView];

    // Get the data according to the selected ranking.
    const geographyData = this.getSelectedData(config);

    // Do not create a chart when there is no data.
    if (!geographyData.length) {
      return;
    }

    // Destroy any existing chart instance.
    this.destroyChart();

    // Give countries more vertical space when displaying all countries.
    this.setChartHeight(geographyData.length);

    this.chart = new Chart(this.geographyChart.nativeElement, {
      type: config.type,

      data: {
        labels: geographyData.map(item => {
          // Locations use their name instead of their code.
          if ('name' in item) {
            return item.name;
          }

          // Continents, regions and countries use their code.
          return item.code;
        }),

        datasets: [
          {
            label: config.label,
            // Use the total number of guests as the chart value.
            data: geographyData.map(item => item.total),
            backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 205, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(54, 162, 235, 0.2)'],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)'],
            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

        // Horizontal bars make geographic names easier to read.
        indexAxis: config.type === 'bar' ? 'y' : 'x',
        plugins: {
          title: {
            display: true,
            text: this.getChartTitle(config.label),
          },
        },

        // Doughnut charts do not need scales.
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

    getTopData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];

    getBottomData: (geography: IGeographyDistribution) => IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[];
  }): IGeographyContinent[] | IGeographyRegion[] | IGeographyCountry[] | IGeographyLocation[] {
    // Map each ranking to its corresponding data.
    const rankingData = {
      all: config.getAllData(this.geography),

      // Display only the first three elements.
      top: config.getTopData(this.geography).slice(0, 3),

      // Display only the first three elements from the bottom ranking.
      bottom: config.getBottomData(this.geography).slice(0, 3),
    };

    return rankingData[this.selectedRanking];
  }

  private getChartTitle(label: string): string {
    // Map each ranking to its corresponding chart title.
    const rankingTitles = {
      all: label,
      top: `${label} - Top 3`,
      bottom: `${label} - Bottom 3`,
    };

    return rankingTitles[this.selectedRanking];
  }

  // Change the chart height.
  private setChartHeight(dataLength: number): void {
    const canvas = this.geographyChart.nativeElement;

    // Countries can contain many entries, so give each item
    // enough vertical space to remain readable.
    if (this.selectedView === 'countries' && this.selectedRanking === 'all') {
      const height = Math.max(500, dataLength * 35);

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
}
