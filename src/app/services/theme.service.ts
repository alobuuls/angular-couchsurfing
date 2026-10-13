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
  private currentPalette: ThemePalette = 'coastal';

  // Initializes the theme and palette.
  initTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey) as ThemeMode | null;
    const savedPalette = localStorage.getItem(this.paletteKey) as ThemePalette | null;

    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.setTheme(savedTheme);
    } else {
      this.applySystemTheme();
    }

    if (savedPalette === 'coastal' || savedPalette === 'ocean' || savedPalette === 'pink' || savedPalette === 'lavender') {
      this.setPalette(savedPalette);
    }
  }

  // Applies the selected light or dark mode.
  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem(this.themeKey, theme);
    this.themeSubject.next(theme);
  }

  // Returns the current mode.
  get theme(): ThemeMode {
    return this.currentTheme;
  }

  // Applies the selected color palette.
  setPalette(palette: ThemePalette): void {
    this.currentPalette = palette;
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-pink', 'theme-lavender');

    if (palette !== 'coastal') {
      root.classList.add(`theme-${palette}`);
    }
    localStorage.setItem(this.paletteKey, palette);
  }

  // Returns the current palette.
  get palette(): ThemePalette {
    return this.currentPalette;
  }

  // Uses the device preference if no mode has been saved.
  private applySystemTheme(): void {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.currentTheme = isDark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark-theme', isDark);
    this.themeSubject.next(this.currentTheme);
  }
}
