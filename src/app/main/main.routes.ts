import { Routes } from '@angular/router';

// Main
import { MainLayoutComponent } from '@main/main-layout.component';

export const mainRoutes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'home',
        loadChildren: () => import('@pages/home/home.module').then(m => m.HomeModule),
      },
      {
        path: 'guests',
        loadChildren: () => import('@pages/guests/guests.module').then(m => m.GuestsModule),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
    ],
  },
];
