import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartHeatmapCell, IChartPadding } from '@type/chart.types';

// Register matrix to heatmap.
Chart.register(MatrixController, MatrixElement);

@Component({
  selector: 'heatmap-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class HeatmapChartComponent extends BaseChartDirective {
  // Cells must be sorted: for each x label, all the y labels.
  @Input() cells: IChartHeatmapCell[] = [];
  @Input() xLabels: string[] = [];
  @Input() yLabels: string[] = [];
  @Input() xTitle = '';
  @Input() yTitle = '';
  @Input() padding: number | IChartPadding = 0;
  @Input() cellBorderColor = 'transparent';
  @Input() cellGap = 2;
  // Returns the color of a cell based on its value.
  @Input() cellColor: (value: number) => string = () => 'transparent';

  protected override hasData(): boolean {
    return this.cells.length > 0;
  }

  protected buildConfig(): ChartConfiguration<'matrix'> {
    const gap = this.cellGap;

    // Every row/column needs its label: skipping ticks changes the chart area
    // (and therefore the cell size) depending on the available space.
    const ticks = { autoSkip: false };

    return {
      type: 'matrix',
      data: {
        datasets: [
          {
            label: this.datasetLabel,
            data: this.cells,
            backgroundColor: context => this.cellColor((context.raw as IChartHeatmapCell).v),
            borderColor: this.cellBorderColor,
            borderWidth: 1,
            width: ({ chart }) => {
              const area = chart.chartArea;
              return area ? (area.right - area.left) / this.xLabels.length - gap : 20;
            },
            height: ({ chart }) => {
              const area = chart.chartArea;
              return area ? (area.bottom - area.top) / this.yLabels.length - gap : 20;
            },
          },
        ],
      },
      options: {
        responsive: true,
        // With a fixed height the aspect ratio must not drive the size.
        maintainAspectRatio: this.maintainAspectRatio && !this.height,
        layout: { padding: this.padding },
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          legend: { display: false },
          tooltip: this.tooltipOptions,
        },
        scales: {
          x: {
            type: 'category',
            labels: this.xLabels,
            offset: true,
            grid: { display: false },
            ticks,
            title: { display: !!this.xTitle, text: this.xTitle },
          },
          y: {
            type: 'category',
            labels: this.yLabels,
            reverse: true,
            offset: true,
            grid: { display: false },
            ticks,
            title: { display: !!this.yTitle, text: this.yTitle },
          },
        },
      },
    };
  }
}
