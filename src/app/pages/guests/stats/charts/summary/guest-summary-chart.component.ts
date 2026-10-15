import { Component, ElementRef, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import Chart from 'chart.js/auto';

// Interfaces
import { ISummaryCard, ISummaryDistribution, ISummaryView } from '@interfaces/stats-interface';

// Helpers
import { GIFTS_COLORS, RATINGS_COLORS, SUMMARY_COLORS } from '@utils';

@Component({
  selector: 'guest-summary-chart',
  templateUrl: './guest-summary-chart.component.html',
  styleUrls: ['./guest-summary-chart.component.css'],
})
export class GuestSummaryChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() summary!: ISummaryDistribution;

  @ViewChild('summaryChart')
  summaryChart!: ElementRef<HTMLCanvasElement>;

  selectedView: ISummaryView = 'total';

  readonly summaryViews: ISummaryView[] = ['total', 'nights', 'rating', 'gifts'];

  private chart?: Chart;

  private readonly _router = inject(Router);
  private readonly _translate = inject(TranslateService);

  private langChangeSubscription?: import('rxjs').Subscription;

  cards: ISummaryCard[] = [];

  private readonly cardKeys: Record<string, string> = {
    'Total Guests': 'TOTAL_GUESTS',
    'Solo Guests': 'SOLO_GUESTS',
    'Group Guests': 'GROUP_GUESTS',
    'Total Visits': 'TOTAL_VISITS',
    'Total Nights': 'TOTAL_NIGHTS',
  };

  private readonly chartConfig: Record<
    Exclude<ISummaryView, 'total'>,
    {
      type: 'bar' | 'doughnut' | 'radar';
      labels: string[];
      label: string;
      getData: (summary: ISummaryDistribution) => number[];
      indexAxis?: 'x' | 'y';
      max?: number;
    }
  > = {
    nights: {
      type: 'radar',
      labels: [
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GENERAL'),
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.SOLO'),
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GROUPS'),
      ],
      label: this._translate.instant('STATS.SUMMARY.CHARTS.AVERAGE_NIGHTS'),
      getData: summary => [summary.averageNightsGeneral, summary.averageNightsSolo, summary.averageNightsGroup],
      max: 4,
    },

    rating: {
      type: 'radar',
      labels: [
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GENERAL'),
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.SOLO'),
        this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GROUPS'),
      ],
      label: this._translate.instant('STATS.SUMMARY.CHARTS.AVERAGE_RATING'),
      getData: summary => [summary.averageRatingGeneral, summary.averageRatingSolo, summary.averageRatingGroup],
      max: 5,
    },

    gifts: {
      type: 'doughnut',
      labels: [this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'), this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.WITHOUT_GIFT')],
      label: this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'),
      getData: summary => [summary.giftsReceived, summary.guestsWithoutGift],
    },
  };

  ngOnInit(): void {
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      if (this.selectedView !== 'total') {
        this.createChart();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['summary']) {
      this.cards = [
        {
          label: 'Total Guests',
          value: this.summary.totalGuests,
          icon: 'groups',
        },
        {
          label: 'Solo Guests',
          value: this.summary.totalGuestsSolo,
          icon: 'person',
        },
        {
          label: 'Group Guests',
          value: this.summary.totalGuestsGroups,
          icon: 'group',
        },
        {
          label: 'Total Visits',
          value: this.summary.totalVisits,
          icon: 'event',
        },
        {
          label: 'Total Nights',
          value: this.summary.totalNights,
          icon: 'hotel',
        },
      ];
    }

    if (changes['summary'] && this.selectedView !== 'total') {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.langChangeSubscription?.unsubscribe();
  }

  selectView(view: ISummaryView): void {
    this.selectedView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    if (view !== 'total') {
      // Wait for Angular to render the canvas before creating the chart.
      setTimeout(() => {
        this.createChart();
      });
    }
  }

  private createChart(): void {
    if (!this.summaryChart || !this.summary || this.selectedView === 'total') {
      return;
    }

    const config = this.getChartConfig(this.selectedView);

    this.chart?.destroy();

    this.chart = new Chart(this.summaryChart.nativeElement, {
      type: config.type,
      data: {
        labels: config.labels,
        datasets: [
          {
            label: config.label,
            data: config.getData(this.summary),
            backgroundColor: this.selectedView === 'gifts' ? GIFTS_COLORS.slice(0, 2).map(color => color.background) : RATINGS_COLORS.map(color => color.background),
            borderColor: this.selectedView === 'gifts' ? GIFTS_COLORS.slice(0, 2).map(color => color.border) : RATINGS_COLORS.map(color => color.border),
            borderWidth: 1,
            pointBackgroundColor: [SUMMARY_COLORS.radarPoints.general.background, SUMMARY_COLORS.radarPoints.solo.background, SUMMARY_COLORS.radarPoints.groups.background],
            pointBorderColor: [SUMMARY_COLORS.radarPoints.general.border, SUMMARY_COLORS.radarPoints.solo.border, SUMMARY_COLORS.radarPoints.groups.border],
            pointRadius: 8,
            pointHoverRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                const label = context.label;
                const value = context.parsed;

                return `${label}: ${value}`;
              },
            },
          },
        },
        onClick: (_event, elements) => {
          if (!elements.length || this.selectedView !== 'gifts') {
            return;
          }

          const index = elements[0].index;

          if (index === 0) {
            this.navigateToGiftGuests(true);
          }

          if (index === 1) {
            this.navigateToGiftGuests(false);
          }
        },
        ...(config.type === 'bar' && {
          indexAxis: config.indexAxis ?? 'x',
          scales: {
            x: {
              beginAtZero: true,
              ...(config.max !== undefined && {
                max: config.max,
              }),
            },
            y: {
              beginAtZero: true,
              ...(config.max !== undefined && {
                max: config.max,
              }),
            },
          },
        }),
        ...(config.type === 'radar' && {
          scales: {
            r: {
              beginAtZero: true,
              ...(config.max !== undefined && {
                max: config.max,
              }),
              ticks: {
                precision: 0,
              },
            },
          },
        }),
      },
    });
  }

  private getChartConfig(view: Exclude<ISummaryView, 'total'>): (typeof this.chartConfig)[typeof view] {
    const guestTypes = [
      this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GENERAL'),
      this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.SOLO'),
      this._translate.instant('STATS.SUMMARY.CHARTS.GUEST_TYPES.GROUPS'),
    ];

    const config = this.chartConfig[view];

    if (view === 'nights') {
      return {
        ...config,
        labels: guestTypes,
        label: this._translate.instant('STATS.SUMMARY.CHARTS.AVERAGE_NIGHTS'),
      };
    }

    if (view === 'rating') {
      return {
        ...config,
        labels: guestTypes,
        label: this._translate.instant('STATS.SUMMARY.CHARTS.AVERAGE_RATING'),
      };
    }

    return {
      ...config,
      labels: [this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'), this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.WITHOUT_GIFT')],
      label: this._translate.instant('STATS.SUMMARY.CHARTS.GIFTS.RECEIVED'),
    };
  }

  private navigateToCards(groupType: string): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        groupType: groupType || undefined,
      },
    });
  }

  private readonly cardNavigation: Record<string, string> = {
    'Total Guests': '',
    'Solo Guests': 'solo',
    'Group Guests': 'all-groups',
    'Total Visits': '',
    'Total Nights': '',
    default: 'solo',
  };

  navigateToCard(label: string): void {
    this.navigateToCards(this.cardNavigation[label] ?? this.cardNavigation['default']);
  }

  getCardTranslationKey(label: string): string {
    return `STATS.SUMMARY.CARDS.${this.cardKeys[label] ?? 'TOTAL_GUESTS'}`;
  }

  trackById(index: number, item: ISummaryCard): string {
    return item.label;
  }

  private navigateToGiftGuests(hasGift: boolean): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        gift: hasGift,
      },
    });
  }
}
