// View Chart
export type ICurrentChart = 'summary' | 'ranking' | 'demographics' | 'oldest' | 'youngest' | 'mostVisitedGender' | 'firstLast' | 'rating';

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

export type IChartType = 'bar' | 'doughnut';
