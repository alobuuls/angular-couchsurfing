import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';

@Component({
  selector: 'polar-area-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class PolarAreaChartComponent extends BaseChartDirective {
  protected buildConfig(): ChartConfiguration<'polarArea'> {
    return {
      type: 'polarArea',
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
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          legend: { display: true, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
        scales: {
          r: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    };
  }
}
