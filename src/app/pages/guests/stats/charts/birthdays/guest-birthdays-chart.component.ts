import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

// Interfaces
import { IBirthdayItem, IBirthdaysDistribution, IBirthdaysView } from '@interfaces/stats-interface';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-birthdays-chart',
  templateUrl: './guest-birthdays-chart.component.html',
  styleUrls: ['./guest-birthdays-chart.component.css'],
})
export class GuestBirthdaysChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);

  // Birthdays data received from parent
  @Input() birthdays!: IBirthdaysDistribution;

  // Chart canvas
  @ViewChild('birthdaysChart')
  birthdaysChart!: ElementRef<HTMLCanvasElement>;

  // Stores the main selected Birthdays view
  selectedView: IBirthdaysView = 'calendar';

  // Main Birthdays views
  readonly birthdaysViews: IBirthdaysView[] = ['calendar', 'repeated', 'unusual'];

  // Labels for main Birthdays views
  readonly birthdaysViewLabels: Record<IBirthdaysView, string> = {
    calendar: 'Calendar',
    repeated: 'Repeated',
    unusual: 'Unusual',
  };

  // Stores current Chart.js instance
  private chart?: Chart;

  // Creates the chart after the view is initialized
  ngAfterViewInit(): void {
    if (this.birthdays) {
      this.createChart();
    }
  }

  // Recreates the chart when the input data changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['birthdays'] && this.birthdaysChart && this.birthdays) {
      setTimeout(() => this.createChart());
    }
  }

  // Changes the main Birthdays view
  selectView(view: IBirthdaysView): void {
    this.selectedView = view;

    // Destroy current chart.
    this.destroyChart();

    // Wait for Angular to update the template.
    setTimeout(() => this.createChart());
  }

  // Creates the corresponding chart according to the selected view
  private createChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }
    // Repeated birthdays use a Bubble chart.
    if (this.selectedView === 'repeated') {
      this.createRepeatedBubbleChart();
      return;
    }
    // Calendar chart will be implemented later.
    if (this.selectedView === 'calendar') {
      return;
    }
    // Unusual chart will be implemented later.
    if (this.selectedView === 'unusual') {
      return;
    }
  }

  // REPEATED
  // Creates the Bubble chart for repeated birthdays.
  private createRepeatedBubbleChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }
    const repeated = this.birthdays.repeated;
    if (!repeated || repeated.length === 0) {
      return;
    }
    // Destroy previous chart.
    this.destroyChart();
    this.chart = new Chart(this.birthdaysChart.nativeElement, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Repeated Birthdays',
            // Each bubble represents one repeated birthday date.
            data: repeated.map(item => ({
              x: item.month,
              y: item.day,
              // More guests means a larger bubble.
              r: Math.max(10, item.total * 6),
            })),
            // Use one color for repeated birthday dates.
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Repeated Birthdays',
          },
          legend: {
            display: true,
          },
          // Show birthday information when hovering over a bubble.
          tooltip: {
            callbacks: {
              title: context => {
                const item = repeated[context[0].dataIndex];
                return this._format.formatBirthday(item.month, item.day);
              },
              label: context => {
                const item = repeated[context.dataIndex];
                return `Guests: ${item.total}`;
              },
              afterBody: context => {
                const item = repeated[context[0].dataIndex];

                return ['', 'Guests:', ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          // X axis represents the month.
          x: {
            min: 0,
            max: 13,
            ticks: {
              stepSize: 1,
              callback: value => {
                const months: Record<number, string> = {
                  1: 'January',
                  2: 'February',
                  3: 'March',
                  4: 'April',
                  5: 'May',
                  6: 'June',
                  7: 'July',
                  8: 'August',
                  9: 'September',
                  10: 'October',
                  11: 'November',
                  12: 'December',
                };
                return months[value as number] ?? '';
              },
            },
            title: {
              display: true,
              text: 'Month',
            },
          },
          // Y axis represents the day of the month.
          y: {
            min: 1,
            max: 31,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
            title: {
              display: true,
              text: 'Day',
            },
          },
        },
      },
    });
  }
  
  // Destroy the current chart instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  // Clean up chart when the component is destroyed.
  ngOnDestroy(): void {
    this.destroyChart();
  }
}
