import { CountriesCodes } from '@type/word.types';
import { Continents, Regions } from '@type/word.types';
import { ICity, IState } from '@services/city.service';

// Guest with all information
export interface IGuestDetail extends ITripDetail {
  _id: string;
  groupType: 'solo';
  birthDate: string;
  age: number;
  continent: Continents;
  hometownCode: CountriesCodes;
  hometown: string;
  livingInCode: CountriesCodes;
  hangOut: boolean;
  fullName: string;
  gender: 'female' | 'male' | 'trans';
  guestId: string;
  livingIn: string;
  nights: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  prefixCode: string;
  rating: 1 | 2 | 3 | 4 | 5;
  visitedDate: string;
  whatsapp: string;
  comments: string;
  instagram: string;
  occupation: string[];
  region: Regions;
  stayed: boolean;
  isFirstTime: boolean;
  gift: string[];
  urlProfileCs: string;
  isGay: false;
  theirReference: string | null;
  myReference: string | null;
  groupId?: string;
}

export interface IGuestFormData extends IGuestDetail {
  hometownState?: IState;
  hometownCity?: ICity;

  livingInState?: IState;
  livingInCity?: ICity;

  occupationArea?: string[];
}

export interface ITripDetail {
  visitedDate: string;
  stayed: boolean;
  nights: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
}

export interface IGroupDetail extends ITripDetail {
  groupId: string;
  groupType: 'couple' | 'friends' | 'family';
  members: IBodyGuest[];
}

export interface IGuestTableMemberCard {
  fullName: string;
  gender: 'female' | 'male' | 'trans';
  age: string | null;
  continent: string;

  hometown: {
    code?: string | null;
    city?: string | null;
  };

  livingIn: {
    code?: string | null;
    city?: string | null;
  };

  rating: number;

  whatsapp: string;
  prefixCode: string;
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

// Error Data Resp
interface IApiCsErrResp {
  errors: string[];
  message: string;
  success: boolean;
}

// Pagination Data
export interface IApiCsPag {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface IQueryParamsGuests {
  limit?: number;
  page?: number;
  country?: string;
  from?: string;
  to?: string;
  groupType?: 'solo' | 'family' | 'friends' | 'couple';
  continent?: Continents;
  isFirstTime?: boolean;
  rating?: number;
  region?: Regions;
}

export interface IGuestsFormSubmit {
  groupType: IGuestDetail['groupType'] | IGroupDetail['groupType'];
  trip: Omit<IGroupDetail, 'groupId' | 'members' | 'groupType'>;
  guests: IBodyGuest[];
}

// Get All
export type IGuestsResp = IApiCsOkResp<IGuestListItem[]> & IApiCsPag;
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

export type IGroupCreatePayload = Omit<IGroupDetail, 'groupId'>;
