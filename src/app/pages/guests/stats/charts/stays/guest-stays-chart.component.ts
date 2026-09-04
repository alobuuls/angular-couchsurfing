import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { LinearScale, PointElement } from 'chart.js';

import { EdgeLine, ForceDirectedGraphController } from 'chartjs-chart-graph';

// Register the network graph.
Chart.register(ForceDirectedGraphController, EdgeLine, LinearScale, PointElement);

// Interfaces
import { ILongestView, IStaysDistribution, IStaysView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-stays-chart',
  templateUrl: './guest-stays-chart.component.html',
  styleUrls: ['./guest-stays-chart.component.css'],
})
export class GuestStaysChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  // Stays data received from parent
  @Input() stays!: IStaysDistribution;

  // Chart canvas
  @ViewChild('staysChart')
  staysChart!: ElementRef<HTMLCanvasElement>;

  // Stores the main selected Stays view
  selectedView: IStaysView = 'longest';

  // Main Stays views
  readonly staysViews: IStaysView[] = ['longest', 'shortest', 'maxPeopleTogether', 'sameArrival', 'sameDates'];

  // Labels for main Stays views
  readonly staysViewLabels: Record<IStaysView, string> = {
    longest: 'Longest',
    shortest: 'Shortest',
    maxPeopleTogether: 'People Together',
    sameArrival: 'Same Arrival',
    sameDates: 'Same Dates',
  };

  // Stores the selected Longest/Shortest subview
  selectedStayView: ILongestView = 'overall';

  // Longest and Shortest subviews.
  readonly stayViews: ILongestView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // Stores the selected Same Dates group.
  selectedSameDatesGroup = 0;

  // Stores current Chart.js instance
  private chart?: Chart;

  // Configuration for Longest and Shortest views
  private readonly chartConfig: Record<
    'longest' | 'shortest',
    {
      label: string;
      getData: (stays: IStaysDistribution) => IStaysDistribution['longest'];
    }
  > = {
    longest: {
      label: 'Longest Stays',
      getData: stays => stays.longest,
    },
    shortest: {
      label: 'Shortest Stays',
      getData: stays => stays.shortest,
    },
  };

  // Gender colors
  private readonly genderColors: Record<string, string> = {
    female: 'rgba(255, 99, 132, 0.5)',
    male: 'rgba(54, 162, 235, 0.5)',
    trans: 'rgba(153, 102, 255, 0.5)',
    isGay: 'rgba(255, 193, 7, 0.5)',
  };

  // Gender border colors
  private readonly genderBorderColors: Record<string, string> = {
    female: 'rgb(255, 99, 132)',
    male: 'rgb(54, 162, 235)',
    trans: 'rgb(153, 102, 255)',
    isGay: 'rgb(255, 193, 7)',
  };

  // Gender labels for tooltip
  private readonly genderLabels: Record<string, string> = {
    female: 'Female',
    male: 'Male',
    trans: 'Trans',
    isGay: 'Gay',
  };

  // Group type labels for tooltip
  private readonly groupTypeLabels: Record<string, string> = {
    solo: 'Solo',
    couple: 'Couple',
    friends: 'Friends',
    family: 'Family',
  };

  // Creates the chart after the view is initialized
  ngAfterViewInit(): void {
    if (this.stays) {
      this.createChart();
    }
  }

  // Recreates the chart when the input data changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stays'] && this.staysChart && this.stays) {
      // Reset the selected group when new data arrives.
      this.selectedSameDatesGroup = 0;
      setTimeout(() => this.createChart());
    }
  }

  // Changes the main Stays view
  selectView(view: IStaysView): void {
    this.selectedView = view;

    // Reset Same Dates group when entering this view.
    if (view === 'sameDates') {
      this.selectedSameDatesGroup = 0;
    }

    // Destroy current chart
    this.destroyChart();

    // Wait for Angular to update the template
    setTimeout(() => this.createChart());
  }

  // Changes the selected Longest/Shortest subview
  selectStayView(view: ILongestView): void {
    this.selectedStayView = view;

    // Destroy current chart.
    this.destroyChart();

    // Wait for Angular to update the template.
    setTimeout(() => this.createChart());
  }

  // Changes the selected Same Dates group.
  selectSameDatesGroup(index: number): void {
    this.selectedSameDatesGroup = index;

    // Destroy current chart.
    this.destroyChart();

    // Wait for Angular to update the canvas.
    setTimeout(() => this.createChart());
  }

  // Creates the corresponding chart according to the selected view
  private createChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }

    // Longest and Shortest use the same Polar Area chart
    if (this.selectedView === 'longest' || this.selectedView === 'shortest') {
      const config = this.chartConfig[this.selectedView];

      const stayData = config.getData(this.stays);

      this.createStayPolarChart(stayData, this.selectedStayView, config.label);

      return;
    }

    if (this.selectedView === 'maxPeopleTogether') {
      this.createMaxPeopleTogetherBarChart();
      return;
    }

    // Same Arrival uses a Horizontal Bar chart.
    if (this.selectedView === 'sameArrival') {
      this.createSameArrivalBarChart();
      return;
    }

    // Same Dates uses one Network chart per group.
    if (this.selectedView === 'sameDates') {
      this.createSameDatesNetworkChart();
      return;
    }
  }

  // LONGEST / SHORTEST
  // Creates the Polar Area chart for Longest and Shortest stays
  private createStayPolarChart(stayData: IStaysDistribution['longest'], selectedView: ILongestView, chartLabel: string): void {
    if (!this.staysChart || !stayData) {
      return;
    }

    // Get the selected stay data
    const people = stayData[selectedView];
    if (!people || people.length === 0) {
      return;
    }

    // Destroy previous chart
    this.destroyChart();

    // Create Polar Area chart
    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'polarArea',
      data: {
        labels: people.map(item => item.guest.fullName),
        datasets: [
          {
            label: chartLabel,

            // Number of nights determines the section size.
            data: people.map(item => item.nights),

            // Use guest gender for section colors
            backgroundColor: people.map(item => this.genderColors[item.guest.gender] ?? 'rgba(100, 100, 100, 0.5)'),
            borderColor: people.map(item => this.genderBorderColors[item.guest.gender] ?? 'rgb(100, 100, 100)'),
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
            text: chartLabel,
          },
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label: context => {
                const guest = people[context.dataIndex];
                return guest.guest.fullName;
              },
              afterBody: context => {
                const guest = people[context[0].dataIndex];
                return this.getTooltipLines(guest);
              },
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // MAX PEOPLE TOGETHER
  // Create Bar chart comparing Overall and Solo.
  private createMaxPeopleTogetherBarChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }
    const chartData = this.stays.maxPeopleTogether;

    if (!chartData) {
      return;
    }

    const overall = chartData.overall;
    const solo = chartData.solo;

    if (!overall || !solo) {
      return;
    }

    this.destroyChart();
    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Overall', 'Solo'],
        datasets: [
          {
            label: 'Maximum Guests Together',
            data: [overall.total, solo.total],
            backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(153, 102, 255, 0.5)'],
            borderColor: ['rgb(54, 162, 235)', 'rgb(153, 102, 255)'],
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
            text: 'Maximum Guests Together',
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: context => {
                return `Maximum guests: ${context.parsed.y}`;
              },
              afterBody: context => {
                const index = context[0].dataIndex;
                const selectedData = index === 0 ? overall : solo;
                return ['', 'Guests:', ...selectedData.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Guests',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Stay Type',
            },
          },
        },
      },
    });
  }

  // Create Horizontal Bar chart for guests with the same arrival date.
  private createSameArrivalBarChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }
    const chartData = this.stays.sameArrival;
    if (!chartData || chartData.length === 0) {
      return;
    }

    this.destroyChart();

    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'bar',
      data: {
        labels: chartData.map(item => this.formatDate(item.date)),
        datasets: [
          {
            label: 'Same Arrival',
            // Number of guests determines bar length.
            data: chartData.map(item => item.total),
            // Use the first guest gender for the bar color.
            backgroundColor: chartData.map(item => {
              const gender = item.guests[0]?.gender;
              return this.genderColors[gender] ?? 'rgba(100, 100, 100, 0.5)';
            }),
            borderColor: chartData.map(item => {
              const gender = item.guests[0]?.gender;
              return this.genderBorderColors[gender] ?? 'rgb(100, 100, 100)';
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Guests with Same Arrival Date',
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: context => {
                return `Overlapping guests: ${context.parsed.x}`;
              },
              afterBody: context => {
                const item = chartData[context[0].dataIndex];

                return ['', 'Guests:', ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            title: {
              display: true,
              text: 'Overlapping Guests',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Arrival Date',
            },
          },
        },
      },
    });
  }

  // Create network chart for guests with the same dates.
  private createSameDatesNetworkChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }
    const groups = this.stays.sameDates;
    if (!groups || groups.length === 0) {
      return;
    }

    const group = groups[this.selectedSameDatesGroup];
    if (!group || !group.guests || group.guests.length === 0) {
      return;
    }

    this.destroyChart();

    // Create one node for every guest in the group.
    const nodes = group.guests.map(guest => ({
      id: guest.guestId,
      label: guest.fullName,
      gender: guest.gender,
    }));

    // Connect every guest with the other guests in the same group.
    const edges = this.getSameDatesEdges(nodes);

    // Create Network chart.
    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'forceDirectedGraph',
      data: {
        // Use guest names as node labels.
        labels: nodes.map(node => node.label),
        datasets: [
          {
            // Create one node for every guest.
            data: nodes.map(() => ({})),

            // Connect guests from the same group.
            edges,

            // Node size.
            pointRadius: 10,
            pointHoverRadius: 13,

            // Use guest gender for node colors.
            pointBackgroundColor: nodes.map(node => this.genderColors[node.gender] ?? 'rgba(100, 100, 100, 0.5)'),
            pointBorderColor: nodes.map(node => this.genderBorderColors[node.gender] ?? 'rgb(100, 100, 100)'),
            borderColor: 'rgba(100, 100, 100, 0.4)',
            borderWidth: 2,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Same Dates - Group ${this.selectedSameDatesGroup + 1}`,
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: context => {
                const guest = nodes[context.dataIndex];
                return guest.label;
              },
              afterBody: context => {
                const guest = group.guests[context[0].dataIndex];
                return this.getNetworkTooltipLines(guest, nodes.length - 1);
              },
            },
          },
        },
      },
    });
  }

  // Create connections between every guest in the same dates group.
  private getSameDatesEdges(
    nodes: {
      id: string;
      label: string;
      gender: string;
    }[]
  ): {
    source: number;
    target: number;
  }[] {
    const edges: {
      source: number;
      target: number;
    }[] = [];

    for (let source = 0; source < nodes.length; source++) {
      for (let target = source + 1; target < nodes.length; target++) {
        edges.push({
          source,
          target,
        });
      }
    }
    return edges;
  }

  // Build tooltip information for stay charts.
  private getTooltipLines(item: IStaysDistribution['longest']['overall'][number]): string[] {
    const guest = item.guest;
    return [
      `Total nights: ${item.nights}`,
      `Group: ${this.groupTypeLabels[guest.groupType] ?? guest.groupType}`,
      `Gender: ${this.genderLabels[guest.gender] ?? guest.gender}`,
      `Country: ${guest.hometownCode}`,
      `Visited: ${this.formatDate(guest.visitedDate)}`,
    ];
  }

  // Build tooltip information for network nodes.
  private getNetworkTooltipLines(guest: IStaysDistribution['sameDates'][number]['guests'][number], connections: number): string[] {
    return [
      `Connections: ${connections}`,
      `Group: ${this.groupTypeLabels[guest.groupType] ?? guest.groupType}`,
      `Gender: ${this.genderLabels[guest.gender] ?? guest.gender}`,
      `Country: ${guest.hometownCode}`,
      `Visited: ${this.formatDate(guest.visitedDate)}`,
    ];
  }

  // Format dates for chart labels and tooltips.
  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
