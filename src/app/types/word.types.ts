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
  | 'africa'
  | 'north_america'
  | 'central_america'
  | 'caribbean'
  | 'south_america'
  | 'middle_east_asia'
  | 'south_asia'
  | 'central_asia'
  | 'east_asia'
  | 'southeast_asia'
  | 'scandinavia'
  | 'west_europe'
  | 'eastern_europe'
  | 'northern_europe'
  | 'southern_europe'
  | 'oceania';
