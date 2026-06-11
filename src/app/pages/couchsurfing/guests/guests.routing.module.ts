import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { GuestsComponent } from '@pages/couchsurfing/guests/guests.component';

const guestsRoutes: Routes = [
  {
    path: 'guests',
    component: GuestsComponent,
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
