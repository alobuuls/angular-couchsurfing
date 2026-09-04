import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import Chart from 'chart.js/auto';

// Interfaces
import { IChartType, IRatingGroupType, IRatingMainView, IRatingView } from '@interfaces/stats-interface';
import { IRatingsDistribution } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent implements AfterViewInit, OnChanges {
  @Input() distributions!: Record<IRatingView, IRatingsDistribution>;

  @ViewChild('ratingsChart')
  ratingsChart!: ElementRef<HTMLCanvasElement>;

  // Main Rating view.
  selectedMainView: IRatingMainView = 'distribution';

  // Distribution group view.
  selectedView: IRatingView = 'overall';

  selectedChart: IChartType = 'bar';

  private chart?: Chart;

  // Main Rating views.
  readonly ratingMainViews: IRatingMainView[] = ['distribution', 'lowest', 'highest'];

  readonly ratingMainViewLabels: Record<IRatingMainView, string> = {
    distribution: 'Distribution',
    lowest: 'Lowest',
    highest: 'Highest',
  };

  // Distribution group views.
  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  private _router = inject(Router);

  // Initialize chart after the view is ready.
  ngAfterViewInit(): void {
    this.createChart();
  }

  // Recreate chart when the data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['distributions'] && this.ratingsChart) {
      this.createChart();
    }
  }

  // Select the main Rating view.
  selectMainView(view: IRatingMainView): void {
    this.selectedMainView = view;

    // Distribution starts with Overall by default.
    if (view === 'distribution') {
      this.selectedView = 'overall';
    }

    this.createChart();
  }

  // Select a Distribution group.
  selectView(view: IRatingView): void {
    this.selectedView = view;
    this.createChart();
  }

  // Create the chart according to the selected main view.
  private createChart(): void {
    if (!this.ratingsChart || !this.distributions) {
      return;
    }

    this.chart?.destroy();

    // Only Distribution uses the current rating distribution data.
    if (this.selectedMainView !== 'distribution') {
      return;
    }

    const ratings = this.distributions[this.selectedView];

    if (!ratings) {
      return;
    }

    this.chart = new Chart(this.ratingsChart.nativeElement, {
      type: this.selectedChart,

      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐', 'Unrated'],

        datasets: [
          {
            label: 'Guests',
            data: [ratings['1'], ratings['2'], ratings['3'], ratings['4'], ratings['5'], ratings.unrated],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;

          this.handleChartClick(index);
        },
      },
    });
  }

  // Navigate to the guests filtered by rating.
  private handleChartClick(index: number): void {
    if (index > 4) {
      return;
    }
    const rating = index + 1;
    const queryParams: {
      view: 'cards';
      rating: number;
      groupType?: IRatingGroupType;
    } = {
      view: 'cards',
      rating,
    };

    if (this.selectedView !== 'overall') {
      queryParams.groupType = this.selectedView;
    }
    this._router.navigate(['/guests'], {
      queryParams,
    });
  }

  // Change the chart type.
  selectChartType(type: IChartType): void {
    this.selectedChart = type;
    this.createChart();
  }
}
