import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { IDemographicsDistribution, IDemographicsView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-demographics-chart',
  templateUrl: './guest-demographics-chart.component.html',
  styleUrls: ['./guest-demographics-chart.component.css'],
})
export class GuestDemographicsChartComponent implements AfterViewInit, OnChanges {
  @Input() demographics!: IDemographicsDistribution;

  @ViewChild('demographicsChart')
  demographicsChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected demographics view.
  selectedView: IDemographicsView = 'overall';

  // Available demographics views.
  readonly demographicsViews: IDemographicsView[] = ['overall', 'groups'];

  private chart?: Chart;

  // Defines the chart type for each demographics view.
  private readonly chartConfig: Record<
    IDemographicsView,
    {
      type: 'bar' | 'doughnut';
    }
  > = {
    overall: {
      type: 'doughnut',
    },

    groups: {
      type: 'bar',
    },
  };

  ngAfterViewInit(): void {
    // Create the initial chart after the canvas is rendered.
    if (this.demographics) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when demographics data changes.
    if (changes['demographics'] && this.demographicsChart) {
      this.createChart();
    }
  }

  selectView(view: IDemographicsView): void {
    this.selectedView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to render the canvas before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    if (!this.demographicsChart || !this.demographics) {
      return;
    }

    const config = this.chartConfig[this.selectedView];

    // Destroy any existing chart instance.
    this.chart?.destroy();

    this.chart = config.type === 'doughnut' ? this.createOverallChart() : this.createGroupsChart();
  }

  private createOverallChart(): Chart {
    const overall = this.demographics.totals.overall;

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'doughnut',

      data: {
        labels: ['Male', 'Female', 'Trans', 'Gay'],

        datasets: [
          {
            label: 'Overall Demographics',

            data: [overall.male, overall.female, overall.trans, overall.isGay],

            backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],

            borderColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],

            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  private createGroupsChart(): Chart {
    const groups = this.demographics.totals.groups;

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',

      data: {
        labels: ['Solo', 'Couple', 'Friends', 'Family'],

        datasets: [
          {
            label: 'Male',

            data: [groups.solo.male, groups.couple.male, groups.friends.male, groups.family.male],

            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },

          {
            label: 'Female',

            data: [groups.solo.female, groups.couple.female, groups.friends.female, groups.family.female],

            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
          },

          {
            label: 'Trans',

            data: [groups.solo.trans, groups.couple.trans, groups.friends.trans, groups.family.trans],

            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
          },

          {
            label: 'Gay',

            data: [groups.solo.isGay, groups.couple.isGay, groups.friends.isGay, groups.family.isGay],

            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

        // Display the groups as horizontal stacked bars.
        indexAxis: 'y',

        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
          },

          y: {
            stacked: true,
          },
        },

        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  // Returns the overall gay count for the summary.
  get overallGayCount(): number {
    return this.demographics.totals.overall.isGay;
  }
}
