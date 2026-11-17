import { Injectable, inject } from '@angular/core';

// Services
import { FormatService } from '@services/format.service';

// Types
import { ICountry, CountriesCodes } from '@type/word.types';

// Constants
import { ISO_CODES } from '@config/world';

export type SearchableCountry = ICountry & {
  countryCode: CountriesCodes;
};

@Injectable()
export class CountrySearchService {
  private readonly format = inject(FormatService);

  /**
   * Normalizes text:
   * - Removes accents.
   * - Ignores uppercase/lowercase.
   * - Ignores spaces, underscores and hyphens.
   */
  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\s_-]/g, '')
      .trim();
  }

  /**
   * Filters countries by translated name, English name,
   * ISO2 or ISO3 code.
   */
  filter<T extends SearchableCountry>(countries: T[], value: string): T[] {
    const search = this.normalize(value);
    if (!search) return [...countries];

    return countries.filter(country => {
      const iso2 = country.countryCode.toUpperCase();
      const iso3 = ISO_CODES[iso2 as keyof typeof ISO_CODES] ?? '';
      const searchableValues = [this.format.formatCountry(country.countryCode), country.name.en, iso2, iso3];
      return searchableValues.some(item => this.matches(search, this.normalize(item)));
    });
  }

  private matches(search: string, target: string): boolean {
    if (target.includes(search)) return true;
    if (search.length < 4) return false;
    const maxErrors = search.length >= 8 ? 2 : 1;
    return this.levenshteinDistance(search, target) <= maxErrors;
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a.length < b.length) [a, b] = [b, a];
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }

      previous = current;
    }
    return previous[b.length];
  }
}
