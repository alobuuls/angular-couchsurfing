import { Injectable, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';
import { LANG, Language } from '@type/word.types';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly _translate = inject(TranslateService);
  private readonly _dateAdapter = inject(DateAdapter);
  private readonly _languages: Language[] = [...LANG];

  get currentLanguage(): Language {
    const currentLang = this._translate.currentLang;
    return this._languages.includes(currentLang as Language) ? (currentLang as Language) : 'en';
  }

  setLanguage(language: Language): void {
    if (!this._languages.includes(language)) return;

    this._dateAdapter.setLocale(this.getDateLocale(language));
    this._translate.use(language);

    localStorage.setItem('language', language);
  }

  initLanguage(): void {
    const savedLanguage = localStorage.getItem('language');
    const language = savedLanguage && this._languages.includes(savedLanguage as Language) ? (savedLanguage as Language) : 'en';

    this._translate.setDefaultLang('en');
    this._translate.use(language);
    this._dateAdapter.setLocale(this.getDateLocale(language));
  }

  private getDateLocale(language: Language): string {
    const locales: Record<Language, string> = {
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      zh: 'zh-CN',
      fr: 'fr-FR',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
    };

    return locales[language];
  }
}
