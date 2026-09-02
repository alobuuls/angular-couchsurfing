import { CountriesCodes } from '@type/word.types';

// View Chart
export type ICurrentChart = 'summary' | 'ranking' | 'demographics' | 'geography' | 'timeline' | 'rating' | 'gifts';
export type IChartType = 'bar' | 'doughnut';

// Summary
export type ISummaryView = 'total' | 'nights' | 'gifts' | 'rating';
export interface ISummaryDistribution {
  totalGuests: number;
  totalGuestsSolo: number;
  totalGuestsGroups: number;
  totalVisits: number;
  totalNights: number;
  averageNightsGeneral: number;
  averageNightsSolo: number;
  averageNightsGroup: number;
  giftsReceived: number;
  guestsWithoutGift: number;
  averageRatingGeneral: number;
  averageRatingSolo: number;
  averageRatingGroup: number;
}

export interface ISummaryCard {
  label: string;
  value: number;
  icon: string;
}

// Rankings
export type IRankingView = 'people' | 'women' | 'men' | 'groups';

export interface IRankingGuest {
  guestId: string;
  fullName: string;
  gender: 'male' | 'female';
  groupId: string | null;
  groupType: string;
  hometownCode: string;
  continent: string;
  region: string;
  visitedDate: string;
  birthDate: string;
}

export interface IRankingItem {
  position: number;
  guest: IRankingGuest;
}

export interface IRankingCategory {
  solo?: IRankingItem[];
  overall: IRankingItem[];
  couple?: IRankingItem[];
  friends?: IRankingItem[];
  family?: IRankingItem[];
}

export interface IRankingsDistribution {
  women: IRankingCategory;
  men: IRankingCategory;
  people: IRankingCategory;
  groups: IRankingCategory;
}

// Demographics
export type IDemographicsView = 'totals' | 'mostVisitedGender' | 'oldest' | 'youngest' | 'firstLast';
export type IDemographicsGroup = 'overall' | 'solo' | 'couple' | 'friends' | 'family';
export type IDemographicGender = 'male' | 'female' | 'trans' | 'isGay';
export type IDemographicsTotalsView = 'groups' | 'overall';
export type IDemographicsOldestView = 'overall' | 'solo' | 'groups';
export type IDemographicGroups = Record<Exclude<IDemographicsGroup, 'overall'>, IDemographicGroup>;
export interface IDemographicPerson {
  guestId: string;
  fullName: string;
  gender: IDemographicGender;
  groupId: string | null;
  groupType: IDemographicsGroup;
  hometownCode: string;
  continent: string;
  region: string;
  visitedDate: string;
  birthDate: string | null;
}

export interface IDemographicRatedPerson extends IDemographicPerson {
  rating: number;
}

export interface IDemographicGroup {
  male: number;
  female: number;
  trans: number;
  isGay: number;
}

export interface IDemographicsTotals {
  overall: IDemographicGroup;
  groups: IDemographicGroups;
}

export interface IDemographicGenderPeople {
  male: IDemographicPerson[];
  female: IDemographicPerson[];
  trans: IDemographicPerson[];
  isGay: IDemographicPerson[];
}

export interface IDemographicAgeGroup {
  solo: IDemographicGenderPeople;
  overall: {
    people: IDemographicPerson[];
  };
  couple: IDemographicPerson[];
  friends: IDemographicPerson[];
  family: IDemographicPerson[];
}

export interface IDemographicsMostVisitedGender {
  overall: IDemographicGender;
  solo: IDemographicGender;
  couple: IDemographicGender;
  friends: IDemographicGender;
  family: IDemographicGender;
}
export interface IDemographicFirstLast {
  first: IDemographicPerson | null;
  last: IDemographicPerson | null;
}

export interface IDemographicsFirstLast {
  overall: {
    people: IDemographicFirstLast;
  };
  solo: {
    female: IDemographicFirstLast;
    male: IDemographicFirstLast;
    trans: IDemographicFirstLast;
    isGay: IDemographicFirstLast;
  };
  couple: IDemographicFirstLast;
  friends: IDemographicFirstLast;
  family: IDemographicFirstLast;
}

