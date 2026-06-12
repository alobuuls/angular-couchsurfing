import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

// Modules
import { SharedModule } from '@shared/shared.module';

// Components
import { MenuComponent } from '@core/menu/menu.component';
import { AppRoutingModule } from 'src/app/app.routing.module';

@NgModule({
  declarations: [MenuComponent],
  imports: [SharedModule, HttpClientModule, AppRoutingModule],
  exports: [MenuComponent],
})
export class CoreModule {}
