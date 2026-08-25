import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private urlBase: string = environment.endpointUrlApiCs;

  constructor(private http: HttpClient) {}

  getGuestsStats(): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/guests/stats`);
  }

  getHostedStats(): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/hosted/stats`);
  }

  getPersonalStats(): Observable<any> {
    return this.http.get<any>(`${this.urlBase}/personal/stats`);
  }
}
