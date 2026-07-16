import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { GuestsRoutingModule } from '@pages/couchsurfing/guests/guests.routing.module';

// Components
import { GuestsComponent } from '@pages/couchsurfing/guests/guests.component';
import { GuestsCreateComponent } from '@pages/couchsurfing/guests/create/guests-create.component';
import { GuestsEditComponent } from '@pages/couchsurfing/guests/edit/guests-edit.component';
import { GuestsDetailComponent } from '@pages/couchsurfing/guests/detail/guests-detail.component';
import { GuestFormComponent } from '@pages/couchsurfing/guests/form/guest-form/guest-form.component';
import { TripFormComponent } from '@pages/couchsurfing/guests/form/trip-form/trip-form.component';
import { GuestsFormComponent } from '@pages/couchsurfing/guests/form/guests-form/guests-form.component';
import { GuestsTableComponent } from '@pages/couchsurfing/guests/components/guests-table/guests-table.component';

@NgModule({
  declarations: [
    GuestsComponent,
    GuestsCreateComponent,
    GuestsEditComponent,
    GuestsDetailComponent,
    GuestFormComponent,
    TripFormComponent,
    GuestsFormComponent,
    GuestsTableComponent,
  ],
  imports: [SharedModule, GuestsRoutingModule],
})
export class GuestsModule {}
