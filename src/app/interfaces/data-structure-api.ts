export interface IErrResp {
  message: string;
  status?: number;
}

export type DataState<T> = { status: 'loading'; data: null; error: null } | { status: 'success'; data: T; error: null } | { status: 'error'; data: null; error: IErrResp };
