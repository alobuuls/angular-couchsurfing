import { Observable, of } from 'rxjs';
import { map, startWith, catchError } from 'rxjs/operators';

// Interfaces
import { DataState, DataStatePag, IErrResp } from '@interfaces/data-structure-api';

export const withReqState = <T>(obs$: Observable<DataStatePag<T>>, errH?: { handle: (err: unknown) => IErrResp }): Observable<DataState<T>> => {
  return obs$.pipe(
    map(res => successState(res)),
    startWith<DataState<T>>(loadingState<T>()),
    catchError(err => of<DataState<T>>(errorState(errH ? errH.handle(err) : normalizeError(err))))
  );
};

export const withReqStateSimple = <T>(obs$: Observable<{ data: T }>, errH?: { handle: (err: unknown) => IErrResp }): Observable<DataState<T>> => {
  return obs$.pipe(
    map(res => ({
      status: 'success',
      data: res.data,
    }as DataState<T>)),
    startWith<DataState<T>>(loadingState<T>()),
    catchError(err => of<DataState<T>>(errorState(errH ? errH.handle(err) : normalizeError(err))))
  );
};

/* --- FACTORIES --- */
const successState = <T>(res: DataStatePag<T>): DataState<T> => ({
  status: 'success',
  data: res.data,
  pagination: {
    limit: res.limit,
    page: res.page,
    total: res.total,
    hasNextPage: res.hasNextPage,
    hasPrevPage: res.hasPrevPage,
    totalPages: res.totalPages,
  },
});

const loadingState = <T>(): DataState<T> => ({
  status: 'loading',
  data: [] as unknown as T,
});

const errorState = <T>(error: IErrResp): DataState<T> => ({
  status: 'error',
  data: [] as unknown as T,
  error,
});

// --- ERROR NORMALIZER ---
const normalizeError = (err: unknown): IErrResp => {
  if (err && typeof err === 'object') {
    const error = err as {
      message?: string;
      status?: number;
    };

    return {
      message: error.message ?? 'Unknown error',
      status: error.status,
    };
  }

  return { message: 'Unknown error' };
};
