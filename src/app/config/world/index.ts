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

export const WORLD = {
  ...AFRICA,
  ...AMERICA,
  ...ASIA,
  ...EUROPE,
  ...OCEANIA,
} satisfies Record<string, ICountry>;
