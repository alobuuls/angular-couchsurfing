// View Chart
export type ICurrentChart = 'summary' | 'ranking' | 'demographics' | 'oldest' | 'youngest' | 'mostVisitedGender' | 'firstLast' | 'rating' | 'geography';

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
export type IDemographicsView = 'overall' | 'groups';

export interface IDemographicGroup {
  male: number;
  female: number;
  trans: number;
  isGay: number;
}

export interface IDemographicsTotals {
  overall: IDemographicGroup;

  groups: {
    solo: IDemographicGroup;
    couple: IDemographicGroup;
    friends: IDemographicGroup;
    family: IDemographicGroup;
  };
}

export interface IDemographicsDistribution {
  totals: IDemographicsTotals;
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
/* Geography */
export type IGeographyView = 'continents' | 'regions' | 'countries' | 'livingIn' | 'hometown';

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
  code: string;
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
  countries: IGeographyRanking<IGeographyCountry>;
  livingIn: {
    top: IGeographyLocation[];
  };
  hometown: {
    top: IGeographyLocation[];
  };
}

export type IChartType = 'bar' | 'doughnut';
