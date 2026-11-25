import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { GuestsComponent } from '@pages/guests/guests.component';
import { GuestsCreateComponent } from '@pages/guests/create/guests-create.component';
import { GuestsDetailComponent } from '@pages/guests/detail/guests-detail.component';
import { GuestsEditComponent } from '@pages/guests/edit/guests-edit.component';
import { GuestsStatsComponent } from '@pages/guests/stats/guests-stats.component';
import { pendingChangesFormGuard } from '@core/guards/pending-changes-form.guard';
import { GuestsStatsChartComponent } from '@pages/guests/stats/guests-stats-chart.component';
import { STATS_NAV } from '@pages/guests/stats/guests-stats.config';

const guestsRoutes: Routes = [
  {
    path: '',
    component: GuestsComponent,
  },
  {
    path: 'add',
    component: GuestsCreateComponent,
    canDeactivate: [pendingChangesFormGuard],
  },
  {
    path: 'stats',
    component: GuestsStatsComponent,
    children: [
      // /guests/stats → /guests/stats/summary
      { path: '', pathMatch: 'full', redirectTo: STATS_NAV[0].chart },

      // One subroute per button.
      ...STATS_NAV.map(({ chart }) => ({
        path: chart,
        component: GuestsStatsChartComponent,
        data: { chart },
      })),

      // Invalid chart → first chart.
      { path: '**', redirectTo: STATS_NAV[0].chart },
    ],
  },
  {
    path: 'groups/:groupId/edit',
    component: GuestsEditComponent,
  },
  {
    path: 'groups/:groupId',
    component: GuestsDetailComponent,
  },
  {
    path: ':guestId/edit',
    component: GuestsEditComponent,
  },
  {
    path: ':guestId',
    component: GuestsDetailComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forChild(guestsRoutes)],
  exports: [RouterModule],
})
export class GuestsRoutingModule {}
