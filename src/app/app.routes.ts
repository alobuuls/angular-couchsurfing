import { Routes } from '@angular/router';
import { NotFoundComponent } from '@pages/404/not-found.component';

export const globalRoutes: Routes = [
  {
    path: 'guests',
    loadChildren: () => import('@pages/guests/guests.module').then(m => m.GuestsModule),
  },

  {
    path: 'hosted',
    loadChildren: () => import('@pages/hosted/hosted.module').then(m => m.HostedModule),
  },

  {
    path: '404',
    component: NotFoundComponent,
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'guests',
  },

  {
    path: '**',
    redirectTo: '404',
  },
];
