import { Injectable, inject } from '@angular/core';

import { Continents, ICountry, Regions } from '@type/word.types';
import { REGION_NAMES } from '@config/world/regions';
import { CONTINENT_NAMES } from '@config/world/continents';
import { LanguageService } from '@services/language.service';

@Injectable({
  providedIn: 'root',
})
export class GeonameService {
  private readonly _language = inject(LanguageService);

  getRegionName(region: Regions): string {
    const lang = this._language.currentLanguage;
    return REGION_NAMES[region]?.[lang] ?? REGION_NAMES[region]?.en ?? region;
  }

  getContinentName(continent: Continents): string {
    const lang = this._language.currentLanguage;
    return CONTINENT_NAMES[continent]?.[lang] ?? CONTINENT_NAMES[continent]?.en ?? continent;
  }
}
