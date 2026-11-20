import { Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';

@Component({
  selector: 'pie-chart',
  template: `<canvas #canvas></canvas>`,
})
export class PieChartComponent extends BaseChartDirective {
  @Input() variant: 'pie' | 'doughnut' = 'pie';
  @Input() padding = 0;

  protected buildConfig(): ChartConfiguration<'pie' | 'doughnut'> {
    return {
      type: this.variant,
      data: {
        labels: this.labels,
        datasets: [
          {
            label: this.datasetLabel,
            data: this.values,
            backgroundColor: this.colors?.background,
            borderColor: this.colors?.border,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio,
        layout: { padding: this.padding },
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          legend: { display: true, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
      },
    };
  }
}
