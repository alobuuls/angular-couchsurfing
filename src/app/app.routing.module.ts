import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from '@pages/404/not-found.component';

// Routes
export const globalRoutes: Routes = [
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '',
    loadChildren: () => import('@main/main.module').then(m => m.MainModule),
  },
  {
    path: '**',
    redirectTo: '404',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(globalRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
