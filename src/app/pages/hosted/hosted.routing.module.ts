import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { HostedComponent } from '@pages/hosted/hosted.component';
import { HostedCreateComponent } from '@pages/hosted/create/hosted-create.component';
import { HostedDetailComponent } from '@pages/hosted/detail/hosted-detail.component';
import { HostedEditComponent } from '@pages/hosted/edit/hosted-edit.component';

const hostedRoutes: Routes = [
  {
    path: '',
    component: HostedComponent,
  },
  {
    path: 'add',
    component: HostedCreateComponent,
  },
  {
    path: 'groups/edit/:groupId',
    component: HostedEditComponent,
  },
  {
    path: 'edit/:hostedId',
    component: HostedEditComponent,
  },
  {
    path: 'groups/:groupId',
    component: HostedDetailComponent,
  },
  {
    path: ':hostedId',
    component: HostedDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(hostedRoutes)],
  exports: [RouterModule],
})
export class HostedRoutingModule {}
