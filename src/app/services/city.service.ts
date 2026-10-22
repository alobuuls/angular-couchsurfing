import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface IState {
  name: string;
  iso2: string;
}
export interface ICity {
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private enpoint: string = environment.endpointApiCities;
  private API_KEY: string = '0a6d63ebdae60ae9862a370ccd90cbce8ba7098aa5d5246568f0c2d3c402518f';

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
}
