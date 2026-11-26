import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import Chart from 'chart.js/auto';

import { ThemeService } from '@core/services/theme.service';
import { getChartTheme } from '@utils';

@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly _theme = inject(ThemeService);

  // Emits AFTER the defaults are updated, so charts can safely re-render.
  private readonly appliedSubject = new Subject<void>();
  readonly applied$ = this.appliedSubject.asObservable();

  constructor() {
    this.apply();
    this._theme.themeChanges$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.apply();
      this.appliedSubject.next();
    });
  }

  private apply(): void {
    const theme = getChartTheme(this._theme.theme);
    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;
  }
}
