import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/* Services */
import { ThemePalette, ThemeService } from '@services/theme.service';
import { LanguageService } from '@services/language.service';
import { Language } from '@type/word.types';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  private readonly _theme = inject(ThemeService);
  private readonly _language = inject(LanguageService);
  private readonly _elementRef = inject(ElementRef);

  btnsLang: { selectedLang: Language; flag: string; translationKey: string }[] = [
    { selectedLang: 'en', flag: 'us', translationKey: 'LANGUAGES.EN' },
    { selectedLang: 'es', flag: 'es', translationKey: 'LANGUAGES.ES' },
    { selectedLang: 'de', flag: 'de', translationKey: 'LANGUAGES.DE' },
    { selectedLang: 'zh', flag: 'cn', translationKey: 'LANGUAGES.ZH' },
    { selectedLang: 'fr', flag: 'fr', translationKey: 'LANGUAGES.FR' },
    { selectedLang: 'it', flag: 'it', translationKey: 'LANGUAGES.IT' },
    { selectedLang: 'pt', flag: 'pt', translationKey: 'LANGUAGES.PT' },
    { selectedLang: 'ru', flag: 'ru', translationKey: 'LANGUAGES.RU' },
    { selectedLang: 'ja', flag: 'jp', translationKey: 'LANGUAGES.JA' },
  ];

  showThemeSelection = false;
  showLanguageSelection = false;

  selectPalette(palette: ThemePalette): void {
    this._theme.setPalette(palette);
    this.showThemeSelection = false;
  }

  get currentPalette(): ThemePalette {
    return this._theme.palette;
  }

  selectLanguage(language: Language): void {
    this._language.setLanguage(language);
    this.showLanguageSelection = false;
  }

  get currentLanguage(): Language {
    return this._language.currentLanguage;
  }

  toggleLanguageSelection(): void {
    this.showLanguageSelection = !this.showLanguageSelection;
    this.showThemeSelection = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this._elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.showThemeSelection = false;
      this.showLanguageSelection = false;
    }
  }

  toggleThemeSelection(): void {
    this.showThemeSelection = !this.showThemeSelection;
  }

  toggleTheme(): void {
    const newTheme = this._theme.theme === 'light' ? 'dark' : 'light';
    this._theme.setTheme(newTheme);
  }

  get themeIcon(): string {
    return this._theme.theme === 'light' ? 'dark_mode' : 'light_mode';
  }

  get themeLabel(): string {
    return this._theme.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  }
}
