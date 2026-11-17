import { Pipe, PipeTransform } from '@angular/core';

// Const
import { WORLD } from '@config/world';

@Pipe({ name: 'flag' })
export class FlagPipe implements PipeTransform {
  transform(countryCode?: string | null): string {
    if (!countryCode) return 'fi fi-xx';
    const key = countryCode.trim().toLowerCase() as keyof typeof WORLD;
    return WORLD[key] ? `fi fi-${key}` : 'fi fi-xx';
  }
}
