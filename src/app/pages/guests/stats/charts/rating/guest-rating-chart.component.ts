import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';

// Interfaces
import { IChartType, IRatingGuest, IRatingGroupType, IRatingMainView, IRatingView, IRatingsData, IRatingsDistribution } from '@interfaces/stats-interface';

// Helpers
import { RATING_DOT_COLORS, RATINGS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  @Input() ratings!: IRatingsData;

  @ViewChild('ratingsChart')
  ratingsChart!: ElementRef<HTMLCanvasElement>;

  // Main Rating view.
  selectedMainView: IRatingMainView = 'distribution';

  // Distribution group view.
  selectedView: IRatingView = 'overall';

  // Chart type used by Distribution.
  selectedChart: IChartType = 'bar';

  // Current Chart.js instance.
  private chart?: Chart;

  // Main Rating views.
  readonly ratingMainViews: IRatingMainView[] = ['distribution', 'lowest', 'highest'];

  // Rating group views.
  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // Initialize chart after the view is ready.
  ngAfterViewInit(): void {
    this.createChart();

    // Recreate the chart when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.createChart();
    });
  }

  // Recreate chart when the data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ratings'] && this.ratingsChart) {
      this.createChart();
    }
  }

  // Clean up the subscription and chart instance.
  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.destroyChart();
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
    this.destroyChart();

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

    const ratingLabels = ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐', this._translate.instant('STATS.RATINGS.LABELS.UNRATED')];

    this.chart = new Chart(this.ratingsChart.nativeElement, {
      type: this.selectedChart,

      data: {
        labels: ratingLabels,

        datasets: [
          {
            label: this._translate.instant('STATS.RATINGS.LABELS.GUESTS'),
            data: [ratings['1'], ratings['2'], ratings['3'], ratings['4'], ratings['5'], ratings.unrated],
            backgroundColor: RATINGS_COLORS.map(color => color.background),
            borderColor: RATINGS_COLORS.map(color => color.border),
            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          this.handleChartClick(index);
        },

        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.y ?? context.parsed;

                return `${context.dataset.label}: ${value}`;
              },
            },
          },
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

    const isHighest = this.selectedMainView === 'highest';

    this.chart = new Chart(this.ratingsChart.nativeElement, {
      type: 'scatter',

      data: {
        datasets: [
          {
            label: this._translate.instant(isHighest ? 'STATS.RATINGS.VIEWS.HIGHEST' : 'STATS.RATINGS.VIEWS.LOWEST'),

            data: orderedGuests.map((guest, index) => ({
              x: index,
              y: guest.rating,
            })),

            pointRadius: 8,
            pointHoverRadius: 11,

            backgroundColor: isHighest ? RATING_DOT_COLORS.highest.background : RATING_DOT_COLORS.lowest.background,

            borderColor: isHighest ? RATING_DOT_COLORS.highest.border : RATING_DOT_COLORS.lowest.border,

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
              text: this._translate.instant('STATS.RATINGS.LABELS.GUESTS'),
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

              callback: value => `${value} ⭐`,
            },

            title: {
              display: true,
              text: this._translate.instant('STATS.RATINGS.LABELS.RATING'),
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
                const guest = orderedGuests[context.dataIndex];

                return [
                  guest.fullName,

                  this._translate.instant('STATS.RATINGS.LABELS.RATING_VALUE', { rating: guest.rating }),

                  this._translate.instant('STATS.RATINGS.LABELS.GENDER', {
                    gender: this._translate.instant(`STATS.RATINGS.GENDERS.${String(guest.gender).toUpperCase()}`),
                  }),

                  this._translate.instant('STATS.RATINGS.LABELS.COUNTRY', {
                    country: this._format.formatCountry(guest.hometownCode),
                  }),

                  this._translate.instant('STATS.RATINGS.LABELS.VISIT', {
                    date: this._format.formatDate(guest.visitedDate),
                  }),
                ];
              },
            },
          },
        },

        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const guest = orderedGuests[index];

          if (guest) {
            this.handleGuestClick(guest);
          }
        },
      },
    });
  }

  // Navigate to the guests filtered by rating.
  private handleChartClick(index: number): void {
    // The last item represents unrated guests.
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

    if (this.selectedMainView === 'distribution') {
      this.createChart();
    }
  }

  // Destroy the current Chart.js instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
