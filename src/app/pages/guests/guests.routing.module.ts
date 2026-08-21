import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { GuestsComponent } from '@pages/guests/guests.component';
import { GuestsCreateComponent } from '@pages/guests/create/guests-create.component';
import { GuestsDetailComponent } from '@pages/guests/detail/guests-detail.component';
import { GuestsEditComponent } from '@pages/guests/edit/guests-edit.component';
import { GuestsCardsComponent } from '@pages/guests/cards/guests-cards.component';

const guestsRoutes: Routes = [
  {
    path: '',
    component: GuestsComponent,
  },
  {
    path: 'cards',
    component: GuestsCardsComponent,
  },
  {
    path: 'add',
    component: GuestsCreateComponent,
  },
  {
    path: 'groups/edit/:groupId',
    component: GuestsEditComponent,
  },
  {
    path: 'edit/:guestId',
    component: GuestsEditComponent,
  },
  {
    path: 'groups/:groupId',
    component: GuestsDetailComponent,
  },
  {
    path: ':guestId',
    component: GuestsDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(guestsRoutes)],
  exports: [RouterModule],
})
export class GuestsRoutingModule {}
