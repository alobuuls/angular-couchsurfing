import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseXyChartDirective } from '@shared/directives/charts/base-xy-chart.directive';
import { IChartXYPoint } from '@type/chart.types';

@Component({
  selector: 'line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class LineChartComponent extends BaseXyChartDirective {
  @Input() points: IChartXYPoint[] = [];
  @Input() pointRadius = 8;
  @Input() showLine = true;

  protected override hasData(): boolean {
    return this.points.length > 0;
  }

  protected buildConfig(): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: this.datasetLabel,
            data: this.points,
            // The line only accepts a single color, so the first one is used.
            borderColor: this.colors?.border[0],
            backgroundColor: this.colors?.background[0],
            borderWidth: 2,
            pointRadius: this.pointRadius,
            pointHoverRadius: this.pointRadius + 3,
            tension: 0,
            showLine: this.showLine,
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
