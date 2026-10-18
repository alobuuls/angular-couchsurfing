import { WORLD } from '@config/world';

export const LANG = ['en', 'es', 'de', 'zh', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'he', 'hi'] as const;
export type Language = (typeof LANG)[number];

export type CountriesCodes = keyof typeof WORLD;

export const CONTINENTS = ['africa', 'america', 'asia', 'europe', 'oceania'] as const;
export type Continents = (typeof CONTINENTS)[number];

export type Regions =
  // 🌍 Africa
  | 'northern_africa'
  | 'western_africa'
  | 'central_africa'
  | 'eastern_africa'
  | 'southern_africa'

  // 🌎 America
  | 'north_america'
  | 'south_america'
  | 'caribbean'
  | 'central_america'

  // 🌏 Asia
  | 'central_asia'
  | 'east_asia'
  | 'south_asia'
  | 'southeast_asia'
  | 'west_asia'

  // 🇪🇺 Europe
  | 'northern_europe'
  | 'scandinavia'
  | 'baltics'
  | 'central_europe'
  | 'western_europe'
  | 'eastern_europe'
  | 'southern_europe'

  // 🌊 Oceania
  | 'melanesia'
  | 'micronesia'
  | 'polynesia'
  | 'oceania';

export interface ICountry {
  flag: string;
  name: Record<Language, string>;
  prefix: string;
  continent: Continents;
  region: Regions;
}
