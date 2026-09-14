import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

// Register matrix to heatmap
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
Chart.register(MatrixController, MatrixElement);

// Interfaces
import { IBirthdaysDistribution, IBirthdaysView } from '@interfaces/stats-interface';

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
    // Calendar birthdays use a Matrix heatmap.
    if (this.selectedView === 'calendar') {
      this.createCalendarHeatmap();
      return;
    }
    // Unusual birthdays use a Line chart.
    if (this.selectedView === 'unusual') {
      this.createUnusualLineChart();
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
            backgroundColor: 'rgba(102, 204, 255, 0.5)',
            borderColor: 'rgb(102, 222, 255)',
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

  // UNUSUAL
  private createUnusualLineChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }
    const unusual = this.birthdays.unusual;
    if (!unusual || unusual.length === 0) {
      return;
    }

    // Destroy previous chart.
    this.destroyChart();

    this.chart = new Chart(this.birthdaysChart.nativeElement, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Unusual Birthdays',
            data: unusual.map(item => ({
              x: item.month,
              y: item.day,
            })),
            borderColor: 'rgb(48, 159, 37)',
            backgroundColor: 'rgba(37, 162, 83, 0.5)',
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 11,
            tension: 0,
            // Connect the unusual birthday dates.
            showLine: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 30,
            right: 40,
            bottom: 30,
            left: 40,
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Unusual Birthdays',
          },
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              title: context => {
                const item = unusual[context[0].dataIndex];
                return this._format.formatBirthday(item.month, item.day);
              },
              label: context => {
                const item = unusual[context.dataIndex];
                return `Reason: ${item.reason}`;
              },
              afterBody: context => {
                const item = unusual[context[0].dataIndex];
                return [`Guests: ${item.total}`, '', ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 13,
            position: 'bottom',
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
          y: {
            type: 'linear',
            min: 0,
            max: 32,
            ticks: {
              stepSize: 1,
              precision: 0,
              callback: value => {
                return value === 0 || value === 32 ? '' : value;
              },
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

  // CALENDAR
  private createCalendarHeatmap(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }
    const calendar = this.birthdays.calendar;
    if (!calendar || calendar.length === 0) {
      return;
    }

    // Destroy previous chart.
    this.destroyChart();

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = Array.from({ length: 31 }, (_, index) => String(index + 1));
    // Store birthday information by month and day.
    const birthdayMap = new Map(calendar.map(item => [`${item.month}-${item.day}`, item]));
    // Create all 12 × 31 calendar cells.
    const calendarData = months.flatMap((month, monthIndex) =>
      days.map(day => {
        const monthNumber = monthIndex + 1;
        const dayNumber = Number(day);
        const item = birthdayMap.get(`${monthNumber}-${dayNumber}`);

        return {
          x: month,
          y: day,
          v: item?.total ?? 0,
        };
      })
    );

    this.chart = new Chart(this.birthdaysChart.nativeElement, {
      type: 'matrix',
      data: {
        datasets: [
          {
            label: 'Birthdays Calendar',
            data: calendarData,
            backgroundColor: context => {
              const value = context.dataset.data[context.dataIndex] as {
                x: string;
                y: string;
                v: number;
              };

              const total = value.v;

              if (total === 0) {
                return 'rgba(238, 238, 238, 0.2)';
              }
              if (total === 1) {
                return 'rgba(153, 102, 255, 0.35)';
              }
              if (total === 2) {
                return 'rgba(153, 102, 255, 0.6)';
              }
              return 'rgba(153, 102, 255, 0.95)';
            },
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,

            width: ({ chart }) => {
              const area = chart.chartArea;

              if (!area) {
                return 20;
              }
              return (area.right - area.left) / 12 - 2;
            },

            height: ({ chart }) => {
              const area = chart.chartArea;

              if (!area) {
                return 20;
              }
              return (area.bottom - area.top) / 31 - 2;
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 30,
            right: 40,
            bottom: 30,
            left: 40,
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Birthdays Calendar',
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: context => {
                const value = context[0].raw as {
                  x: string;
                  y: string;
                  v: number;
                };

                const monthIndex = months.indexOf(value.x) + 1;
                const day = Number(value.y);

                return this._format.formatBirthday(monthIndex, day);
              },
              label: context => {
                const value = context.raw as {
                  x: string;
                  y: string;
                  v: number;
                };
                return `Guests: ${value.v}`;
              },
              afterBody: context => {
                const value = context[0].raw as {
                  x: string;
                  y: string;
                  v: number;
                };

                const monthIndex = months.indexOf(value.x) + 1;
                const day = Number(value.y);
                const item = birthdayMap.get(`${monthIndex}-${day}`);

                if (!item) {
                  return [];
                }
                return ['', ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            labels: months,
            offset: true,
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: 'Month',
            },
          },
          y: {
            type: 'category',
            labels: days,
            reverse: true,
            offset: true,
            grid: {
              display: false,
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
