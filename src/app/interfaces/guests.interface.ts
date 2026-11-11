import { CountriesCodes } from '@type/word.types';
import { Continents, Regions } from '@type/word.types';
import { IGuestTableRow } from '@interfaces/data-structure-api';

// Guest with all information
export interface IGuestDetail extends ITripDetail {
  _id: string;
  groupType: TGuestGroupType;
  birthDate?: string;
  age: number;
  continent: Continents;
  hometownCode: CountriesCodes;
  hometownState?: string;
  hometownCity?: string;
  livingInCode: CountriesCodes;
  hangOut: boolean;
  fullName: string;
  gender: 'female' | 'male' | 'trans';
  guestId: string;
  livingInState?: string;
  livingInCity?: string;
  countryCodeWeMet?: CountriesCodes;
  cityWeMet?: string;
  stateWeMet?: string;
  locationWeMet?: string;
  nights: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  prefixCode: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  visitedDate: string;
  whatsapp: string;
  comments: string;
  instagram: string;
  occupation: string[];
  occupationArea: string[];
  region: Regions;
  stayed: boolean;
  isFirstTime: boolean;
  gift: string[];
  urlProfileCs: string;
  isGay?: boolean | null;
  theirReference: string | null;
  myReference: string | null;
  groupId?: string;
  ambassador?: boolean;
  didTheyReq?: boolean;
}

// Guest data shared by solo guests and group members
export type IGuestFormPayload = Omit<IGuestDetail, '_id' | 'guestId' | 'groupId' | 'groupType' | 'age' | 'visitedDate' | 'stayed' | 'nights'>;

export type ICardGuest = IGuestDetail | IBodyGuest;

export interface ITripDetail {
  visitedDate: string;
  stayed: boolean;
  nights: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
}

export interface IGroupDetail extends ITripDetail {
  groupId: string;
  groupType: 'couple' | 'friends' | 'family';
  members: IGroupMember[];
}

export type IGroupMemberPayload = IGuestFormPayload & {
  groupType: 'couple' | 'friends' | 'family';
};

export interface IGuestTableMemberCard {
  fullName: string;
  gender: 'female' | 'male' | 'trans';
  age: string | null;
  continent: string;

  hometown: {
    code?: string | null;
    city?: string | null;
    state?: string | null;
  };

  livingIn: {
    code?: string | null;
    city?: string | null;
    state?: string | null;
  };

  rating: number;

  whatsapp: string | null;
  prefixCode: string;
  urlProfileCs: string | null;
  ambassador: boolean;
  gift: string[];
  isFirstTime: boolean;
}

export type IGroupMember = IGuestDetail & {
  groupId: string;
};

export type IGroupEdit = IGroupMember[];

// Get All
export type IGuest = Omit<IGuestDetail, 'comments' | 'instagram' | 'occupation' | 'region' | 'stayed' | 'gift'>;

export type IGuestListItem = IGuestDetail | IGroupDetail;

// Ok Data Resp
interface IApiCsOkResp<T> {
  data: T;
  success: boolean;
  message: string;
}

export interface IApiCsPag {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IMonthlyStat {
  month: number;
  totalVisits: number;
  totalPeople: number;
}

export interface IYearlyStat {
  year: number;
  totalVisits: number;
  totalPeople: number;
  months: IMonthlyStat[];
}

export interface IGuestMonthGroup {
  month: number;
  monthName: string;
  totalPeople: number;
  totalVisits: number;
  guests: IGuestTableRow[];
}

export interface IGuestYearGroup {
  year: number;
  totalVisits: number;
  totalPeople: number;
  months: IGuestMonthGroup[];
}

// Error Data Resp
interface IApiCsErrResp {
  errors: string[];
  message: string;
  success: boolean;
}

export interface IQueryParamsGuests {
  limit?: number;
  page?: number;
  country?: string;
  from?: string;
  to?: string;
  groupType?: string;
  continent?: string;
  isFirstTime?: boolean;
  hangOut?: boolean;
  rating?: number;
  region?: string;
  ambassador?: boolean;
  didTheyReq?: boolean;
  gift?: boolean;
  gender?: 'female' | 'male' | 'trans';
  gay?: boolean;
  hometownState?: string;
  livingInState?: string;
  year?: number;
  day?: number;
  birthDate?: number;
}

// Get All
export type IGuestsResp = IApiCsOkResp<IGuestListItem[]> & {
  pagination: IApiCsPag;
  monthlyStats: IYearlyStat[];
};

// Get Guest By Id
export type IGuestDetailResp = IApiCsOkResp<IGuestDetail>;
// Get Group By Id
export type IGroupDetailResp = IApiCsOkResp<IGroupEdit>;
// Delete By Id
export type IGuestDeleteResp = IApiCsOkResp<IGuestDetail>;
// Post
export type IGuestCreateResp = IApiCsOkResp<IGuestDetail>;
// Post Body
export type IBodyGuest = IGuestDetail;

export type IDetailResp = IGuestDetail | IGroupDetail;

// Guest types
export type TGuestGroupType = 'solo' | 'couple' | 'friends' | 'family';

// Payload for creating a guest
export type IGuestCreatePayload = IGuestFormPayload & {
  groupType: 'solo';
};

// Payload for creating a group
export type IGroupCreatePayload = Omit<IGroupDetail, 'groupId' | 'members'> & {
  members: (IGuestFormPayload & {
    groupType: 'couple' | 'friends' | 'family';
  })[];
};

export interface IGroupUpdatePayload extends ITripDetail {
  groupId: string;
  groupType: 'couple' | 'friends' | 'family';
  members: IGroupMemberPayload[];
}
