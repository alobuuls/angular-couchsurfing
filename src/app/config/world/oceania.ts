import { ICountry } from '@type/word.types';

export const OCEANIA = {
  aus: {
    flag: 'au',
    name: 'Australia',
    prefix: '+61',
    continent: 'oceania',
    region: 'oceania',
  },

  fji: {
    flag: 'fj',
    name: 'Fiji',
    prefix: '+679',
    continent: 'oceania',
    region: 'melanesia',
  },

  kir: {
    flag: 'ki',
    name: 'Kiribati',
    prefix: '+686',
    continent: 'oceania',
    region: 'micronesia',
  },

  mhl: {
    flag: 'mh',
    name: 'Marshall Islands',
    prefix: '+692',
    continent: 'oceania',
    region: 'micronesia',
  },

  mic: {
    flag: 'fm',
    name: 'Micronesia (Federated States of Micronesia)',
    prefix: '+691',
    continent: 'oceania',
    region: 'micronesia',
  },

  nru: {
    flag: 'nr',
    name: 'Nauru',
    prefix: '+674',
    continent: 'oceania',
    region: 'micronesia',
  },

  nzl: {
    flag: 'nz',
    name: 'New Zealand',
    prefix: '+64',
    continent: 'oceania',
    region: 'oceania',
  },

  plw: {
    flag: 'pw',
    name: 'Palau',
    prefix: '+680',
    continent: 'oceania',
    region: 'micronesia',
  },

  png: {
    flag: 'pg',
    name: 'Papua New Guinea',
    prefix: '+675',
    continent: 'oceania',
    region: 'melanesia',
  },

  slb: {
    flag: 'sb',
    name: 'Solomon Islands',
    prefix: '+677',
    continent: 'oceania',
    region: 'melanesia',
  },

  ton: {
    flag: 'to',
    name: 'Tonga',
    prefix: '+676',
    continent: 'oceania',
    region: 'polinesia',
  },

  tuv: {
    flag: 'tv',
    name: 'Tuvalu',
    prefix: '+688',
    continent: 'oceania',
    region: 'polinesia',
  },

  vut: {
    flag: 'vu',
    name: 'Vanuatu',
    prefix: '+678',
    continent: 'oceania',
    region: 'melanesia',
  },
} satisfies Record<string, ICountry>;
