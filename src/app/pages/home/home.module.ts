import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { HomeRoutingModule } from '@pages/home/home.routing.module';

// Components
import { HomeComponent } from '@pages/home/home.component';

@NgModule({
  declarations: [HomeComponent],
  imports: [SharedModule, HomeRoutingModule],
})
export class HomeModule {}
