import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { HostedRoutingModule } from '@pages/hosted/hosted.routing.module';

// Components
import { HostedComponent } from '@pages/hosted/hosted.component';
import { HostedCreateComponent } from '@pages/hosted/create/hosted-create.component';
import { HostedEditComponent } from '@pages/hosted/edit/hosted-edit.component';
import { HostedDetailComponent } from '@pages/hosted/detail/hosted-detail.component';
import { HostedFormComponent } from '@pages/hosted/form/hosted-form/hosted-form.component';
import { HostedTripFormComponent } from '@pages/hosted/form/trip-form/hosted-trip-form.component';
import { HostedIndividualFormComponent } from '@pages/hosted/form/hosted-individual/hosted-individual-form.component';
import { HostedTableComponent } from '@pages/hosted/table/hosted-table.component';

@NgModule({
  declarations: [
    HostedComponent,
    HostedCreateComponent,
    HostedEditComponent,
    HostedDetailComponent,
    HostedFormComponent,
    HostedTripFormComponent,
    HostedIndividualFormComponent,
    HostedTableComponent,
  ],
  imports: [SharedModule, HostedRoutingModule],
})
export class HostedModule {}
