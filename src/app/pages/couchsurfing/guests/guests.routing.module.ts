import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { GuestsComponent } from '@pages/couchsurfing/guests/guests.component';
import { GuestsCreateComponent } from '@pages/couchsurfing/guests/create/guests-create.component';
import { GuestsDetailComponent } from '@pages/couchsurfing/guests/detail/guests-detail.component';
import { GuestsEditComponent } from '@pages/couchsurfing/guests/edit/guests-edit.component';

const guestsRoutes: Routes = [
  {
    path: 'guests',
    component: GuestsComponent,
  },
  {
    path: 'guests/add',
    component: GuestsCreateComponent,
  },
  {
    path: 'guests/edit/:guestId',
    component: GuestsEditComponent,
  },
  {
    path: 'groups/edit/:groupId',
    component: GuestsEditComponent,
  },
  {
    path: 'guests/:guestId',
    component: GuestsDetailComponent,
  },
  {
    path: 'groups/:groupId',
    component: GuestsDetailComponent,
  },
  {
    path: '**',
    redirectTo: 'guests',
  },
  {
    path: '',
    redirectTo: 'guests',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(guestsRoutes)],
  exports: [RouterModule],
})
export class GuestsRoutingModule {}
