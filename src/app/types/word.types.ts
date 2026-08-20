import { WORLD } from '@config/world';

export interface ICountry {
  flag: string;
  name: string;
  prefix: string;
  continent: Continents;
  region: Regions;
}

export type CountriesCodes = keyof typeof WORLD;

export type Continents = 'africa' | 'america' | 'asia' | 'europe' | 'oceania';

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
  | 'polinesia'
  | 'oceania';
