import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';

/* Services */
import { ThemePalette, ThemeService } from '@services/theme.service';
import { LanguageService } from '@services/language.service';

// Interfaces
import { Language } from '@type/word.types';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  private readonly _theme = inject(ThemeService);
  private readonly _language = inject(LanguageService);
  private readonly ctnPaletteTheme = inject(ElementRef);

  showThemeSelection: boolean = false;
  showLanguageSelection: boolean = false;

  btnsLang: { selectedLang: Language; flag: string; txt: string }[] = [
    { selectedLang: 'es', flag: 'es', txt: 'Español' },
    { selectedLang: 'en', flag: 'us', txt: 'English' },
    { selectedLang: 'fr', flag: 'fr', txt: 'Français' },
    { selectedLang: 'it', flag: 'it', txt: 'Italiano' },
    { selectedLang: 'pt', flag: 'pt', txt: 'Português' },
    { selectedLang: 'de', flag: 'de', txt: 'Deutsch' },
    { selectedLang: 'ru', flag: 'ru', txt: 'Русский' },
    { selectedLang: 'zh', flag: 'cn', txt: '中文' },
    { selectedLang: 'ja', flag: 'jp', txt: '日本語' },
    { selectedLang: 'hi', flag: 'in', txt: 'हिन्दी' },
    { selectedLang: 'ko', flag: 'kr', txt: '한국어' },
    { selectedLang: 'he', flag: 'il', txt: 'עברית' },
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.ctnPaletteTheme.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.showThemeSelection = false;
      this.showLanguageSelection = false;
    }
  }
  get currentPalette(): ThemePalette {
    return this._theme.palette;
  }
  get currentLanguage(): Language {
    return this._language.currentLanguage;
  }

  get themeIcon(): string {
    return this._theme.theme === 'light' ? 'dark_mode' : 'light_mode';
  }

  get themeLabel(): string {
    return this._theme.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  }

  ngOnInit(): void {
    this._language.initLanguage();
  }

  selectPalette(palette: ThemePalette): void {
    this._theme.setPalette(palette);
    this.showThemeSelection = false;
  }

  selectLanguage(language: Language): void {
    this._language.setLanguage(language);
    this.showLanguageSelection = false;
  }

  toggleLanguageSelection(): void {
    this.showLanguageSelection = !this.showLanguageSelection;
    this.showThemeSelection = false;
  }

  toggleThemeSelection(): void {
    this.showThemeSelection = !this.showThemeSelection;
  }

  toggleTheme(): void {
    const newTheme = this._theme.theme === 'light' ? 'dark' : 'light';
    this._theme.setTheme(newTheme);
  }
}
