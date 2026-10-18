import { Injectable, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

// Config
import { LANG, Language } from '@type/word.types';
import { LANGUAGE_LOCALES } from '@config/lang/lang.config';

// Libraries
import { enUS, es, de, zhCN, fr, it, pt, ru, ja, hi, ko, he, Locale } from 'date-fns/locale';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly _translate = inject(TranslateService);
  private readonly _dateAdapter = inject(DateAdapter);
  private readonly _languages: readonly Language[] = LANG;

  get dateFnsLocale(): Locale {
    const locales: Record<Language, Locale> = {
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

    return locales[this.currentLanguage];
  }

  get currentLanguage(): Language {
    const currentLang = this._translate.currentLang;
    return this._languages.includes(currentLang as Language) ? (currentLang as Language) : 'en';
  }

  get currentLocale(): string {
    return LANGUAGE_LOCALES[this.currentLanguage];
  }

  getLocale(language: Language): string {
    return LANGUAGE_LOCALES[language];
  }

  setLanguage(language: Language): void {
    if (!this._languages.includes(language)) return;

    this._dateAdapter.setLocale(this.getLocale(language));
    this._translate.use(language);

    localStorage.setItem('language', language);
  }

  initLanguage(): void {
    this._translate.setDefaultLang('en');

    const savedLanguage = localStorage.getItem('language');
    const browserLanguage = navigator.language.split('-')[0].toLowerCase();
    const language: Language = this._languages.find(lang => lang === savedLanguage) ?? this._languages.find(lang => lang === browserLanguage) ?? 'en';

    this.setLanguage(language);
  }
}
