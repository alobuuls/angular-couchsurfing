// COUNTRY DATA
import { AFRICA } from '@config/world/africa';
import { AMERICA } from '@config/world/america';
import { ASIA } from '@config/world/asia';
import { EUROPE } from '@config/world/europe';
import { OCEANIA } from '@config/world/oceania';

// Interface
import { ICountry } from '@type/word.types';

export * from '@config/world/africa';
export * from '@config/world/america';
export * from '@config/world/asia';
export * from '@config/world/europe';
export * from '@config/world/oceania';
export * from '@config/world/continents';
export * from '@config/world/regions';
export * from '@config/world/country-region-index';
export * from '@config/world/iso3';

export const WORLD: Record<string, ICountry> = {
  ...AFRICA,
  ...AMERICA,
  ...ASIA,
  ...EUROPE,
  ...OCEANIA,
};
