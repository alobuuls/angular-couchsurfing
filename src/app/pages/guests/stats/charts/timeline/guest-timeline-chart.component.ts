import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';
import { ForceDirectedGraphController, EdgeLine } from 'chartjs-chart-graph';
import { LinearScale, PointElement } from 'chart.js';

// Register the network graph.
Chart.register(ForceDirectedGraphController, EdgeLine, LinearScale, PointElement);

// Interfaces
import { ISameArrivalDay, ISameStay, ITimelineDistribution, ITimelineItem, ITimelineView } from '@interfaces/stats-interface';

// Helpers
import { CHART_UNKNOWN_COLOR, getRankingColors, RANKING_COLORS, TIMELINE_COLORS } from '@utils';

// Service
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-timeline-chart',
  templateUrl: './guest-timeline-chart.component.html',
  styleUrls: ['./guest-timeline-chart.component.css'],
})
export class GuestTimelineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  @Input() timeline!: ITimelineDistribution;

  @ViewChild('timelineChart')
  timelineChart!: ElementRef<HTMLCanvasElement>;

  // Controls the selected timeline view.
  selectedView: ITimelineView = 'years';

  // Available timeline views.
  readonly timelineViews: ITimelineView[] = ['years', 'months', 'days', 'sameArrivalDay', 'sameStay'];

  private chart?: Chart;

  // Configuration for each timeline view.
  private readonly chartConfig: Record<
    ITimelineView,
    {
      titleKey: string;
      type: 'bar' | 'network';
      getData: (timeline: ITimelineDistribution) => ITimelineItem[] | ISameArrivalDay[] | ISameStay[];
    }
  > = {
    years: {
      titleKey: 'STATS.TIMELINE.TITLES.YEARS',
      type: 'bar',
      getData: timeline => timeline.years,
    },
    months: {
      titleKey: 'STATS.TIMELINE.TITLES.MONTHS',
      type: 'bar',
      getData: timeline => timeline.months,
    },
    days: {
      titleKey: 'STATS.TIMELINE.TITLES.DAYS',
      type: 'bar',
      getData: timeline => timeline.days,
    },
    sameArrivalDay: {
      titleKey: 'STATS.TIMELINE.TITLES.SAMEARRIVALDAY',
      type: 'bar',
      getData: timeline => timeline.sameArrivalDay,
    },
    sameStay: {
      titleKey: 'STATS.TIMELINE.TITLES.SAMESTAY',
      type: 'network',
      getData: timeline => timeline.sameStay,
    },
  };

  ngAfterViewInit(): void {
    // Update chart texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.destroyChart();
      this.createChart();
    });

    // Create the initial chart after the canvas is rendered.
    if (this.timeline) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart when data changes.
    if (changes['timeline'] && this.timelineChart && this.timeline) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from language changes.
    this.langChangeSubscription?.unsubscribe();

    // Destroy the current chart.
    this.destroyChart();
  }

  selectView(view: ITimelineView): void {
    this.selectedView = view;

    // Remove the previous chart.
    this.destroyChart();

    // Wait for Angular to update the canvas.
    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    if (!this.timelineChart || !this.timeline) {
      return;
    }

    const config = this.chartConfig[this.selectedView];

    // Get data for the selected view.
    const timelineData = config.getData(this.timeline);

    // Remove any existing chart.
    this.destroyChart();

    // Stop when there is no data.
    if (!timelineData.length) {
      return;
    }

    if (config.type === 'network') {
      this.createNetworkChart(timelineData as ISameStay[]);
      return;
    }

    this.createBarChart(timelineData as ITimelineItem[] | ISameArrivalDay[], this._translate.instant(config.titleKey));
  }

  private createBarChart(data: ITimelineItem[] | ISameArrivalDay[], label: string): void {
    // Give the chart more space when needed.
    this.setChartHeight(data.length);

    // Get ranking colors based on the number of guests.
    const rankingColors = getRankingColors(data.map(item => item.total));

    this.chart = new Chart(this.timelineChart.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(item => this.formatTimelineLabel(item)),
        datasets: [
          {
            label,
            // Use the total number of guests.
            data: data.map(item => item.total),
            // Color bars according to their ranking.
            backgroundColor: rankingColors.background,
            borderColor: rankingColors.border,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,

        // Horizontal bars improve text readability.
        indexAxis: 'y',

        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const item = data[index];

          if (!item) {
            return;
          }

          if (this.selectedView === 'years') {
            const yearItem = item as ITimelineItem;
            this.navigateToYear(yearItem.period);
          }

          if (this.selectedView === 'months') {
            const monthItem = item as ITimelineItem;
            this.navigateToMonth(monthItem.period);
          }

          if (this.selectedView === 'days') {
            const dayItem = item as ITimelineItem;
            this.navigateToDay(dayItem.period);
            return;
          }

          if (this.selectedView === 'sameArrivalDay') {
            const arrivalItem = item as ISameArrivalDay;
            this.navigateToSameArrivalDay(arrivalItem.date);
            return;
          }
        },

        plugins: {
          title: {
            display: true,
            text: this.getChartTitle(),
          },

          legend: {
            display: true,
            labels: {
              generateLabels: () => [
                {
                  text: this._translate.instant('STATS.TIMELINE.LABELS.FIRST'),
                  fillStyle: RANKING_COLORS.gold.background,
                  strokeStyle: RANKING_COLORS.gold.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.TIMELINE.LABELS.SECOND'),
                  fillStyle: RANKING_COLORS.silver.background,
                  strokeStyle: RANKING_COLORS.silver.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.TIMELINE.LABELS.THIRD'),
                  fillStyle: RANKING_COLORS.bronze.background,
                  strokeStyle: RANKING_COLORS.bronze.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.TIMELINE.LABELS.OTHER'),
                  fillStyle: RANKING_COLORS.neutral.background,
                  strokeStyle: RANKING_COLORS.neutral.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
              ],
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: this._translate.instant('STATS.TIMELINE.LABELS.NUMBER_OF_GUESTS'),
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  private createNetworkChart(data: ISameStay[]): void {
    // Convert guests into network nodes.
    const nodes = this.getNetworkNodes(data);

    // Create an index for each node.
    const nodeIndexes = new Map(nodes.map((node, index) => [node.id, index]));

    // Convert shared stays into connections.
    const edges = this.getNetworkEdges(data, nodeIndexes);

    // Stop when there are no nodes.
    if (!nodes.length) {
      return;
    }

    this.chart = new Chart(this.timelineChart.nativeElement, {
      type: 'forceDirectedGraph',
      data: {
        // Use guest names as node labels.
        labels: nodes.map(node => node.label),

        datasets: [
          {
            // Create one node for every guest.
            data: nodes.map(() => ({})),

            // Connect guests who shared a stay.
            edges,

            pointRadius: 8,
            pointHoverRadius: 10,
            pointBackgroundColor: TIMELINE_COLORS.sameStay.background,
            pointBorderColor: TIMELINE_COLORS.sameStay.border,
            borderColor: TIMELINE_COLORS.sameStay.edges,
            borderWidth: 2,
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
          const node = nodes[index];

          if (!node?.guestId) {
            return;
          }

          this.navigateToGuest(node.guestId, node.groupType, node.groupId);
        },

        plugins: {
          title: {
            display: true,
            text: this._translate.instant('STATS.TIMELINE.TITLES.SAMESTAY'),
          },

          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              label: context => {
                const node = nodes[context.dataIndex];

                return [
                  node.label,
                  this._translate.instant('STATS.TIMELINE.LABELS.COUNTRY', {
                    country: this._format.formatCountry(node.country),
                  }),
                  this._translate.instant('GENDER.LABEL', {
                    gender: this._format.formatGender(node.gender),
                  }),
                  this._translate.instant('STATS.TIMELINE.LABELS.VISIT', {
                    date: this._format.formatDate(node.visitedDate),
                  }),
                ];
              },
            },
          },
        },
      },
    });
  }

  private getNetworkNodes(data: ISameStay[]): {
    id: string;
    label: string;
    country: string;
    visitedDate: string;
    guestId: string;
    gender: string;
    groupType: string | null;
    groupId: string | null;
  }[] {
    const nodes = new Map<
      string,
      {
        id: string;
        label: string;
        country: string;
        visitedDate: string;
        gender: string;
        guestId: string;
        groupType: string | null;
        groupId: string | null;
      }
    >();

    data.forEach(item => {
      // Add the main guest as a node.
      nodes.set(item.guest.guestId, {
        id: item.guest.guestId,
        label: this.getGuestDisplayName(item.guest.fullName, item.guest.groupType),
        country: item.guest.hometownCode,
        visitedDate: item.guest.visitedDate,
        gender: item.guest.gender,
        guestId: item.guest.guestId,
        groupType: item.guest.groupType,
        groupId: item.guest.groupId,
      });

      // Add every overlapping guest as a node.
      item.guests.forEach(guest => {
        nodes.set(guest.guestId, {
          id: guest.guestId,
          label: this.getGuestDisplayName(guest.fullName, guest.groupType),
          country: guest.hometownCode,
          visitedDate: guest.visitedDate,
          guestId: guest.guestId,
          gender: guest.gender,
          groupType: guest.groupType,
          groupId: guest.groupId,
        });
      });
    });

    return Array.from(nodes.values());
  }

  private getGuestDisplayName(fullName: string, groupType: string | null): string {
    if (!groupType || groupType === 'solo') {
      return fullName;
    }

    const groupLabelKeys: Record<string, string> = {
      couple: 'STATS.TIMELINE.GROUP_LABELS.COUPLE',
      friends: 'STATS.TIMELINE.GROUP_LABELS.FRIENDS',
      family: 'STATS.TIMELINE.GROUP_LABELS.FAMILY',
    };

    const groupLabelKey = groupLabelKeys[groupType];

    if (!groupLabelKey) {
      return fullName;
    }

    const groupLabel = this._translate.instant(groupLabelKey);

    return this._translate.instant('STATS.TIMELINE.LABELS.GROUP_NAME', {
      name: fullName,
      group: groupLabel,
    });
  }

  private getNetworkEdges(
    data: ISameStay[],
    nodeIndexes: Map<string, number>
  ): {
    source: number;
    target: number;
  }[] {
    const edges: {
      source: number;
      target: number;
    }[] = [];

    data.forEach(item => {
      const source = nodeIndexes.get(item.guest.guestId);

      // Skip invalid source nodes.
      if (source === undefined) {
        return;
      }

      item.guests.forEach(guest => {
        const target = nodeIndexes.get(guest.guestId);

        // Skip invalid target nodes.
        if (target === undefined) {
          return;
        }

        edges.push({
          source,
          target,
        });
      });
    });

    return edges;
  }

  private getChartTitle(): string {
    return this._translate.instant(this.chartConfig[this.selectedView].titleKey);
  }

  // Change the chart height.
  private setChartHeight(dataLength: number): void {
    const canvas = this.timelineChart.nativeElement;

    // Give each item enough vertical space.
    if (dataLength > 5) {
      const height = Math.max(500, dataLength * 35);
      canvas.style.height = `${height}px`;
    } else {
      canvas.style.height = '';
    }
  }

  private destroyChart(): void {
    // Destroy the current Chart.js instance.
    this.chart?.destroy();
    this.chart = undefined;
  }

  private formatTimelineLabel(item: ITimelineItem | ISameArrivalDay): string {
    if ('date' in item) {
      return this._format.formatDate(item.date);
    }

    if (this.selectedView === 'months') {
      return this._format.formatMonth(item.period);
    }

    if (this.selectedView === 'days') {
      return this._format.formatDay(item.period);
    }

    return item.period;
  }

  private navigateToYear(year: string): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      },
    });
  }

  private navigateToMonth(month: string): void {
    const [year, monthNumber] = month.split('-');
    const lastDay = new Date(Number(year), Number(monthNumber), 0).getDate();

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, '0')}`,
      },
    });
  }

  private navigateToDay(period: string): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        day: period,
      },
    });
  }

  private navigateToSameArrivalDay(date: string): void {
    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        from: date,
        to: date,
      },
    });
  }

  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }
}
