import { Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartColors } from '@type/chart.types';

@Component({
  selector: 'radar-chart',
  template: `<canvas #canvas></canvas>`,
})
export class RadarChartComponent extends BaseChartDirective {
  @Input() min = 0;
  @Input() max?: number;
  @Input() step?: number;
  @Input() pointColors?: IChartColors;
  @Input() pointRadius = 8;
  @Input() pointHoverRadius = 10;

  protected buildConfig(): ChartConfiguration<'radar'> {
    return {
      type: 'radar',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.datasetLabel,
            data: this.values,
            backgroundColor: this.colors?.background[0],
            borderColor: this.colors?.border[0],
            borderWidth: 1,
            pointBackgroundColor: this.pointColors?.background,
            pointBorderColor: this.pointColors?.border,
            pointRadius: this.pointRadius,
            pointHoverRadius: this.pointHoverRadius,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio,
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          legend: { display: this.showLegend, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
        scales: {
          r: {
            min: this.min,
            max: this.max,
            ticks: { precision: 0, ...(this.step ? { stepSize: this.step } : {}) },
          },
        },
      },
    };
  }
}
