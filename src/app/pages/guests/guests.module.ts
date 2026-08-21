import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { GuestsRoutingModule } from '@pages/guests/guests.routing.module';

// Components
import { GuestsComponent } from '@pages/guests/guests.component';
import { GuestsCreateComponent } from '@pages/guests/create/guests-create.component';
import { GuestsEditComponent } from '@pages/guests/edit/guests-edit.component';
import { GuestsDetailComponent } from '@pages/guests/detail/guests-detail.component';
import { GuestFormComponent } from '@pages/guests/form/guest-form/guest-form.component';
import { TripFormComponent } from '@pages/guests/form/trip-form/trip-form.component';
import { GuestsFormComponent } from '@pages/guests/form/guests-form/guests-form.component';
import { GuestsTableComponent } from '@pages/guests/table/guests-table.component';
import { GuestsCardsComponent } from '@pages/guests/cards/guests-cards.component';

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
    GuestsCardsComponent
  ],
  imports: [SharedModule, GuestsRoutingModule],
})
export class GuestsModule {}
