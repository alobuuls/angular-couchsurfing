import { Routes } from '@angular/router';

// Components
import { NotFoundComponent } from '@pages/404/not-found.component';

export const globalRoutes: Routes = [
  {
    path: 'couchsurfing',
    loadChildren: () => import('@pages/couchsurfing/guests/guests.module').then(m => m.GuestsModule),
  },

  {
    path: '404',
    component: NotFoundComponent,
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'couchsurfing',
  },

  {
    path: '**',
    redirectTo: '404',
  },
];
