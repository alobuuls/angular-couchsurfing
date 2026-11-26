import { Component, inject } from '@angular/core';

// Services
import { StatsService } from '@shared/services/stats.service';
import { GuestsStatsStore } from './guests-stats.store';

// Config
import { STATS_NAV } from '@pages/guests/stats/guests-stats.config';

@Component({
  providers: [StatsService, GuestsStatsStore],
  selector: 'guests-stats',
  templateUrl: './guests-stats.component.html',
  styleUrls: ['./guests-stats.component.css'],
})
export class GuestsStatsComponent {
  private _store = inject(GuestsStatsStore);
  readonly navItems = STATS_NAV;
  readonly vm$ = this._store.vm$;
}
