// stats/charts/stats-chart-container.ts
import { Directive, inject, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

// Shared behavior of the stats containers: the view model is rebuilt
// when an input changes and when the language changes.
@Directive()
export abstract class StatsChartContainer implements OnChanges {
  private readonly _translate = inject(TranslateService);

  constructor() {
    this._translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.buildView());
  }

  ngOnChanges(): void {
    try {
      this.buildView();
    } catch (error) {
      console.error('[buildView]', this.constructor.name, error);
    }

    // Which view models were built (true) and which are empty (false).
    const vms = Object.entries(this)
      .filter(([key]) => /Vm$|^vm$/.test(key))
      .map(([key, value]) => [key, !!value]);
  }

  protected abstract buildView(): void;

  // Replaces the `translate()` helper repeated in several containers.
  protected t(key: string, params?: Record<string, unknown>): string {
    return this._translate.instant(key, params);
  }
}
