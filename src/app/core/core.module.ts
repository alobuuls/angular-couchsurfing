import { NgModule, Optional, SkipSelf } from '@angular/core';
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
export class CoreModule {
  // Evita que el módulo se importe más de una vez
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule ya está cargado. Importa solo en AppModule.');
    }
  }
}
