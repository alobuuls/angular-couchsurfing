import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { LinearScale, PointElement } from 'chart.js';

import { ForceDirectedGraphController, EdgeLine } from 'chartjs-chart-graph';

// Register the network graph.
Chart.register(ForceDirectedGraphController, EdgeLine, LinearScale, PointElement);

import { ISameArrivalDay, ISameStay, ITimelineDistribution, ITimelineItem, ITimelineView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-timeline-chart',
  templateUrl: './guest-timeline-chart.component.html',
  styleUrls: ['./guest-timeline-chart.component.css'],
})
export class GuestTimelineChartComponent implements AfterViewInit, OnChanges {
  @Input() timeline!: ITimelineDistribution;

  @ViewChild('timelineChart')
  timelineChart!: ElementRef<HTMLCanvasElement>;

  // Controls the selected timeline view.
  selectedView: ITimelineView = 'years';

  // Available timeline views.
  readonly timelineViews: ITimelineView[] = ['years', 'months', 'days', 'sameArrivalDay', 'sameStay'];

  readonly timelineViewLabels: Record<ITimelineView, string> = {
    years: 'Years',
    months: 'Months',
    days: 'Days',
    sameArrivalDay: 'Same Arrival Day',
    sameStay: 'Same Stay',
  };

  private chart?: Chart;

  // Configuration for each timeline view.
  private readonly chartConfig: Record<
    ITimelineView,
    {
      label: string;
      type: 'bar' | 'network';
      getData: (timeline: ITimelineDistribution) => ITimelineItem[] | ISameArrivalDay[] | ISameStay[];
    }
  > = {
    years: {
      label: 'Guests by Year',
      type: 'bar',
      getData: timeline => timeline.years,
    },

    months: {
      label: 'Guests by Month',
      type: 'bar',
      getData: timeline => timeline.months,
    },

    days: {
      label: 'Guests by Day of Month',
      type: 'bar',
      getData: timeline => timeline.days,
    },

    sameArrivalDay: {
      label: 'Guests Arriving on the Same Day',
      type: 'bar',
      getData: timeline => timeline.sameArrivalDay,
    },

    sameStay: {
      label: 'Guests Sharing the Same Stay',
      type: 'network',
      getData: timeline => timeline.sameStay,
    },
  };

  ngAfterViewInit(): void {
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

    // Stop when there is no data.
    if (!timelineData.length) {
      return;
    }

    // Remove any existing chart.
    this.destroyChart();

    if (config.type === 'network') {
      this.createNetworkChart(timelineData as ISameStay[]);
      return;
    }
    this.createBarChart(timelineData as ITimelineItem[] | ISameArrivalDay[], config.label);
  }

  private createBarChart(data: ITimelineItem[] | ISameArrivalDay[], label: string): void {
    // Give the chart more space when needed.
    this.setChartHeight(data.length);
    this.chart = new Chart(this.timelineChart.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map(item => {
          if ('date' in item) {
            return this.formatArrivalDate(item.date);
          }

          return item.period;
        }),
        datasets: [
          {
            label,

            // Use the total number of guests.
            data: data.map(item => item.total),
            backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 205, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(54, 162, 235, 0.2)'],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)'],
            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,
        // Horizontal bars improve text readability.
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: this.getChartTitle(label),
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Guests',
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
            pointBackgroundColor: 'rgba(75, 192, 192, 0.8)',
            pointBorderColor: 'rgb(75, 192, 192)',
            borderColor: 'rgba(75, 192, 192, 0.4)',
            borderWidth: 2,
          },
        ],
      },

      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Guests Sharing the Same Stay',
          },
          legend: {
            display: false,
          },
        },
      },
    });
  }

  private getNetworkNodes(data: ISameStay[]): {
    id: string;
    label: string;
  }[] {
    const nodes = new Map<
      string,
      {
        id: string;
        label: string;
      }
    >();

    data.forEach(item => {
      // Add the main guest as a node.
      nodes.set(item.guest.guestId, {
        id: item.guest.guestId,
        label: item.guest.fullName,
      });

      // Add every overlapping guest as a node.
      item.guests.forEach(guest => {
        nodes.set(guest.guestId, {
          id: guest.guestId,
          label: guest.fullName,
        });
      });
    });

    return Array.from(nodes.values());
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

  private getChartTitle(label: string): string {
    const chartTitles: Record<ITimelineView, string> = {
      years: label,
      months: label,
      days: label,
      sameArrivalDay: label,
      sameStay: label,
    };

    return chartTitles[this.selectedView];
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

  // DATE
  private formatArrivalDate(date: string): string {
    const parsedDate = new Date(`${date}T00:00:00`);
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).formatToParts(parsedDate);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;

    return `${year}, ${month} ${day}`;
  }
}
