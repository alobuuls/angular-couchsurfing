import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

// Interfaces
import { IChartType, IRatingGuest, IRatingGroupType, IRatingMainView, IRatingView, IRatingsData, IRatingsDistribution } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent implements AfterViewInit, OnChanges {
  @Input() ratings!: IRatingsData;

  @ViewChild('ratingsChart')
  ratingsChart!: ElementRef<HTMLCanvasElement>;

  // Main Rating view.
  selectedMainView: IRatingMainView = 'distribution';

  // Distribution group view.
  selectedView: IRatingView = 'overall';

  // Chart type used by Distribution.
  selectedChart: IChartType = 'bar';

  private chart?: Chart;

  // Main Rating views.
  readonly ratingMainViews: IRatingMainView[] = ['distribution', 'lowest', 'highest'];

  readonly ratingMainViewLabels: Record<IRatingMainView, string> = {
    distribution: 'Distribution',
    lowest: 'Lowest',
    highest: 'Highest',
  };

  // Rating group views.
  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  private _router = inject(Router);

  // Initialize chart after the view is ready.
  ngAfterViewInit(): void {
    this.createChart();
  }

  // Recreate chart when the data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ratings'] && this.ratingsChart) {
      this.createChart();
    }
  }

  // Select the main Rating view.
  selectMainView(view: IRatingMainView): void {
    this.selectedMainView = view;

    // Distribution starts with Overall by default.
    if (view === 'distribution') {
      this.selectedView = 'overall';
    }

    this.createChart();
  }

  // Select a Rating group.
  selectView(view: IRatingView): void {
    this.selectedView = view;
    this.createChart();
  }

  // Create the chart according to the selected main view.
  private createChart(): void {
    if (!this.ratingsChart || !this.ratings) {
      return;
    }

    // Destroy the previous chart.
    this.chart?.destroy();

    // Create Distribution chart.
    if (this.selectedMainView === 'distribution') {
      this.createDistributionChart();
      return;
    }

    // Create Lowest / Highest Dot Plot.
    this.createDotPlot();
  }

  // Create the Distribution chart.
  private createDistributionChart(): void {
    const distributions: Record<IRatingView, IRatingsDistribution> = this.ratings.distribution;

    const ratings = distributions[this.selectedView];

    if (!ratings) {
      return;
    }

    this.chart = new Chart(this.ratingsChart.nativeElement, {
      type: this.selectedChart,

      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐', 'Unrated'],

        datasets: [
          {
            label: 'Guests',
            data: [ratings['1'], ratings['2'], ratings['3'], ratings['4'], ratings['5'], ratings.unrated],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;

          this.handleChartClick(index);
        },
      },
    });
  }

  // Create a horizontal Dot Plot for Lowest / Highest guests.
  private createDotPlot(): void {
    const rankingData = this.selectedMainView === 'highest' ? this.ratings.highest : this.ratings.lowest;
    const guests: IRatingGuest[] = rankingData[this.selectedView] ?? [];

    if (!guests.length) {
      return;
    }

    const orderedGuests = [...guests];

    this.chart = new Chart(this.ratingsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this.selectedMainView === 'highest' ? 'Highest Rating' : 'Lowest Rating',
            data: orderedGuests.map((guest, index) => ({
              x: index,
              y: guest.rating,
            })),
            pointRadius: 8,
            pointHoverRadius: 11,
            backgroundColor: this.selectedMainView === 'highest' ? 'rgba(54, 162, 235, 0.8)' : 'rgba(255, 99, 132, 0.8)',
            borderColor: this.selectedMainView === 'highest' ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          // Guests are displayed horizontally.
          x: {
            min: -0.5,
            max: orderedGuests.length - 0.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                const index = Number(value);

                return orderedGuests[index]?.fullName ?? '';
              },
              maxRotation: 45,
              minRotation: 45,
            },
            title: {
              display: true,
              text: 'Guests',
            },
          },

          // Rating is displayed vertically.
          y: {
            min: 0,
            max: 5.5,
            afterBuildTicks: axis => {
              axis.ticks = axis.ticks.filter(tick => Number(tick.value) <= 5);
            },
            ticks: {
              stepSize: 1,
              callback: value => {
                return `${value} ⭐`;
              },
            },
            title: {
              display: true,
              text: 'Rating',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label: context => {
                const index = context.dataIndex;
                const guest = orderedGuests[index];

                return `${guest.fullName}: ${guest.rating} ⭐`;
              },
            },
          },
        },

        onClick: (event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const guest = orderedGuests[index];

          this.handleGuestClick(guest);
        },
      },
    });
  }

  // Navigate to the guests filtered by rating.
  private handleChartClick(index: number): void {
    if (index > 4) {
      return;
    }
    const rating = index + 1;
    const queryParams: {
      view: 'cards';
      rating: number;
      groupType?: IRatingGroupType;
    } = {
      view: 'cards',
      rating,
    };

    if (this.selectedView !== 'overall') {
      queryParams.groupType = this.selectedView;
    }
    this._router.navigate(['/guests'], {
      queryParams,
    });
  }

  // Navigate to the selected guest.
  private handleGuestClick(guest: IRatingGuest): void {
    const queryParams: {
      view: 'cards';
      rating: number;
      groupType?: IRatingGroupType;
    } = {
      view: 'cards',
      rating: guest.rating,
    };

    if (this.selectedView !== 'overall') {
      queryParams.groupType = this.selectedView;
    }

    this._router.navigate(['/guests'], {
      queryParams,
    });
  }

  // Change the Distribution chart type.
  selectChartType(type: IChartType): void {
    this.selectedChart = type;

    // Chart type buttons only affect Distribution.
    if (this.selectedMainView === 'distribution') {
      this.createChart();
    }
  }
}
