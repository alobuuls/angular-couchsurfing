import { REGIONS } from '@config/world';
import type { Continents, ICountryLocation, Regions } from '@type/word.types';

export const COUNTRY_REGION_INDEX: Record<string, ICountryLocation> = Object.fromEntries(
  Object.entries(REGIONS).flatMap(([continent, regions]) =>
    Object.entries(regions).flatMap(([region, countries]) =>
      countries.map((code: string) => [
        code,
        {
          continent: continent as Continents,
          region: region as Regions,
        },
      ])
    )
  )
);

export const REGION_CONTINENT_INDEX = Object.fromEntries(
  Object.entries(REGIONS).flatMap(([continent, regions]) => Object.keys(regions).map(region => [region, continent]))
) as Record<Regions, Continents>;

export const getCountryLocation = (code: string) => COUNTRY_REGION_INDEX[code.toLowerCase() as keyof typeof COUNTRY_REGION_INDEX] ?? null;
