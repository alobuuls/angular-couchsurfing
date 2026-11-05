import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Routes
import { mainRoutes } from '@main/main.routes';

@NgModule({
  imports: [RouterModule.forChild(mainRoutes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
