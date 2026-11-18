// Alternative country names mapped to their ISO2 codes.

export const COUNTRY_NAME_ALIASES: Record<string, string> = {
  france: 'fr',
  norway: 'no',
  spain: 'es',
  germany: 'de',
  italy: 'it',

  'united kingdom': 'gb',
  uk: 'gb',
  britain: 'gb',

  'united states': 'us',
  'united states of america': 'us',

  'south korea': 'kr',
  'republic of korea': 'kr',
  'north korea': 'kp',

  russia: 'ru',
  'czech republic': 'cz',
  czechia: 'cz',
  turkey: 'tr',
  turkiye: 'tr',

  bolivia: 'bo',
  venezuela: 've',
  colombia: 'co',
  peru: 'pe',
  ecuador: 'ec',
  brazil: 'br',
  argentina: 'ar',
  chile: 'cl',
  paraguay: 'py',
  uruguay: 'uy',
  guyana: 'gy',
  suriname: 'sr',

  'south africa': 'za',
  'democratic republic of the congo': 'cd',
  'republic of the congo': 'cg',
  'ivory coast': 'ci',
  'cote divoire': 'ci',
  'cape verde': 'cv',
  'sao tome and principe': 'st',
  swaziland: 'sz',
  'myanmar (burma)': 'mm',
  burma: 'mm',
  laos: 'la',
  'east timor': 'tl',
  'timor leste': 'tl',
};

// Alternative names for administrative regions.
export const REGION_NAME_ALIASES: Record<string, string[]> = {
  'canary islands': ['canary is.', 'las palmas', 'santa cruz de tenerife'],
  'san andres, providencia y santa catalina': ['san andres y providencia', 'archipielago de san andres', 'saint andrew and providence'],
};

// Special country codes used to resolve map polygons.
export const COUNTRY_POLYGON_ALIASES: Record<string, string> = {
  mq: 'fr',
  mtq: 'fr',
  sct: 'gb',
};
