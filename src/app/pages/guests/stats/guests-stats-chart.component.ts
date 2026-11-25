import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

// Store
import { GuestsStatsStore } from '@pages/guests/stats/guests-stats.store';

// Interfaces
import { ICurrentChart, IGuestsStats } from '@interfaces/stats-interface';

// Selectores para los gráficos cuya señal de "hay datos" no es el objeto completo.
const RELEVANT_DATA: { [K in ICurrentChart]?: (stats: IGuestsStats) => unknown } = {
  demographics: stats => stats.demographics.totals,
};

@Component({
  selector: 'guests-stats-chart',
  templateUrl: './guests-stats-chart.component.html',
  styleUrls: ['./guests-stats-chart.component.css'],
})
export class GuestsStatsChartComponent {
  private _route = inject(ActivatedRoute);
  private _store = inject(GuestsStatsStore);

  // The chart comes from the route data and its data from the shared store.
  readonly vm$ = combineLatest([this._route.data, this._store.vm$]).pipe(
    map(([routeData, state]) => {
      if (state.status !== 'success') return null;
      const chart = routeData['chart'] as ICurrentChart;
      const relevant = RELEVANT_DATA[chart]?.(state.data) ?? state.data[chart];
      return { chart, stats: state.data, hasData: this.hasData(relevant) };
    })
  );

  private hasData(data: unknown): boolean {
    if (data === null || data === undefined) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'number') return data > 0;
    if (typeof data === 'string') return data.trim().length > 0;
    if (typeof data === 'boolean') return data;
    if (typeof data === 'object') return Object.values(data).some(value => this.hasData(value));
    return false;
  }
}
