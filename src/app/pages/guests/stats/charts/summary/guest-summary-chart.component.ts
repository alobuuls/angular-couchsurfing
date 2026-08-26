import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { ISummaryCard, ISummaryDistribution, ISummaryView } from '@interfaces/stats-interface';

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
  readonly summaryViews: ISummaryView[] = ['total', 'nights', 'gifts', 'rating'];

  private chart?: Chart;

  // Configuration for each chart-based summary view.
  private readonly chartConfig: Record<
    Exclude<ISummaryView, 'total'>,
    {
      type: 'bar' | 'doughnut';
      labels: string[];
      label: string;
      getData: (summary: ISummaryDistribution) => number[];
      indexAxis?: 'x' | 'y';
      max?: number;
    }
  > = {
    // Average nights by guest type.
    nights: {
      type: 'bar',
      labels: ['General', 'Solo', 'Groups'],
      label: 'Average Nights',
      getData: summary => [summary.averageNightsGeneral, summary.averageNightsSolo, summary.averageNightsGroup],
      indexAxis: 'y',
    },

    // Gift distribution across visits.
    gifts: {
      type: 'doughnut',
      labels: ['Received', 'Without Gift'],
      label: 'Gifts',
      getData: summary => [summary.giftsReceived, summary.guestsWithoutGift],
    },

    // Average rating by guest type.
    rating: {
      type: 'bar',
      labels: ['General', 'Solo', 'Groups'],
      label: 'Average Rating',
      getData: summary => [summary.averageRatingGeneral, summary.averageRatingSolo, summary.averageRatingGroup],
      indexAxis: 'y',
      max: 5,
    },
  };


  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when the summary data changes.
    if (changes['summary'] && this.selectedView !== 'total') {
      this.createChart();
    }
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

            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(201, 203, 207, 0.2)',
            ],

            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'],

            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

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
      },
    });
  }

  // Summary cards for the total view.
  get cards(): ISummaryCard[] {
    return [
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
}
