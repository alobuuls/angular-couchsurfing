import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// Modules
import { SharedModule } from '@shared/shared.module';

// Interceptors
import { NormalizeResponseInterceptor } from '@interceptors/api-resp-map.interceptor';

// Components
import { MenuComponent } from '@core/menu/menu.component';
import { AppRoutingModule } from "src/app/app.routing.module";

@NgModule({
  declarations: [MenuComponent],
  imports: [SharedModule, HttpClientModule, AppRoutingModule],
  exports: [MenuComponent],
  providers: [
    {
      useClass: NormalizeResponseInterceptor,
      multi: true,
      provide: HTTP_INTERCEPTORS,
    },
  ],
})
export class CoreModule {}
