import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';
import { IChartType, IRatingGroupType, IRatingView } from '@interfaces/stats-interface';
import { IRatingsDistribution } from '@interfaces/stats-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent implements AfterViewInit, OnChanges {
  @Input() distributions!: Record<IRatingView, IRatingsDistribution>;

  @ViewChild('ratingsChart')
  ratingsChart!: ElementRef<HTMLCanvasElement>;

  selectedView: IRatingView = 'overall';
  selectedChart: IChartType = 'bar';
  private chart?: Chart;

  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  private _router = inject(Router);

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['distributions'] && this.ratingsChart) {
      this.createChart();
    }
  }

  selectView(view: IRatingView): void {
    this.selectedView = view;

    this.createChart();
  }

  private createChart(): void {
    if (!this.ratingsChart || !this.distributions) {
      return;
    }

    this.chart?.destroy();

    const ratings = this.distributions[this.selectedView];

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
              'rgba(201, 203, 207, 0.2)',
            ],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
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

  selectChartType(type: IChartType): void {
    this.selectedChart = type;
    this.createChart();
  }
}
