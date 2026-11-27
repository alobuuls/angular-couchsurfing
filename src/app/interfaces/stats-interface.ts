import type { CountriesCodes } from '@type/word.types';
import type { IApiCsOkResp, TGroupType, TGuestGender, TGuestGroupType } from './guests.interface';

// ─────────────────────────────────────────────
// API response
// ─────────────────────────────────────────────

export interface IGuestsStats {
  birthdays: IBirthdaysDistribution;
  demographics: IDemographicsDistribution;
  geography: IGeographyDistribution;
  gifts: IGiftsDistribution;
  rankings: IRankingsDistribution;
  ratings: IRatingsData;
  stays: IStaysDistribution;
  summary: ISummaryDistribution;
  timeline: ITimelineDistribution;
}

export type IGuestsStatsResp = IApiCsOkResp<IGuestsStats>;

// Every slice of the response is a chart (a button and a route) of the stats page.
export type ICurrentChart = keyof IGuestsStats;

export type IChartType = 'bar' | 'doughnut' | 'pie';

// ─────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────

// All the guests or one type of guest.
export type TStatsGroup = 'overall' | TGuestGroupType;

// One value per group filter.
export type TByStatsGroup<T> = Record<TStatsGroup, T>;

// One value per demographic.
export type TByDemographic<T> = Record<IDemographicGender, T>;

// Guest that appears in the stats lists.
export interface IStatsGuest {
  guestId: string;
  fullName: string;
  gender: string;
  groupId: string | null;
  groupType: string;
  hometownCode: string;
  continent: string;
  region: string;
  visitedDate: string;
}

export interface IStatsGuestWithBirth extends IStatsGuest {
  birthDate: string | null;
}

// A total and the guests behind it.
export interface IGuestsGroup<TGuest = IStayGuest> {
  total: number;
  guests: TGuest[];
}

export interface IDatedGuestsGroup<TGuest = IStayGuest> extends IGuestsGroup<TGuest> {
  date: string;
}

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Rankings
// ─────────────────────────────────────────────

export type IRankingView = 'people' | 'women' | 'men' | 'groups';
export type IRankingGroupView = 'overall' | TGroupType;
export type IRankingGenderView = 'overall' | 'solo';

export interface IRankingGuest extends IStatsGuestWithBirth {
  gender: TGuestGender;
  birthDate: string;
}

export interface IRankingItem {
  position: number;
  guest: IRankingGuest;
}

export interface IRankingCategory extends Partial<Record<TGuestGroupType, IRankingItem[]>> {
  overall: IRankingItem[];
}

export type IRankingsDistribution = Record<IRankingView, IRankingCategory>;

// ─────────────────────────────────────────────
// Demographics
// ─────────────────────────────────────────────

export type IDemographicsView = 'totals' | 'oldest' | 'youngest' | 'firstLast';
export type IDemographicsGroup = TStatsGroup;
export type IDemographicGender = 'male' | 'female' | 'trans' | 'isGay';
export type IDemographicsTotalsView = 'groups' | 'overall';
export type IDemographicsOldestView = 'overall' | 'solo' | 'groups';

export interface IDemographicPerson extends IStatsGuestWithBirth {
  gender: IDemographicGender;
  groupType: IDemographicsGroup;
}

export interface IDemographicRatedPerson extends IDemographicPerson {
  rating: number;
}

// Total of guests per demographic.
export type IDemographicGroup = TByDemographic<number>;
export type IDemographicGroups = Record<TGuestGroupType, IDemographicGroup>;

export interface IDemographicsTotals {
  overall: IDemographicGroup;
  groups: IDemographicGroups;
}

export type IDemographicGenderPeople = TByDemographic<IDemographicPerson[]>;

export interface IDemographicAgeGroup extends Record<TGroupType, IDemographicPerson[]> {
  solo: IDemographicGenderPeople;
  overall: { people: IDemographicPerson[] };
}

export type IDemographicsMostVisitedGender = TByStatsGroup<IDemographicGender>;

export interface IDemographicFirstLast {
  first: IDemographicPerson | null;
  last: IDemographicPerson | null;
}

export interface IDemographicsFirstLast extends Record<TGroupType, IDemographicFirstLast> {
  overall: { people: IDemographicFirstLast };
  solo: TByDemographic<IDemographicFirstLast>;
}

export interface IDemographicsDistribution {
  totals: IDemographicsTotals;
  oldest: IDemographicAgeGroup;
  youngest: IDemographicAgeGroup;
  mostVisitedGender: IDemographicsMostVisitedGender;
  firstLast: IDemographicsFirstLast;
}

// ─────────────────────────────────────────────
// Rating
// ─────────────────────────────────────────────

export type IRatingView = TStatsGroup;
export type IRatingGroupType = Exclude<IRatingView, 'overall'>;
export type IRatingMainView = 'distribution' | 'lowest' | 'highest';
export type TRatingStar = '1' | '2' | '3' | '4' | '5';

