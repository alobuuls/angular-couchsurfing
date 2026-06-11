import { Observable, of } from 'rxjs';
import { map, startWith, catchError } from 'rxjs/operators';

// Interfaces
import { DataState, IErrResp } from '@interfaces/data-structure-api';

export const withReqState = <T>(obs$: Observable<T>, errH?: { handle: (err: unknown) => IErrResp }): Observable<DataState<T>> => {
  return obs$.pipe(
    map(res => successState<T>(res)),
    catchError(err => of(errorState<T>(errH ? errH.handle(err) : normalizeError(err)))),
    startWith(loadingState<T>())
  );
};

/* --- FACTORIES --- */
const successState = <T>(data: T): DataState<T> => ({
  status: 'success',
  data,
  error: null,
});

const loadingState = <T>(): DataState<T> => ({
  status: 'loading',
  data: null,
  error: null,
});

const errorState = <T>(error: IErrResp): DataState<T> => ({
  status: 'error',
  data: null,
  error,
});

// --- ERROR NORMALIZER ---
const normalizeError = (err: unknown): IErrResp => {
  if (err && typeof err === 'object' && 'message' in err) {
    return { message: (err as any).message, status: (err as any).status };
  }
  return { message: 'Unknown error' };
};
