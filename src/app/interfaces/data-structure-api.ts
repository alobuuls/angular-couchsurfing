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

export interface IGuestTableMember {
  fullName: string;
  gender: string;
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

export type IGuestTableRow = IGuestListItem & {
  people: {
    fullName: string;
    gender: string;
    age: string | null;
    continent: string;
    whatsapp: string | null;

    hometown: {
      code?: string | null;
      city?: string | null;
    };

    livingIn: {
      code?: string | null;
      city?: string | null;
    };

    hangOut: boolean;

    rating: number;
  }[];

  isHometownUnique: boolean;
  isHangOutUnique: boolean;
  isLivingInUnique: boolean;
  isContinentUnique: boolean;

  pageIndex?: number;
};

export type IGuestTableRowWithIndex = IGuestTableRow & {
  pageIndex: number;
};

export type IGuestsTableVM = Omit<GuestsVM, 'data'> & {
  data: IGuestTableRow[];
};

export type DataStatePag<T> = Pick<DataState<T>, 'data'> & IApiCsPag;
