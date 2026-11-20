import { Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';

@Component({
  selector: 'dot-plot-chart',
  template: `<canvas #canvas></canvas>`,
})
export class DotPlotChartComponent extends BaseChartDirective {
  @Input() xTitle = '';
  @Input() yTitle = '';
  @Input() yMin = 0;
  @Input() yMax?: number;

  // Ticks above this value are removed from the Y axis.
  @Input() yTickMax?: number;

  @Input() yTickFormatter: (value: number | string) => string = value => String(value);
  @Input() pointRadius = 8;

  protected buildConfig(): ChartConfiguration<'scatter'> {
    return {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this.datasetLabel,
            data: this.values.map((value, index) => ({ x: index, y: value })),
            pointRadius: this.pointRadius,
            pointHoverRadius: this.pointRadius + 3,
            backgroundColor: this.colors?.background,
            borderColor: this.colors?.border,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio,
        onClick: this.handleClick,
        scales: {
          // Items are displayed horizontally.
          x: {
            min: -0.5,
            max: this.labels.length - 0.5,
            ticks: {
              stepSize: 1,
              callback: value => this.labels[Number(value)] ?? '',
              maxRotation: 45,
              minRotation: 45,
            },
            title: { display: !!this.xTitle, text: this.xTitle },
          },
          // Value is displayed vertically.
          y: {
            min: this.yMin,
            max: this.yMax,
            afterBuildTicks: axis => {
              if (this.yTickMax !== undefined) {
                axis.ticks = axis.ticks.filter(tick => Number(tick.value) <= this.yTickMax!);
              }
            },
            ticks: {
              stepSize: 1,
              callback: value => this.yTickFormatter(value),
            },
            title: { display: !!this.yTitle, text: this.yTitle },
          },
        },
        plugins: {
          title: this.titleOptions,
          legend: { display: true, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
      },
    };
  }
}
