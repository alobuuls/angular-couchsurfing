import type { Continents, CountriesCodes, Regions } from '@type/word.types';
import type { IGuestTableRow } from '@interfaces/data-structure-api';

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

export type TGuestGender = 'female' | 'male' | 'trans';

// A guest that travels with others. A solo guest is not part of a group.
export type TGroupType = 'couple' | 'friends' | 'family';
export type TGuestGroupType = 'solo' | TGroupType;

export type TNights = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type TRating = 1 | 2 | 3 | 4 | 5;

// Place of a guest (hometown or living in).
export interface IGuestPlace {
  code?: string | null;
  city?: string | null;
  state?: string | null;
}

// ─────────────────────────────────────────────
// Guests and groups
// ─────────────────────────────────────────────

export interface ITripDetail {
  visitedDate: string;
  stayed: boolean;
  nights: TNights;
}

// Guest with all the information.
export interface IGuestDetail extends ITripDetail {
  // Identity
  _id: string;
  guestId: string;
  platform: string;
  fullName: string;
  gender: TGuestGender;
  isGay?: boolean | null;
  birthDate?: string;
  age: number;
  occupation: string[];
  occupationArea: string[];

  // Group
  groupType: TGuestGroupType;
  groupId?: string;

  // Where they are from and where they live
  continent: Continents;
  region: Regions;
  hometownCode: CountriesCodes;
  hometownState?: string;
  hometownCity?: string;
  livingInCode: CountriesCodes;
  livingInState?: string;
  livingInCity?: string;

  // Where we met
  countryCodeWeMet: CountriesCodes;
  stateWeMet?: string;
  cityWeMet?: string;
  locationWeMet?: string;

  // Visit
  isFirstTime: boolean;
  hangOut: boolean;
  rating?: TRating;
  gift: string[];
  comments: string;
  ambassador?: boolean;
  didTheyReq?: boolean;
  theirReference: string | null;
  myReference: string | null;

  // Contact
  prefixCode: string;
  whatsapp: string;
  instagram: string;
  urlProfileCs: string;
}

export interface IGroupMember extends IGuestDetail {
  groupId: string;
}

export interface IGroupDetail extends ITripDetail {
  groupId: string;
  groupType: TGroupType;
  members: IGroupMember[];
}

export type IGroupEdit = IGroupMember[];

// List items: all the guests (without the heavy fields) and groups.
export type IGuest = Omit<IGuestDetail, 'comments' | 'instagram' | 'occupation' | 'region' | 'stayed' | 'gift'>;
export type IGuestListItem = IGuestDetail | IGroupDetail;

// Card of a group member in the table.
export interface IGuestTableMemberCard {
  fullName: string;
  gender: TGuestGender;
  age: string | null;
  continent: string;
  hometown: IGuestPlace;
  livingIn: IGuestPlace;
  rating: number;
  whatsapp: string | null;
  prefixCode: string;
  urlProfileCs: string | null;
  ambassador: boolean;
  gift: string[];
  isFirstTime: boolean;
}

/** @deprecated Use IGuestDetail. */
export type IBodyGuest = IGuestDetail;
/** @deprecated Use IGuestDetail. */
export type ICardGuest = IGuestDetail;
/** @deprecated Use IGuestListItem. */
export type IDetailResp = IGuestListItem;

// ─────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────

// Guest data shared by solo guests and group members.
export type IGuestFormPayload = Omit<IGuestDetail, '_id' | 'guestId' | 'groupId' | 'groupType' | 'age' | 'visitedDate' | 'stayed' | 'nights'>;

export type IGroupMemberPayload = IGuestFormPayload & { groupType: TGroupType };

export type IGuestCreatePayload = IGuestFormPayload & { groupType: 'solo' };

export type IGroupCreatePayload = Omit<IGroupDetail, 'groupId' | 'members'> & {
  members: IGroupMemberPayload[];
};

export interface IGroupUpdatePayload extends ITripDetail {
  groupId: string;
  groupType: TGroupType;
  members: IGroupMemberPayload[];
}

// ─────────────────────────────────────────────
// API responses
// ─────────────────────────────────────────────

export interface IApiCsOkResp<T> {
  data: T;
  success: boolean;
  message: string;
}

export interface IApiCsErrResp {
  errors: string[];
  message: string;
  success: boolean;
}

export interface IApiCsPag {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Totals shared by the monthly / yearly stats and groups.
export interface IVisitTotals {
  totalVisits: number;
  totalPeople: number;
}

export interface IMonthlyStat extends IVisitTotals {
  month: number;
}

export interface IYearlyStat extends IVisitTotals {
  year: number;
  months: IMonthlyStat[];
}

export interface IGuestMonthGroup extends IVisitTotals {
  month: number;
  monthName: string;
  guests: IGuestTableRow[];
}

export interface IGuestYearGroup extends IVisitTotals {
  year: number;
  months: IGuestMonthGroup[];
}

export interface IGuestsResp extends IApiCsOkResp<IGuestListItem[]> {
  pagination: IApiCsPag;
  monthlyStats: IYearlyStat[];
}

export type IGuestDetailResp = IApiCsOkResp<IGuestDetail>;
export type IGroupDetailResp = IApiCsOkResp<IGroupEdit>;
export type IGuestCreateResp = IApiCsOkResp<IGuestDetail>;
export type IGuestDeleteResp = IApiCsOkResp<IGuestDetail>;

// ─────────────────────────────────────────────
// Query params of the guests list
// ─────────────────────────────────────────────

export interface IQueryParamsGuests {
  // Pagination
  page?: number;
  limit?: number;

  // Guest filters
  platform?: string;
  groupType?: TGroupFilterQuery;
  gender?: TGuestGender;
  gay?: boolean;
  rating?: number;
  gift?: boolean;
  isFirstTime?: boolean;
  hangOut?: boolean;
  ambassador?: boolean;
  didTheyReq?: boolean;

  // Location filters
  continent?: string;
  region?: string;
  country?: string;
  // Slugs, for example "new-york".
  hometownState?: string;
  livingInState?: string;

  // Date filters
  // ISO dates (yyyy-MM-dd) of the visit range.
  from?: string;
  to?: string;
  year?: number;
  // Period of the "days" view of the timeline stats.
  day?: string;
  // Month and day of the birthday, without the year ("MM-dd").
  birthDate?: string;
}

export type TGroupFilter = TGuestGroupType | 'all-groups';
export type TGroupFilterQuery = TGroupFilter | `${TGroupFilter},${string}`;
