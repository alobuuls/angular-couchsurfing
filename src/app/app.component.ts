import { Component, inject } from '@angular/core';

import { ThemeService } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  private readonly _theme = inject(ThemeService);
  private readonly _language = inject(LanguageService);

  constructor() {
    this._theme.initTheme();
    this._language.initLanguage();
  }
}
