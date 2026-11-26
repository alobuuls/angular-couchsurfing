import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import Chart, { ChartConfiguration, LinearScale, PointElement } from 'chart.js/auto';
import { ForceDirectedGraphController, EdgeLine } from 'chartjs-chart-graph';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartEdge, IChartNetworkColors } from '@type/chart.types';

// Register the network graph.
Chart.register(ForceDirectedGraphController, EdgeLine, LinearScale, PointElement);

@Component({
  selector: 'network-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class NetworkChartComponent extends BaseChartDirective {
  // One node per label. Edges reference nodes by their index.
  @Input() edges: IChartEdge[] = [];
  @Input() nodeColors?: IChartNetworkColors;
  @Input() pointRadius = 8;

  protected buildConfig(): ChartConfiguration<'forceDirectedGraph'> {
    return {
      type: 'forceDirectedGraph',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.labels.map(() => ({})),
            edges: this.edges,
            pointRadius: this.pointRadius,
            pointHoverRadius: this.pointRadius + 2,
            pointBackgroundColor: this.nodeColors?.background,
            pointBorderColor: this.nodeColors?.border,
            borderColor: this.nodeColors?.edges,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio,
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          // Shown only when a custom legend is provided.
          legend: { display: !!this.legend, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
      },
    };
  }
}
