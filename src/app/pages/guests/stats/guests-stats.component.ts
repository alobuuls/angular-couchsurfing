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
}
