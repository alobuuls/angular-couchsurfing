import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

// Interfaces
import { IGiftGuest, IGiftsDistribution, IGiftsView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-gifts-chart',
  templateUrl: './guest-gifts-chart.component.html',
  styleUrls: ['./guest-gifts-chart.component.css'],
})
export class GuestGiftsChartComponent implements AfterViewInit, OnChanges {
  @Input() gifts!: IGiftsDistribution;

  @ViewChild('giftsChart')
  giftsChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected gifts view.
  selectedView: IGiftsView = 'groups';

  // Available gifts views.
  readonly giftsViews: IGiftsView[] = ['groups', 'solo'];

  // Labels displayed in the view buttons.
  readonly giftsViewLabels: Record<IGiftsView, string> = {
    groups: 'Groups',
    solo: 'Solo',
  };

  private chart?: Chart;

  // Configuration for each gifts view.
  private readonly chartConfig: Record<
    IGiftsView,
    {
      label: string;
      type: 'polarArea';
      getData: (gifts: IGiftsDistribution) => IGiftGuest[];
    }
  > = {
    groups: {
      label: 'Gifts Received by Groups',
      type: 'polarArea',
      getData: gifts => gifts.groups,
    },

    solo: {
      label: 'Gifts Received by Solo Guests',
      type: 'polarArea',
      getData: gifts => gifts.solo,
    },
  };

  ngAfterViewInit(): void {
    if (this.gifts) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gifts'] && this.giftsChart) {
      this.createChart();
    }
  }

  selectView(view: IGiftsView): void {
    this.selectedView = view;
    this.destroyChart();

    setTimeout(() => {
      this.createChart();
    });
  }

  // Creates the Polar Area chart for the selected gifts view.
  private createChart(): void {
    if (!this.giftsChart || !this.gifts) {
      return;
    }
    const config = this.chartConfig[this.selectedView];
    const giftsData = config.getData(this.gifts);

    if (!giftsData.length) {
      return;
    }

    this.destroyChart();
    this.giftsChart.nativeElement.style.height = `${Math.max(400, giftsData.length * 50)}px`;
    this.chart = new Chart(this.giftsChart.nativeElement, {
      type: 'polarArea',
      data: {
        labels: giftsData.map(guest => guest.fullName),
        datasets: [
          {
            label: config.label,
            data: giftsData.map(guest => guest.total),
            backgroundColor: giftsData.map((_, index) => this.getBackgroundColor(index)),
            borderColor: giftsData.map((_, index) => this.getBorderColor(index)),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.label,
          },
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label: context => {
                const guest = giftsData[context.dataIndex];
                return `${guest.fullName}: ${guest.total} gifts`;
              },
              afterBody: context => {
                const guest = giftsData[context[0].dataIndex];
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

  // Returns the background color for a chart section.
  private getBackgroundColor(index: number): string {
    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(255, 159, 64, 0.5)',
      'rgba(255, 205, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(153, 102, 255, 0.5)',
      'rgba(201, 203, 207, 0.5)',
    ];
    return colors[index % colors.length];
  }

  // Returns the border color for a chart section.
  private getBorderColor(index: number): string {
    const colors = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'];
    return colors[index % colors.length];
  }

  // Builds the common tooltip information for both charts.
  private getTooltipLines(guest: IGiftGuest): string[] {
    return [
      `Total gifts: ${guest.total}`,
      `Group: ${this.formatGroupType(guest.groupType)}`,
      `Country: ${guest.hometownCode}`,
      `Visited: ${this.formatDate(guest.visitedDate)}`,
      '',
      'Gifts received:',
      ...guest.gifts.map(gift => `• ${gift}`),
    ];
  }

  // Formats group type for display.
  private formatGroupType(groupType: string): string {
    if (!groupType) {
      return 'Unknown';
    }
    return groupType.charAt(0).toUpperCase() + groupType.slice(1);
  }

  // Formats a date for tooltip display.
  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Destroys the current Chart.js instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