export interface IRatingsDistribution extends Record<TRatingStar, number> {
  unrated: number;
}

export interface IRatingGuest extends IStatsGuestWithBirth {
  rating: number;
}

export type IRatingRankings = Record<IRatingView, IRatingGuest[]>;

export interface IRatingsData {
  distribution: Record<IRatingView, IRatingsDistribution>;
  highest: IRatingRankings;
  lowest: IRatingRankings;
}

// ─────────────────────────────────────────────
// Geography
// ─────────────────────────────────────────────

export type IGeographyView = 'continents' | 'regions' | 'countries' | 'livingIn' | 'hometown';
export type ICountryRanking = 'all' | 'top' | 'bottom' | 'topFemale' | 'topMale' | 'mostConsecutive';

export interface IGeographyEntry {
  code: string;
  total: number;
  firstVisit: string;
}

export type IGeographyContinent = IGeographyEntry;
export type IGeographyRegion = IGeographyEntry;

export interface IGeographyCountry extends IGeographyEntry {
  code: CountriesCodes;
  male: number;
  female: number;
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

export interface IGeographyLocationRanking {
  top: IGeographyLocation[];
}

export interface IGeographyConsecutiveGuest extends IStatsGuestWithBirth {
  birthDate: string;
}

export interface IGeographyMostConsecutive {
  code: CountriesCodes;
  streak: number;
  firstVisit: string;
  lastVisit: string;
  guests: IGeographyConsecutiveGuest[];
}

export interface IGeographyCountryRanking extends IGeographyRanking<IGeographyCountry> {
  topFemale: IGeographyCountry[];
  topMale: IGeographyCountry[];
  mostConsecutive: IGeographyMostConsecutive | null;
}

export interface IGeographyDistribution {
  continents: IGeographyRanking<IGeographyContinent>;
  regions: IGeographyRanking<IGeographyRegion>;
  countries: IGeographyCountryRanking;
  livingInState: IGeographyLocationRanking;
  hometownState: IGeographyLocationRanking;
}

// ─────────────────────────────────────────────
// Gifts
// ─────────────────────────────────────────────

export type IGiftsView = 'groups' | 'solo';

export interface IGiftGuest extends IStatsGuestWithBirth {
  birthDate: string;
  gifts: string[];
  total: number;
}

export type IGiftsDistribution = Record<IGiftsView, IGiftGuest[]>;

// ─────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────

export type ITimelineView = 'years' | 'months' | 'days' | 'sameArrivalDay' | 'sameStay';
export type ITimelineChartType = 'bar' | 'network';

export interface ITimelineItem {
  period: string;
  total: number;
}

export interface ITimelineGuest extends IStatsGuestWithBirth {
  gender: 'male' | 'female';
}

export type ISameArrivalDayGuest = ITimelineGuest;
export type ISameStayGuest = ITimelineGuest;

export type ISameArrivalDay = IDatedGuestsGroup<ITimelineGuest>;

export interface ISameStay {
  guest: ITimelineGuest;
  overlap: number;
  guests: ITimelineGuest[];
}

export interface ITimelineDistribution {
  years: ITimelineItem[];
  months: ITimelineItem[];
  days: ITimelineItem[];
  sameArrivalDay: ISameArrivalDay[];
  sameStay: ISameStay[];
}

// ─────────────────────────────────────────────
// Stays
// ─────────────────────────────────────────────

export type IStaysView = 'longest' | 'shortest' | 'maxPeopleTogether' | 'sameArrival' | 'sameDates';
export type ILongestView = TStatsGroup;

export type IStayGuest = IStatsGuest;

export interface ILongestItem {
  guest: IStayGuest;
  nights: number;
}

export type ILongestDistribution = TByStatsGroup<ILongestItem[]>;

export type ISameArrivalItem = IDatedGuestsGroup<IStayGuest>;
export type ISameDatesItem = IGuestsGroup<IStayGuest>;
export type IMaxPeopleTogetherItem = IGuestsGroup<IStayGuest>;
export type IMaxPeopleTogetherDistribution = Record<'overall' | 'solo', IMaxPeopleTogetherItem>;

export interface IStaysDistribution {
  longest: ILongestDistribution;
  shortest: ILongestDistribution;
  maxPeopleTogether: IMaxPeopleTogetherDistribution;
  sameArrival: ISameArrivalItem[];
  sameDates: ISameDatesItem[];
}

// ─────────────────────────────────────────────
// Birthdays
// ─────────────────────────────────────────────

export type IBirthdaysView = 'calendar' | 'repeated' | 'unusual';

export interface IBirthdayGuest extends IStatsGuestWithBirth {
  birthDate: string;
}

export interface IBirthdayItem extends IGuestsGroup<IBirthdayGuest> {
  month: number;
  day: number;
}

export interface IUnusualBirthday extends IBirthdayItem {
  reason: string;
}

export interface IBirthdaysDistribution {
  calendar: IBirthdayItem[];
  repeated: IBirthdayItem[];
  unusual: IUnusualBirthday[];
}
