import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';

import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeDe from '@angular/common/locales/de';
import localeZh from '@angular/common/locales/zh';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localePt from '@angular/common/locales/pt';
import localeRu from '@angular/common/locales/ru';
import localeJa from '@angular/common/locales/ja';
import localeHi from '@angular/common/locales/hi';
import localeKo from '@angular/common/locales/ko';
import localeHe from '@angular/common/locales/he';
// Modules
import { CoreModule } from '@core/core.module';
import { SharedModule } from '@shared/shared.module';
import { AppRoutingModule } from './app.routing.module';
import { MatNativeDateModule } from '@angular/material/core';

// Components
import { AppComponent } from './app.component';
import { NotFoundComponent } from '@pages/404/not-found.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PaginatorIntlService } from '@shared/services/paginator-intl.service';
import { MatPaginatorIntl } from '@angular/material/paginator';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeEs, 'es-ES');
registerLocaleData(localeDe, 'de-DE');
registerLocaleData(localeZh, 'zh-CN');
registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeIt, 'it-IT');
registerLocaleData(localePt, 'pt-PT');
registerLocaleData(localeRu, 'ru-RU');
registerLocaleData(localeJa, 'ja-JP');
registerLocaleData(localeHi, 'hi-IN');
registerLocaleData(localeKo, 'ko-KR');
registerLocaleData(localeHe, 'he-IL');

@NgModule({
  declarations: [AppComponent, NotFoundComponent],
  imports: [
    BrowserModule,
    CoreModule,
    SharedModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatNativeDateModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: PaginatorIntlService,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
