import { Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

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
export class GuestSummaryChartComponent implements OnChanges {
  @Input() summary!: ISummaryDistribution;

  @ViewChild('summaryChart')
  summaryChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected summary view.
  selectedView: ISummaryView = 'total';

  // Available summary views.
  readonly summaryViews: ISummaryView[] = ['total', 'nights', 'rating', 'gifts'];

  private chart?: Chart;

  cards: ISummaryCard[] = [];

  // Configuration for each chart-based summary view.
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
    // Average nights by guest type.
    nights: {
      type: 'radar',
      labels: ['General', 'Solo', 'Groups'],
      label: 'Average Nights',
      getData: summary => [summary.averageNightsGeneral, summary.averageNightsSolo, summary.averageNightsGroup],
      max: 4,
    },

    // Average rating by guest type.
    rating: {
      type: 'radar',
      labels: ['General', 'Solo', 'Groups'],
      label: 'Average Rating',
      getData: summary => [summary.averageRatingGeneral, summary.averageRatingSolo, summary.averageRatingGroup],
      max: 5,
    },

    // Gift distribution across visits.
    gifts: {
      type: 'doughnut',
      labels: ['Received', 'Without Gift'],
      label: 'Gifts',
      getData: summary => [summary.giftsReceived, summary.guestsWithoutGift],
    },
  };

  private _router = inject(Router);

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
    // A chart is only required for non-total views.
    if (!this.summaryChart || !this.summary || this.selectedView === 'total') {
      return;
    }

    const config = this.chartConfig[this.selectedView];

    // Ensure any existing chart instance is removed.
    this.chart?.destroy();

    this.chart = new Chart(this.summaryChart.nativeElement, {
      type: config.type,
      data: {
        labels: config.labels,
        datasets: [
          {
            label: config.label,
            data: config.getData(this.summary),
            // Reuse the shared chart palettes
            backgroundColor: this.selectedView === 'gifts' ? GIFTS_COLORS.slice(0, 2).map(color => color.background) : RATINGS_COLORS.map(color => color.background),
            borderColor: this.selectedView === 'gifts' ? GIFTS_COLORS.slice(0, 2).map(color => color.border) : RATINGS_COLORS.map(color => color.border),
            borderWidth: 1,
            // Different color for radar point
            pointBackgroundColor: [SUMMARY_COLORS.radarPoints.general.background, SUMMARY_COLORS.radarPoints.solo.background, SUMMARY_COLORS.radarPoints.groups.background],
            pointBorderColor: [SUMMARY_COLORS.radarPoints.general.border, SUMMARY_COLORS.radarPoints.solo.border, SUMMARY_COLORS.radarPoints.groups.border],
            pointRadius: 8,
            pointHoverRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
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
        // Apply axis configuration only to bar charts.
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
        // Apply radial scale configuration only to radar charts.
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
