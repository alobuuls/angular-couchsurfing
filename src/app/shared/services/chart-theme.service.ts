// shared/services/chart-theme.service.ts
import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Chart from 'chart.js/auto';

import { ThemeService } from '@core/services/theme.service';
import { getChartTheme } from '@utils';

@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly _theme = inject(ThemeService);

  constructor() {
    this._theme.themeChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.apply());
    this.apply();
  }

  // Chart.js resolves ticks, titles and legend from `defaults.color`,
  // and grids and borders from `defaults.borderColor`.
  private apply(): void {
    const theme = getChartTheme(this._theme.theme);
    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;
    Object.values(Chart.instances).forEach(chart => chart.update('none'));
  }
}
