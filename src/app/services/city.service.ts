import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IState, ICity } from '@interfaces/guest-form.interface';

// Config
import { WORLD } from '@config/world';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private enpoint: string = environment.endpointApiCities;
  private API_KEY: string = environment.apiKeyCities;

  constructor(private http: HttpClient) {}

  private get headers() {
    return new HttpHeaders({
      'X-CSCAPI-KEY': this.API_KEY,
    });
  }

  getStates(countryCode: string): Observable<IState[]> {
    return this.http.get<IState[]>(`${this.enpoint}/countries/${countryCode}/states`, { headers: this.headers });
  }

  getCities(countryCode: string, stateCode: string): Observable<ICity[]> {
    return this.http.get<ICity[]>(`${this.enpoint}/countries/${countryCode}/states/${stateCode}/cities`, { headers: this.headers });
  }

  /**
   * Convierte el código del país al código que espera la API
   * de estados y ciudades.
   */
  getApiCountryCode(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    const normalizedCode = countryCode.trim().toLowerCase();
    const country = WORLD[normalizedCode as keyof typeof WORLD];
    return country?.flag ?? null;
  }

  /**
   * Normaliza nombres de ubicaciones para compararlos
   * sin distinguir mayúsculas, minúsculas ni acentos.
   */
  normalizeLocation(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
