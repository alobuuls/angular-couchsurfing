import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration, ScatterDataPoint } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import type { Locale } from 'date-fns';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartPoint, IChartScatterSeries } from '@type/chart.types';

@Component({
  selector: 'scatter-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
})
export class ScatterChartComponent extends BaseChartDirective {
  // Single dataset. Ignored when `series` is provided.
  @Input() points: IChartPoint[] = [];

  // Several datasets (e.g. one per row, joined by a line).
  @Input() series?: IChartScatterSeries[];

  @Input() xType: 'linear' | 'time' = 'linear';
  @Input() yType: 'linear' | 'category' = 'category';

  // Category labels for the Y axis. If empty, they are taken from the points.
  @Input() yLabels: string[] = [];

  // date-fns locale for the time axis.
  @Input() dateLocale?: Locale;

  @Input() xMin?: number;
  @Input() xMax?: number;
  @Input() yMin?: number;
  @Input() yMax?: number;
  @Input() xTitle = '';
  @Input() yTitle = '';
  @Input() pointRadius = 20;
  @Input() pointHoverRadius = 10;
  @Input() xTickFormatter: (value: number | string) => string = value => String(value);

  private get datasets(): IChartScatterSeries[] {
    return this.series ?? [{ label: this.datasetLabel || this.title, points: this.points, colors: this.colors }];
  }

  protected override hasData(): boolean {
    return this.datasets.some(dataset => dataset.points.length > 0);
  }

  protected buildConfig(): ChartConfiguration<'scatter'> {
    return {
      type: 'scatter',
      data: {
        datasets: this.datasets.map(dataset => ({
          label: dataset.label,
          data: dataset.points as unknown as ScatterDataPoint[],
          pointRadius: this.pointRadius,
          pointHoverRadius: this.pointHoverRadius,
          pointBackgroundColor: dataset.colors?.background,
          pointBorderColor: dataset.colors?.border,
          showLine: !!dataset.lineColor,
          borderColor: dataset.lineColor,
          borderWidth: dataset.lineColor ? 2 : 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: this.maintainAspectRatio,
        onClick: this.handleClick,
        layout: { padding: { left: 15, right: 15, top: 10, bottom: 10 } },
        plugins: {
          title: this.titleOptions,
          legend: { display: this.showLegend, labels: this.legendLabels },
          tooltip: this.tooltipOptions,
        },
        scales: { x: this.xScale, y: this.yScale },
      },
    };
  }

  private get xScale(): any {
    const title = { display: !!this.xTitle, text: this.xTitle };

    if (this.xType === 'time') {
      return {
        type: 'time',
        min: this.xMin,
        max: this.xMax,
        adapters: { date: { locale: this.dateLocale } },
        title,
      };
    }

    return {
      type: 'linear',
      min: this.xMin,
      max: this.xMax,
      ticks: { callback: (value: number | string) => this.xTickFormatter(value) },
      title,
    };
  }

  private get yScale(): any {
    const title = { display: !!this.yTitle, text: this.yTitle };

    if (this.yType === 'category') {
      const labels = this.yLabels.length ? this.yLabels : [...new Set(this.datasets.flatMap(d => d.points.map(p => String(p.y))))];

      return { type: 'category', labels, offset: true, title };
    }

    return { type: 'linear', min: this.yMin, max: this.yMax, ticks: { precision: 0 }, title };
  }
}
