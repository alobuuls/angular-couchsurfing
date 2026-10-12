import { Component, inject } from '@angular/core';

/* Services */
import { ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly _theme = inject(ThemeService);

  constructor() {
    this._theme.initTheme();
  }
}
