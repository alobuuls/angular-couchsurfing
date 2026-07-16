import { Pipe, PipeTransform } from '@angular/core';

// Interfaces
import { CountriesCodes } from '@type/word.types';

// Const
import { WORLD } from '@config/world';

@Pipe({ name: 'flag' })
export class FlagPipe implements PipeTransform {
  transform(countryCode?: CountriesCodes | null): string {
    if (!countryCode) return '';

    const key = countryCode.toLowerCase() as keyof typeof WORLD;

    return WORLD[key] ? `fi fi-${WORLD[key].flag}` : '';
  }
}
