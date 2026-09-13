import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

// Services
import { StatsService } from '@services/stats.service';
import { ErrorHandlerService } from '@services/err-handler.service';

// Helpers
import { withReqState } from '../../../utils/operators/with-state-operator';

// Ineterfaces
import { ICurrentChart } from '@interfaces/stats-interface';

@Component({
  selector: 'guests-stats',
  templateUrl: './guests-stats.component.html',
  styleUrls: ['./guests-stats.component.css'],
})
export class GuestsStatsComponent implements OnInit {
  currentChart: ICurrentChart = 'summary';

  private _stats = inject(StatsService);
  private _errHandler = inject(ErrorHandlerService);

  vm$!: Observable<any>;

  ngOnInit(): void {
    this.initVm();
  }

  private initVm(): void {
    this.vm$ = withReqState(this._stats.getGuestsStats(), this._errHandler);
  }

  changeChart(chart: ICurrentChart): void {
    this.currentChart = chart;
  }

  hasCurrentChartData(data: any): boolean {
    const chartData = data?.[this.currentChart];

    return this.hasData(chartData);
  }

  private hasData(data: any): boolean {
    // No data exists
    if (data === null || data === undefined) {
      return false;
    }
    // Arrays: contain information if they have elements
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    // Numbers: consider 0 as not representing data
    if (typeof data === 'number') {
      return data > 0;
    }
    // Strings: contain information if they are not empty
    if (typeof data === 'string') {
      return data.trim().length > 0;
    }
    // Booleans
    if (typeof data === 'boolean') {
      return data;
    }
    // Objects: recursively check their properties
    if (typeof data === 'object') {
      const values = Object.values(data);
      return values.some(value => this.hasData(value));
    }
    return false;
  }
}
