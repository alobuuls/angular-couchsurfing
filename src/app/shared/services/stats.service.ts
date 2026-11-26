import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IGuestsStatsResp } from '@interfaces/stats-interface';

@Injectable()
export class StatsService {
  private urlBase: string = environment.endpointUrlApiCs;

  constructor(private http: HttpClient) {}

  getGuestsStats(): Observable<IGuestsStatsResp> {
    return this.http.get<IGuestsStatsResp>(`${this.urlBase}/guests/stats`);
  }
}
