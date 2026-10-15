import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import Chart from 'chart.js/auto';

// Register matrix to heatmap
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
Chart.register(MatrixController, MatrixElement);

// Interfaces
import { IBirthdaysDistribution, IBirthdaysView } from '@interfaces/stats-interface';

// Helpers
import { BIRTHDAYS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-birthdays-chart',
  templateUrl: './guest-birthdays-chart.component.html',
  styleUrls: ['./guest-birthdays-chart.component.css'],
})
export class GuestBirthdaysChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  // Birthdays data received from parent
  @Input() birthdays!: IBirthdaysDistribution;

  // Chart canvas
  @ViewChild('birthdaysChart')
  birthdaysChart!: ElementRef<HTMLCanvasElement>;

  // Stores the main selected Birthdays view
  selectedView: IBirthdaysView = 'calendar';

  // Main Birthdays views
  readonly birthdaysViews: IBirthdaysView[] = ['calendar', 'repeated', 'unusual'];

  // Stores current Chart.js instance
  private chart?: Chart;

  // Subscription to language changes
  private langChangeSubscription = this._translate.onLangChange.subscribe(() => {
    if (this.birthdaysChart && this.birthdays) {
      this.destroyChart();
      this.createChart();
    }
  });

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

    // Destroy current chart
    this.destroyChart();

    // Wait for Angular to update the template
    setTimeout(() => this.createChart());
  }

  // Gets a translated text
  private translate(key: string, params?: Record<string, unknown>): string {
    return this._translate.instant(key, params);
  }

  // Gets translated month names
  private getMonths(): string[] {
    return [
      this.translate('STATS.BIRTHDAYS.MONTHS.JANUARY'),
      this.translate('STATS.BIRTHDAYS.MONTHS.FEBRUARY'),
      this.translate('STATS.BIRTHDAYS.MONTHS.MARCH'),
      this.translate('STATS.BIRTHDAYS.MONTHS.APRIL'),
      this.translate('STATS.BIRTHDAYS.MONTHS.MAY'),
      this.translate('STATS.BIRTHDAYS.MONTHS.JUNE'),
      this.translate('STATS.BIRTHDAYS.MONTHS.JULY'),
      this.translate('STATS.BIRTHDAYS.MONTHS.AUGUST'),
      this.translate('STATS.BIRTHDAYS.MONTHS.SEPTEMBER'),
      this.translate('STATS.BIRTHDAYS.MONTHS.OCTOBER'),
      this.translate('STATS.BIRTHDAYS.MONTHS.NOVEMBER'),
      this.translate('STATS.BIRTHDAYS.MONTHS.DECEMBER'),
    ];
  }

  // Gets a translated month by its number
  private getMonthName(month: number): string {
    return this.getMonths()[month - 1] ?? '';
  }

  // Creates the corresponding chart according to the selected view
  private createChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }

    if (this.selectedView === 'repeated') {
      this.createRepeatedBubbleChart();
      return;
    }

    if (this.selectedView === 'calendar') {
      this.createCalendarHeatmap();
      return;
    }

    if (this.selectedView === 'unusual') {
      this.createUnusualLineChart();
    }
  }

  // REPEATED
  // Creates the Bubble chart for repeated birthdays
  private createRepeatedBubbleChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }

    const repeated = this.birthdays.repeated;

    if (!repeated || repeated.length === 0) {
      this.destroyChart();
      return;
    }

    this.destroyChart();

    this.chart = new Chart(this.birthdaysChart.nativeElement, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: this.translate('STATS.BIRTHDAYS.LABELS.REPEATED_BIRTHDAYS'),
            // Each bubble represents one repeated birthday date
            data: repeated.map(item => ({
              x: item.month,
              y: item.day,
              // More guests means a larger bubble
              r: Math.max(10, item.total * 6),
            })),
            // Use one color for repeated birthday dates
            backgroundColor: BIRTHDAYS_COLORS.repeated.background,
            borderColor: BIRTHDAYS_COLORS.repeated.border,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const item = repeated[index];

          if (!item) {
            return;
          }

          this.navigateToBirthday(item.month, item.day);
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translate('STATS.BIRTHDAYS.TITLES.REPEATED'),
          },
          legend: {
            display: true,
          },
          // Show birthday information when hovering over a bubble
          tooltip: {
            callbacks: {
              title: context => {
                const item = repeated[context[0].dataIndex];
                return this._format.formatBirthday(item.month, item.day);
              },
              label: context => {
                const item = repeated[context.dataIndex];

                return this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', {
                  count: item.total,
                });
              },
              afterBody: context => {
                const item = repeated[context[0].dataIndex];

                return ['', this.translate('STATS.BIRTHDAYS.LABELS.GUESTS'), ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          // X axis represents the month
          x: {
            min: 0,
            max: 13,
            ticks: {
              stepSize: 1,
              callback: value => {
                return this.getMonthName(Number(value));
              },
            },
            title: {
              display: true,
              text: this.translate('STATS.BIRTHDAYS.AXES.MONTH'),
            },
          },
          // Y axis represents the day of the month
          y: {
            min: 1,
            max: 31,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
            title: {
              display: true,
              text: this.translate('STATS.BIRTHDAYS.AXES.DAY'),
            },
          },
        },
      },
    });
  }

  // UNUSUAL
  // Creates the Line chart for unusual birthdays
  private createUnusualLineChart(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }

    const unusual = this.birthdays.unusual;

    if (!unusual || unusual.length === 0) {
      this.destroyChart();
      return;
    }

    this.destroyChart();

    this.chart = new Chart(this.birthdaysChart.nativeElement, {
      type: 'line',
      data: {
        datasets: [
          {
            label: this.translate('STATS.BIRTHDAYS.LABELS.UNUSUAL_BIRTHDAYS'),
            data: unusual.map(item => ({
              x: item.month,
              y: item.day,
            })),
            borderColor: BIRTHDAYS_COLORS.unusual.border,
            backgroundColor: BIRTHDAYS_COLORS.unusual.background,
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 11,
            tension: 0,
            // Connect the unusual birthday dates
            showLine: true,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const item = unusual[index];

          if (!item) {
            return;
          }

          this.navigateToBirthday(item.month, item.day);
        },
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
            text: this.translate('STATS.BIRTHDAYS.TITLES.UNUSUAL'),
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

                return this.translate('STATS.BIRTHDAYS.TOOLTIPS.REASON', {
                  reason: item.reason,
                });
              },
              afterBody: context => {
                const item = unusual[context[0].dataIndex];

                return [
                  this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', {
                    count: item.total,
                  }),
                  '',
                  ...item.guests.map(guest => `• ${guest.fullName}`),
                ];
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
                return this.getMonthName(Number(value));
              },
            },
            title: {
              display: true,
              text: this.translate('STATS.BIRTHDAYS.AXES.MONTH'),
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
              text: this.translate('STATS.BIRTHDAYS.AXES.DAY'),
            },
          },
        },
      },
    });
  }

  // CALENDAR
  // Creates the Matrix heatmap for birthdays
  private createCalendarHeatmap(): void {
    if (!this.birthdaysChart || !this.birthdays) {
      return;
    }

    const calendar = this.birthdays.calendar;

    if (!calendar || calendar.length === 0) {
      this.destroyChart();
      return;
    }

    this.destroyChart();

    const months = this.getMonths();
    const days = Array.from({ length: 31 }, (_, index) => String(index + 1));

    // Store birthday information by month and day
    const birthdayMap = new Map(calendar.map(item => [`${item.month}-${item.day}`, item]));

    // Create all 12 × 31 calendar cells
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
            label: this.translate('STATS.BIRTHDAYS.LABELS.CALENDAR'),
            data: calendarData,
            backgroundColor: context => {
              const value = context.dataset.data[context.dataIndex] as {
                x: string;
                y: string;
                v: number;
              };

              const total = value.v;

              if (total === 0) {
                return BIRTHDAYS_COLORS.calendar.empty;
              }

              if (total === 1) {
                return BIRTHDAYS_COLORS.calendar.one;
              }

              if (total === 2) {
                return BIRTHDAYS_COLORS.calendar.two;
              }

              return BIRTHDAYS_COLORS.calendar.many;
            },
            borderColor: BIRTHDAYS_COLORS.calendar.border,
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
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const cell = calendarData[index];

          if (!cell || cell.v === 0) {
            return;
          }

          const monthIndex = months.indexOf(cell.x) + 1;
          const day = Number(cell.y);

          this.navigateToBirthday(monthIndex, day);
        },
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
            text: this.translate('STATS.BIRTHDAYS.TITLES.CALENDAR'),
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

                return this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', {
                  count: value.v,
                });
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
              text: this.translate('STATS.BIRTHDAYS.AXES.MONTH'),
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
              text: this.translate('STATS.BIRTHDAYS.AXES.DAY'),
            },
          },
        },
      },
    });
  }

  // Destroy the current chart instance
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  // Clean up chart and subscription when the component is destroyed
  ngOnDestroy(): void {
    this.destroyChart();
    this.langChangeSubscription.unsubscribe();
  }

  private navigateToBirthday(month: number, day: number): void {
    const birthDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        birthDate,
      },
    });
  }
}
