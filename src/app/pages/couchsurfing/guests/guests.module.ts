import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { GuestsRoutingModule } from '@pages/couchsurfing/guests/guests.routing.module';

// Components
import { GuestsComponent } from '@pages/couchsurfing/guests/guests.component';
import { GuestsTableComponent } from './components/guests-table/guests-table.component';

@NgModule({
  declarations: [GuestsComponent, GuestsTableComponent],
  imports: [SharedModule, GuestsRoutingModule],
})
export class GuestsModule {}
