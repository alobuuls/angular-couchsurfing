import { DatePipe } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from '@core/services/language.service';
import { Language, CountriesCodes } from '@type/word.types';
import { WORLD } from '@config/world';
import { OCCUPATION_TRANSLATIONS } from '@config/occupations/occupations';

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
    hi: 'd MMMM y',
    ko: 'y년 M월 d일',
    he: 'd בMMMM y',
  };

  private formatWithLocale(value: string | Date, format: string): string | null {
    return new DatePipe(this._language.currentLocale).transform(value, format);
  }

  formatDate(isoDate: string): string {
    const lang = this._language.currentLanguage;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return this.formatWithLocale(date, this.dateFormats[lang]) ?? isoDate;
    }
    return this.formatWithLocale(isoDate, this.dateFormats[lang]) ?? isoDate;
  }

  formatMonth(isoMonth: string): string {
    return this.formatWithLocale(`${isoMonth}-01`, 'MMMM y') ?? isoMonth;
  }

  formatDay(period: string): string {
    const [year, day] = period.split('-');
    const label = this._translate.instant('DATE.DAY');
    return `${label} ${day}, ${year}`;
  }

  formatBirthday(month: number, day: number): string {
    const date = new Date(2000, month - 1, day);
    return this.formatWithLocale(date, 'MMMM d') ?? `${month}/${day}`;
  }

  formatCountry(code: string): string {
    const countryCode = code?.toLowerCase() as CountriesCodes;
    const country = WORLD[countryCode];
    if (!country) return code;
    return country.name[this._language.currentLanguage] || country.name.en;
  }

  formatGender(gender?: string | null): string {
    if (!gender) return '';
    const key = `GENDER.${gender.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? gender.charAt(0).toUpperCase() + gender.slice(1) : translated;
  }

  formatOccupation(occupation: string): string {
    const translations = OCCUPATION_TRANSLATIONS[occupation];
    if (!translations) return occupation;
    const language = this._language.currentLanguage;
    const translation = translations[language as keyof typeof translations];
    return translation || translations.en || occupation;
  }

  formatOccupations(occupations: string[]): string {
    return occupations.map(occupation => this.formatOccupation(occupation)).join(' · ');
  }
}
