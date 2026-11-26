import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseXyChartDirective } from '@shared/directives/charts/base-xy-chart.directive';
import { IChartBubblePoint } from '@type/chart.types';

@Component({
  selector: 'bubble-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class BubbleChartComponent extends BaseXyChartDirective {
  @Input() points: IChartBubblePoint[] = [];

  protected override hasData(): boolean {
    return this.points.length > 0;
  }

  protected buildConfig(): ChartConfiguration<'bubble'> {
    return {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: this.datasetLabel,
            data: this.points,
            // A one-item array is repeated by Chart.js for every point.
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
        scales: this.scalesOptions,
      },
    };
  }
}
