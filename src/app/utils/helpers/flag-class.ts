import { WORLD } from '@config/world';

export const getFlagClass = (countryCode?: string | null): string => {
  if (!countryCode) return 'fi fi-xx';
  const key = countryCode.trim().toLowerCase() as keyof typeof WORLD;
  return WORLD[key] ? `fi fi-${key}` : 'fi fi-xx';
};
