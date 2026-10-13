import { Component, ElementRef, HostListener, inject } from '@angular/core';

/* Services */
import { ThemePalette, ThemeService } from '@services/theme.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent {
  private readonly _theme = inject(ThemeService);
  private readonly _elementRef = inject(ElementRef);

  showThemeSelection: boolean = false;

  // Selects a color palette.
  selectPalette(palette: ThemePalette): void {
    this._theme.setPalette(palette);
    this.showThemeSelection = false;
  }

  // Returns the currently selected palette.
  get currentPalette(): ThemePalette {
    return this._theme.palette;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this._elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showThemeSelection) this.showThemeSelection = false;
  }

  toggleThemeSelection(): void {
    this.showThemeSelection = !this.showThemeSelection;
  }

  // Toggles between light and dark themes.
  toggleTheme(): void {
    const newTheme = this._theme.theme === 'light' ? 'dark' : 'light';
    this._theme.setTheme(newTheme);
  }

  // Returns the icon for the next available theme.
  get themeIcon(): string {
    return this._theme.theme === 'light' ? 'dark_mode' : 'light_mode';
  }

  // Returns the label for the theme button.
  get themeLabel(): string {
    return this._theme.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  }
}
