import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, defer, throwError } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IState, ICity } from '@interfaces/guest-form.interface';

// Config
import { WORLD } from '@config/world';

@Injectable()
export class CityService {
  private endpoint: string = environment.endpointApiCities;
  private apiKeys: string[] = environment.apiKeysCities.filter((key): key is string => !!key);

  private currentKeyIndex = 0;

  private http = inject(HttpClient);

  //  Builds the request headers with the provided API key.

  private getHeaders(apiKey: string): HttpHeaders {
    return new HttpHeaders({
      'X-CSCAPI-KEY': apiKey,
    });
  }

  // Retrieves the states of a country.

  getStates(countryCode: string): Observable<IState[]> {
    return this.request<IState[]>(`${this.endpoint}/countries/${countryCode}/states`);
  }

  // Retrieves the cities of a state.

  getCities(countryCode: string, stateCode: string): Observable<ICity[]> {
    return this.request<ICity[]>(`${this.endpoint}/countries/${countryCode}/states/${stateCode}/cities`);
  }

  // Executes the request and rotates API keys when a 429 error occurs.
  // Stops retrying once all available keys have been exhausted.

  private request<T>(url: string): Observable<T> {
    return defer(() => {
      if (!this.apiKeys.length) {
        return throwError(() => new Error('No API keys configured'));
      }

      const attemptedKeys = new Set<number>();
      const makeRequest = (): Observable<T> => {
        const keyIndex = this.currentKeyIndex;

        if (attemptedKeys.has(keyIndex)) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 429,
                statusText: 'All API keys exhausted',
              })
          );
        }

        attemptedKeys.add(keyIndex);

        return this.http
          .get<T>(url, {
            headers: this.getHeaders(this.apiKeys[keyIndex]),
          })
          .pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status !== 429) return throwError(() => error);

              if (attemptedKeys.size >= this.apiKeys.length) return throwError(() => error);

              this.currentKeyIndex = (keyIndex + 1) % this.apiKeys.length;

              return makeRequest();
            })
          );
      };
      return makeRequest();
    });
  }

  // Converts the country code to the format required by the API.
  getApiCountryCode(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    const normalizedCode = countryCode.trim().toLowerCase();
    const country = WORLD[normalizedCode as keyof typeof WORLD];
    return country?.flag ?? null;
  }

  // Normalizes location names for comparison, ignoring case and accent differences.
  normalizeLocation(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  // Checks whether the error is caused by the API rate limit.
  isRateLimitError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 429;
  }
}
