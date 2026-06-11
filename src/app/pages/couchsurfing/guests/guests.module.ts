import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { GuestsRoutingModule } from '@pages/couchsurfing/guests/guests.routing.module';

// Components
import { GuestsComponent } from '@pages/couchsurfing/guests/guests.component';
import { GuestsCreateComponent } from '@pages/couchsurfing/guests/create/guests-create.component';
import { GuestsEditComponent } from '@pages/couchsurfing/guests/edit/guests-edit.component';
import { GuestsDetailComponent } from '@pages/couchsurfing/guests/detail/guests-detail.component';

@NgModule({
  declarations: [GuestsComponent, GuestsCreateComponent, GuestsEditComponent, GuestsDetailComponent],
  imports: [SharedModule, GuestsRoutingModule],
})
export class GuestsModule {}
