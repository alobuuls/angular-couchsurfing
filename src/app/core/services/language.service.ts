import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

// Config
import { LANGUAGE_LOCALES } from '@config/lang/lang.config';

// Types
import { LANG, Language } from '@type/word.types';

// External Libraries
import { enUS, es, de, zhCN, fr, it, pt, ru, ja, hi, ko, he, Locale } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<Language, Locale> = {
  en: enUS,
  es,
  de,
  zh: zhCN,
  fr,
  it,
  pt,
  ru,
  ja,
  hi,
  ko,
  he,
};

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly _translate = inject(TranslateService);
  private readonly _dateAdapter = inject(DateAdapter);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _languages: readonly Language[] = LANG;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }

  get dateFnsLocale(): Locale {
    return DATE_FNS_LOCALES[this.currentLanguage];
  }

  get currentLanguage(): Language {
    const language = this._translate.currentLang;
    return this.isLanguage(language) ? language : 'en';
  }

  get currentLocale(): string {
    return LANGUAGE_LOCALES[this.currentLanguage];
  }

  getLocale(language: Language): string {
    return LANGUAGE_LOCALES[language];
  }

  setLanguage(language: Language) {
    if (!this._languages.includes(language)) return;
    this._dateAdapter.setLocale(this.getLocale(language));
    if (this.isBrowser) localStorage.setItem('language', language);
    return this._translate.use(language);
  }

  initLanguage(): void {
    this._translate.setDefaultLang('en');
    const savedLanguage = this.isBrowser ? localStorage.getItem('language') : null;
    const browserLanguage = this.isBrowser ? navigator.language.split('-')[0].toLowerCase() : null;
    const language = this._languages.find(lang => lang === savedLanguage) ?? this._languages.find(lang => lang === browserLanguage) ?? 'en';

    this.setLanguage(language);
  }

  private isLanguage(value: string | null): value is Language {
    return value !== null && this._languages.includes(value as Language);
  }
}
