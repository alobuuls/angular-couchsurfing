import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

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
    maxPeopleTogether: 'Max People Together',
    sameArrival: 'Same Arrival',
    sameDates: 'Same Dates',
  };

  // Stores the selected subview for Longest and Shortest
  selectedStayView: ILongestView = 'overall';

  // Longest and Shortest subviews
  readonly stayViews: ILongestView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

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
    if (changes['stays'] && this.staysChart) {
      this.createChart();
    }
  }

  // Changes the main Stays view
  selectView(view: IStaysView): void {
    this.selectedView = view;

    // Destroy current chart
    this.destroyChart();

    // Wait for Angular to update the template
    setTimeout(() => this.createChart());
  }

  // Changes the selected Longest/Shortest subview
  selectStayView(view: ILongestView): void {
    this.selectedStayView = view;

    // Destroy current chart
    this.destroyChart();

    // Wait for Angular to update the template
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
    }
  }

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

            // Number of nights determines the size of each section
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

  // Builds the common tooltip information
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

  // Formats group type for display
  private formatGroupType(groupType: string): string {
    if (!groupType) {
      return 'Unknown';
    }
    return groupType.charAt(0).toUpperCase() + groupType.slice(1);
  }

  // Formats date for tooltip display
  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Destroys the current Chart.js instance
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  // Destroy Chart.js instance when component is destroyed
  ngOnDestroy(): void {
    this.destroyChart();
  }
}
