import { Directive, Input } from '@angular/core';

import { BaseChartDirective } from '@shared/directives/charts/base-chart.directive';
import { IChartPadding } from '@type/chart.types';

type TTickFormatter = (value: number | string) => string | number;

// Shared axes for charts with two linear axes (bubble, line).
@Directive()
export abstract class BaseXyChartDirective extends BaseChartDirective {
  @Input() xTitle = '';
  @Input() yTitle = '';
  @Input() xMin?: number;
  @Input() xMax?: number;
  @Input() yMin?: number;
  @Input() yMax?: number;
  @Input() xStep = 1;
  @Input() yStep = 1;
  @Input() xTickFormatter?: TTickFormatter;
  @Input() yTickFormatter?: TTickFormatter;
  @Input() padding: number | IChartPadding = 0;

  protected get scalesOptions(): any {
    return {
      x: this.buildAxis(this.xMin, this.xMax, this.xStep, this.xTitle, this.xTickFormatter),
      y: this.buildAxis(this.yMin, this.yMax, this.yStep, this.yTitle, this.yTickFormatter),
    };
  }

  private buildAxis(min: number | undefined, max: number | undefined, step: number, title: string, formatter?: TTickFormatter) {
    return {
      type: 'linear',
      min,
      max,
      ticks: {
        stepSize: step,
        precision: 0,
        ...(formatter ? { callback: (value: number | string) => formatter(value) } : {}),
      },
      title: { display: !!title, text: title },
    };
  }
}
