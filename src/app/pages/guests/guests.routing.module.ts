import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { GuestsComponent } from '@pages/guests/guests.component';
import { GuestsCreateComponent } from '@pages/guests/create/guests-create.component';
import { GuestsDetailComponent } from '@pages/guests/detail/guests-detail.component';
import { GuestsEditComponent } from '@pages/guests/edit/guests-edit.component';
import { GuestsStatsComponent } from '@pages/guests/stats/guests-stats.component';

const guestsRoutes: Routes = [
  {
    path: '',
    component: GuestsComponent,
  },
  {
    path: 'add',
    component: GuestsCreateComponent,
  },
  {
    path: 'stats',
    component: GuestsStatsComponent,
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
