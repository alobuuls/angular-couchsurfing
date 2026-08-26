import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { IRankingItem, IRankingView, IRankingsDistribution } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-rankings-chart',
  templateUrl: './guest-rankings-chart.component.html',
  styleUrls: ['./guest-rankings-chart.component.css'],
})
export class GuestRankingsChartComponent implements AfterViewInit, OnChanges {
  @Input() rankings!: IRankingsDistribution;

  @ViewChild('rankingChart')
  rankingChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected ranking view.
  selectedView: IRankingView = 'people';

  // Available ranking views.
  readonly rankingViews: IRankingView[] = ['people', 'women', 'men', 'groups'];

  private chart?: Chart;

  // Configuration for each ranking view.
  private readonly chartConfig: Record<
    IRankingView,
    {
      label: string;
      getData: (rankings: IRankingsDistribution) => IRankingItem[];
    }
  > = {
    people: {
      label: 'People Ranking',
      getData: rankings => rankings.people.overall,
    },

    women: {
      label: 'Women Ranking',
      getData: rankings => rankings.women.overall,
    },

    men: {
      label: 'Men Ranking',
      getData: rankings => rankings.men.overall,
    },

    groups: {
      label: 'Groups Ranking',
      getData: rankings => rankings.groups.overall,
    },
  };

  ngAfterViewInit(): void {
    // Create the initial ranking chart after the canvas is rendered.
    if (this.rankings) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when ranking data changes.
    if (changes['rankings'] && this.rankingChart) {
      this.createChart();
    }
  }

  selectView(view: IRankingView): void {
    this.selectedView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    if (!this.rankingChart || !this.rankings) {
      return;
    }

    const config = this.chartConfig[this.selectedView];

    const rankingData = config.getData(this.rankings);

    // Destroy any existing chart instance.
    this.chart?.destroy();

    this.chart = new Chart(this.rankingChart.nativeElement, {
      type: 'bar',

      data: {
        labels: rankingData.map(item => item.guest.fullName),

        datasets: [
          {
            label: config.label,

            data: rankingData.map(item => item.position),

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

        indexAxis: 'y',

        scales: {
          x: {
            beginAtZero: true,

            min: 0,

            max: 100,

            ticks: {
              stepSize: 20,
            },

            title: {
              display: true,
              text: 'Ranking Position',
            },
          },

          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