export interface IDemographicsDistribution {
  totals: IDemographicsTotals;
  oldest: IDemographicAgeGroup;
  youngest: IDemographicAgeGroup;
  mostVisitedGender: IDemographicsMostVisitedGender;
  firstLast: IDemographicsFirstLast;
}

// Rating
export type IRatingView = 'overall' | 'solo' | 'couple' | 'friends' | 'family';
export type IRatingGroupType = Exclude<IRatingView, 'overall'>;
export interface IRatingsDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  unrated: number;
}
// Geography
export type IGeographyView = 'continents' | 'regions' | 'countries' | 'livingIn' | 'hometown';
export type ICountryRanking = 'all' | 'top' | 'bottom' | 'topFemale' | 'topMale' | 'mostConsecutive';

export interface IGeographyContinent {
  code: string;
  total: number;
  firstVisit: string;
}

export interface IGeographyRegion {
  code: string;
  total: number;
  firstVisit: string;
}

export interface IGeographyCountry {
  code: CountriesCodes;
  total: number;
  male: number;
  female: number;
  firstVisit: string;
}

export interface IGeographyLocation {
  code: string;
  name: string;
  total: number;
}

export interface IGeographyRanking<T> {
  all: T[];
  top: T[];
  bottom: T[];
}

export interface IGeographyDistribution {
  continents: IGeographyRanking<IGeographyContinent>;
  regions: IGeographyRanking<IGeographyRegion>;
  countries: IGeographyCountryRanking;
  livingIn: {
    top: IGeographyLocation[];
  };
  hometown: {
    top: IGeographyLocation[];
  };
}

export interface IGeographyMostConsecutive {
  code: CountriesCodes;
  streak: number;
  firstVisit: string;
  lastVisit: string;
  guests: {
    guestId: string;
    fullName: string;
    gender: string;
    groupId: string | null;
    groupType: string;
    birthDate: string;
    continent: string;
    hometownCode: string;
    region: string;
    visitedDate: string;
  }[];
}

export interface IGeographyCountryRanking {
  all: IGeographyCountry[];
  top: IGeographyCountry[];
  bottom: IGeographyCountry[];
  topFemale: IGeographyCountry[];
  topMale: IGeographyCountry[];
  mostConsecutive: IGeographyMostConsecutive;
}

// Gifts
export type IGiftsView = 'groups' | 'solo';

export interface IGiftGuest {
  guestId: string;
  fullName: string;
  gender: string;
  groupId: string | null;
  groupType: string;
  birthDate: string;
  continent: string;
  hometownCode: string;
  region: string;
  gifts: string[];
  total: number;
  visitedDate: string;
}

export interface IGiftsDistribution {
  groups: IGiftGuest[];
  solo: IGiftGuest[];
}

// Timeline
export type ITimelineView = 'years' | 'months' | 'days' | 'sameArrivalDay' | 'sameStay';
export interface ITimelineItem {
  period: string;
  total: number;
}
export interface ISameArrivalDayGuest {
  guestId: string;
  fullName: string;
  gender: 'male' | 'female';
  groupId: string | null;
  groupType: string;
  hometownCode: string;
  continent: string;
  region: string;
  visitedDate: string;
  birthDate: string | null;
}
export interface ISameArrivalDay {
  date: string;
  total: number;
  guests: ISameArrivalDayGuest[];
}
export interface ISameStayGuest {
  guestId: string;
  fullName: string;
  gender: 'male' | 'female';
  groupId: string | null;
  groupType: string;
  hometownCode: string;
  continent: string;
  region: string;
  visitedDate: string;
  birthDate: string | null;
}
export interface ISameStay {
  guest: ISameStayGuest;
  overlap: number;
  guests: ISameStayGuest[];
}
export interface ITimelineDistribution {
  years: ITimelineItem[];
  months: ITimelineItem[];
  days: ITimelineItem[];
  sameArrivalDay: ISameArrivalDay[];
  sameStay: ISameStay[];
}

export type ITimelineChartType = 'bar' | 'network';
