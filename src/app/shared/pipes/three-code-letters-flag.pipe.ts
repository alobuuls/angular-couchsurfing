const WORLD_FLAGS: Record<string, string> = {
  // Africa
  dza: 'dz',
  egy: 'eg',
  mar: 'ma',
  nga: 'ng',
  zaf: 'za',

  // North America
  can: 'ca',
  usa: 'us',

  // Central America
  cri: 'cr',
  slv: 'sv',
  jam: 'jm',
  gtm: 'gt',
  hnd: 'hn',
  mex: 'mx',
  pan: 'pa',

  // South America:
  arg: 'ar',
  bra: 'br',
  chl: 'cl',
  col: 'co',
  ecu: 'ec',
  per: 'pe',
  ven: 've',
  guy: 'gf',

  // Middle East Asia
  geo: 'ge',
  isr: 'il',
  qat: 'qa',
  tur: 'tr',
  are: 'ae',

  // Southeast Asia
  phl: 'ph',

  // Eastern Asia
  chn: 'cn',
  hkg: 'hk',
  twn: 'tw',
  jpn: 'jp',
  kor: 'kr',

  // South Asia
  ind: 'in',

  // Central Asia
  kaz: 'kz',
  kgz: 'kg',

  // West Europe
  aut: 'at',
  bel: 'be',
  fra: 'fr',
  deu: 'de',
  nld: 'nl',
  che: 'ch',

  // SCANDINAVOS
  dnk: 'dk',
  nor: 'no',
  swe: 'se',

  // SOUTHERN EUROPE
  bih: 'ba',
  grc: 'gr',
  ita: 'it',
  mne: 'me',
  prt: 'pt',
  srb: 'rs',
  svn: 'si',
  esp: 'es',

  // Northern Europe
  gbr: 'gb',
  sct: 'gb-sct',

  // Eastern Europe
  blr: 'by',
  cze: 'cz',
  pol: 'pl',
  rus: 'ru',
  svk: 'sk',
  ukr: 'ua',

  // Oceania
  aus: 'au',
  nzl: 'nz',
};

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'flag' })
export class FlagPipe implements PipeTransform {
  transform(countryCode: string): string {
    const code = WORLD_FLAGS[countryCode];
    return code ? `fi fi-${code}` : '';
  }
}
