import { IApiCsPag, IGuest, IGuestListItem } from '@interfaces/couchsurfing.interface';

export interface IErrResp {
  message: string;
  status?: number;
}

export type ReqStatus = 'loading' | 'success' | 'error';

export interface DataState<T> {
  status: ReqStatus;
  data: T;
  error?: IErrResp;
  pagination?: IApiCsPag;
}

export interface GuestsVM {
  status: ReqStatus;
  data: IGuest[];
  pagination?: IApiCsPag;
  offset: number;
  error?: IErrResp;
}


export type IGuestTableRow = IGuestListItem & {
  fullNames: string[];
  genders: string[];
  ages: (string | null)[];
  continents: string[];

  hometowns: { code?: string | null; city?: string | null }[];
  livingIns: { code?: string | null; city?: string | null }[];

  isHometownUnique: boolean;
  isLivingInUnique: boolean;

  ratings: number[];
  isRatingUnique: boolean;

  pageIndex?: number;
};

export type IGuestsTableVM = Omit<GuestsVM, 'data'> & {
  data: IGuestTableRow[];
};

export type DataStatePag<T> = Pick<DataState<T>, 'data'> & IApiCsPag;
