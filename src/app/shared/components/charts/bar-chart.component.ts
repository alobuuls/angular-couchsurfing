import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js/auto';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartBarSeries } from '@type/chart.types';

@Component({
  selector: 'bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class BarChartComponent extends BaseChartDirective {
  @Input() horizontal = true;

  // Several datasets. When provided, `values`, `datasetLabel` and `colors` are ignored.
  @Input() series?: IChartBarSeries[];

  // Stacks the datasets on the same bar.
  @Input() stacked = false;

  // Category axis (y when horizontal, x when vertical).
  @Input() categoryAxisTitle = '';

  // Value axis (x when horizontal, y when vertical).
  @Input() valueAxisTitle = '';
  @Input() valueMin?: number;
  @Input() valueMax?: number;
  @Input() valueStep?: number;
  @Input() valuePrecision?: number;
  @Input() valueTickFormatter?: (value: number | string) => string | number;

  protected buildConfig(): ChartConfiguration<'bar'> {
    const formatter = this.valueTickFormatter;

    const valueAxis = {
      beginAtZero: true,
      stacked: this.stacked,
      min: this.valueMin,
      max: this.valueMax,
      title: { display: !!this.valueAxisTitle, text: this.valueAxisTitle },
      ticks: {
        ...(this.valueStep !== undefined ? { stepSize: this.valueStep } : {}),
        ...(this.valuePrecision !== undefined ? { precision: this.valuePrecision } : {}),
        ...(formatter ? { callback: (value: number | string) => formatter(value) } : {}),
      },
    };

    const categoryAxis = {
      stacked: this.stacked,
      title: { display: !!this.categoryAxisTitle, text: this.categoryAxisTitle },
      // With a fixed height every row has room, so show all the labels.
      ticks: { autoSkip: !this.height },
    };

    const series: IChartBarSeries[] = this.series ?? [{ label: this.datasetLabel, values: this.values, colors: this.colors }];

    return {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: series.map(item => ({
          label: item.label,
          data: item.values,
          backgroundColor: item.colors?.background,
          borderColor: item.colors?.border,
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio && !this.height,
        indexAxis: this.horizontal ? 'y' : 'x',
        onClick: this.handleClick,
        plugins: {
          title: this.titleOptions,
          legend: { display: this.showLegend, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
        scales: this.horizontal ? { x: valueAxis, y: { beginAtZero: true, ...categoryAxis } } : { x: categoryAxis, y: valueAxis },
      },
    };
  }
}
