import { Component, inject } from '@angular/core';

import { ThemeService } from '@services/theme.service';
import { LanguageService } from '@services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly _theme = inject(ThemeService);
  private readonly _language = inject(LanguageService);

  constructor() {
    this._theme.initTheme();
    this._language.initLanguage();
  }
}
