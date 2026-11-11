import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';

/* Services */
import { ThemePalette, ThemeService } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';

/* Interfaces */
import { Language } from '@type/word.types';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  // Navigation
  showNabBar = false;

  // Independent dropdown selectors
  showThemeSelection = false;
  showLanguageSelection = false;

  // Available languages
  readonly btnsLang: {
    selectedLang: Language;
    flag: string;
    txt: string;
  }[] = [
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

  // Scroll navigation
  isHeaderVisible = true;
  private lastScrollPosition = 0;
  private readonly scrollThreshold = 8;

  // ==========================================
  // SCROLL NAVIGATION
  // ==========================================

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollPosition = window.scrollY || document.documentElement.scrollTop;

    // Siempre mostrar el header al llegar arriba
    if (currentScrollPosition <= 0) {
      this.isHeaderVisible = true;
      this.lastScrollPosition = 0;
      return;
    }

    // No ocultar el header mientras el menú lateral esté abierto
    if (this.showNabBar) {
      this.lastScrollPosition = currentScrollPosition;
      return;
    }

    const difference = currentScrollPosition - this.lastScrollPosition;

    // Ignorar movimientos pequeños
    if (Math.abs(difference) < this.scrollThreshold) {
      return;
    }

    if (difference > 0) {
      // Scroll hacia abajo
      this.isHeaderVisible = false;
      this.closeSelectors();
    } else {
      // Scroll hacia arriba
      this.isHeaderVisible = true;
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  // Services
  private readonly _theme = inject(ThemeService);
  private readonly _language = inject(LanguageService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    this._language.initLanguage();
  }

  // ==========================================
  // CURRENT SETTINGS
  // ==========================================

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

  // ==========================================
  // NAVIGATION
  // ==========================================

  toogleNavBar(): void {
    this.showNabBar = !this.showNabBar;

    if (!this.showNabBar) {
      this.closeSelectors();
    }
  }

  // ==========================================
  // DARK / LIGHT THEME
  // ==========================================

  toggleTheme(): void {
    const newTheme = this._theme.theme === 'light' ? 'dark' : 'light';

    this._theme.setTheme(newTheme);
  }

  // ==========================================
  // COLOR PALETTE SELECTOR
  // ==========================================

  toggleThemeSelection(): void {
    this.showThemeSelection = !this.showThemeSelection;
    this.showLanguageSelection = false;
  }

  selectPalette(palette: ThemePalette): void {
    this._theme.setPalette(palette);
    this.showThemeSelection = false;
  }

  // ==========================================
  // LANGUAGE SELECTOR
  // ==========================================

  toggleLanguageSelection(): void {
    this.showLanguageSelection = !this.showLanguageSelection;
    this.showThemeSelection = false;
  }

  selectLanguage(language: Language): void {
    this._language.setLanguage(language);
    this.showLanguageSelection = false;
  }

  // ==========================================
  // CLOSE DROPDOWNS
  // ==========================================

  private closeSelectors(): void {
    this.showThemeSelection = false;
    this.showLanguageSelection = false;
  }

  // Click outside the component
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeSelectors();
    }
  }

  // Close everything with Escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSelectors();
    this.showNabBar = false;
  }
}
