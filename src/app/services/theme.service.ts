import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
export type ThemePalette = 'coastal' | 'ocean' | 'pink' | 'lavender';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Notifies components when the theme changes.
  private readonly themeSubject = new BehaviorSubject<ThemeMode>('light');
  readonly themeChanges$ = this.themeSubject.asObservable();

  private readonly themeKey = 'theme';
  private readonly paletteKey = 'themePalette';

  private currentTheme: ThemeMode = 'light';
  private currentPalette: ThemePalette = 'ocean';

  private systemThemeQuery?: MediaQueryList;

  // Detects system theme changes while automatic mode is active.
  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    this.applyTheme(event.matches ? 'dark' : 'light');
  };

  // Initializes the theme and palette.
  initTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey);
    const savedPalette = localStorage.getItem(this.paletteKey);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      // Respect the user's saved preference.
      this.applyTheme(savedTheme);
    } else {
      // No manual preference: follow the system.
      this.applySystemTheme();
    }

    // Restore the saved palette.
    if (savedPalette === 'coastal' || savedPalette === 'ocean' || savedPalette === 'pink' || savedPalette === 'lavender') {
      this.setPalette(savedPalette);
    } else {
      this.setPalette('ocean');
    }
  }

  // Applies a theme and notifies subscribers.
  private applyTheme(theme: ThemeMode): void {
    this.currentTheme = theme;

    document.documentElement.classList.toggle('dark-theme', theme === 'dark');

    this.themeSubject.next(theme);
  }

  // Follows the system until the user chooses a theme manually.
  private applySystemTheme(): void {
    this.stopListeningToSystemTheme();

    this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Apply the current system preference immediately.
    this.applyTheme(this.systemThemeQuery.matches ? 'dark' : 'light');

    // Listen for future system changes.
    this.systemThemeQuery.addEventListener('change', this.onSystemThemeChange);
  }

  // Stops following the system after a manual selection.
  private stopListeningToSystemTheme(): void {
    this.systemThemeQuery?.removeEventListener('change', this.onSystemThemeChange);

    this.systemThemeQuery = undefined;
  }

  // Applies and saves the user's manual choice.
  setTheme(theme: ThemeMode): void {
    this.stopListeningToSystemTheme();

    this.applyTheme(theme);
    localStorage.setItem(this.themeKey, theme);
  }

  // Returns the current mode.
  get theme(): ThemeMode {
    return this.currentTheme;
  }

  // Applies the selected color palette.
  setPalette(palette: ThemePalette): void {
    this.currentPalette = palette;

    const root = document.documentElement;

    root.classList.remove('theme-coastal', 'theme-pink', 'theme-lavender');

    if (palette !== 'ocean') {
      root.classList.add(`theme-${palette}`);
    }

    localStorage.setItem(this.paletteKey, palette);
  }

  // Returns the current palette.
  get palette(): ThemePalette {
    return this.currentPalette;
  }
}
