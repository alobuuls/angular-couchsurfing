import { IApiCsPag, IGuest, IGuestListItem, IYearlyStat } from '@interfaces/guests.interface';

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
  monthlyStats?: IYearlyStat[];
}

export interface GuestsVM {
  status: ReqStatus;
  data: IGuest[];
  pagination?: IApiCsPag;
  monthlyStats?: IYearlyStat[];
  offset: number;
  error?: IErrResp;
}

interface IAge {
  ageWhenVisited: number | '?';
  currentAge: number | '?';
}

export interface IGuestTableMember {
  fullName: string;
  ambassador?: boolean;
  gender: 'female' | 'male' | 'trans';

  age: {
    ageWhenVisited: number | '?';
    currentAge: number | '?';
    birthDate: string;
  };

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

  guestId?: string;
  groupId?: string;

  whatsapp: string | null;
  prefixCode?: string;
  instagram?: string | null;
  gift: string[];
  couchsurfing?: string | null;
  isFirstTime: boolean;

  hangOut?: boolean;
}

export type IGuestTableRow = IGuestListItem & {
  people: IGuestTableMember[];
  isFirstTime?: boolean;

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

export type DataStatePag<T> = Pick<DataState<T>, 'data'> & {
  pagination: IApiCsPag;
  monthlyStats?: IYearlyStat[];
};

export type ICurrentView = 'table' | 'cards' | 'map';

export type ViewConfig = {
  next: ICurrentView;
  icon: string;
  tooltip: string;
};

export const VIEW_CONFIG: Record<ICurrentView, ViewConfig> = {
  table: {
    next: 'cards',
    icon: 'cards_stack',
    tooltip: 'GUESTS_VIEW.CHANGE_TO_CARDS',
  },
  cards: {
    next: 'map',
    icon: 'map',
    tooltip: 'GUESTS_VIEW.CHANGE_TO_MAP',
  },
  map: {
    next: 'table',
    icon: 'table',
    tooltip: 'GUESTS_VIEW.CHANGE_TO_TABLE',
  },
};
