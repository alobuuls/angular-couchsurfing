import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

// Services
import { StatsService } from '@shared/services/stats.service';
import { ErrorHandlerService } from '@core/services/err-handler.service';

// Interfaces
import { DataState } from '@interfaces/data-structure-api';
import { IGuestsStats } from '@interfaces/stats-interface';

// Helpers
import { withReqStateSimple } from '@utils';

@Injectable()
export class GuestsStatsStore {
  private _stats = inject(StatsService);
  private _errHandler = inject(ErrorHandlerService);

  readonly vm$: Observable<DataState<IGuestsStats>> = withReqStateSimple(this._stats.getGuestsStats(), this._errHandler).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
