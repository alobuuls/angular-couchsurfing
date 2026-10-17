import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { Language, CountriesCodes } from '@type/word.types';
import { WORLD } from '@config/world';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class FormatService {
  private readonly _language = inject(LanguageService);
  private readonly _translate = inject(TranslateService);

  private readonly dateFormats: Record<Language, string> = {
    en: 'MMMM d, y',
    es: "d 'de' MMMM 'de' y",
    de: 'd. MMMM y',
    zh: 'y年M月d日',
    fr: 'd MMMM y',
    it: 'd MMMM y',
    pt: "d 'de' MMMM 'de' y",
    ru: "d MMMM y 'г'.",
    ja: 'y年M月d日',
  };

  private readonly locales: Record<Language, string> = {
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

  private getCurrentLocale(): string {
    return this.locales[this._language.currentLanguage];
  }

  formatDate(isoDate: string): string {
    const lang = this._language.currentLanguage;
    const locale = this.getCurrentLocale();
    const format = this.dateFormats[lang];

    return new DatePipe(locale).transform(isoDate, format) ?? isoDate;
  }

  formatMonth(isoMonth: string): string {
    return new DatePipe(this.getCurrentLocale()).transform(`${isoMonth}-01`, 'MMMM y') ?? isoMonth;
  }

  formatDay(period: string): string {
    const [year, day] = period.split('-');
    const label = this._translate.instant('DATE.DAY');

    return `${label} ${day}, ${year}`;
  }

  formatBirthday(month: number, day: number): string {
    const date = new Date(2000, month - 1, day);
    return new DatePipe(this.getCurrentLocale()).transform(date, 'MMMM d') ?? `${month}/${day}`;
  }

  formatCountry(code: string): string {
    const countryCode = code.toLowerCase() as CountriesCodes;
    const country = WORLD[countryCode];
    if (!country) return code;

    const lang = this._language.currentLanguage;
    return country.name[lang] || country.name.en;
  }
}
