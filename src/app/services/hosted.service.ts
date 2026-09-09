import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IBodyGuest, IGuestCreateResp, IGuestDeleteResp, IGuestDetailResp, IGuestsResp } from '@interfaces/guests.interface';
import { Continents } from '@type/word.types';

export interface IQueryParamsGuests {
  limit?: number;
  page?: number;
  country?: string;
  from?: string;
  to?: string;
  groupType?: 'solo' | 'family' | 'friends' | 'couple';
  continent?: Continents;
  isFirstTime?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HostedService {
  private urlGuests: string = `${environment.endpointUrlApiCs}/hosted`;

  constructor(private http: HttpClient) {}

  getAllGuests({ limit = 10, page = 1, country, from, to, groupType, continent, isFirstTime }: IQueryParamsGuests): Observable<IGuestsResp> {
    let params = new HttpParams().set('limit', String(limit)).set('page', String(page));
    if (country) params = params.set('country', String(country));
    if (from) params = params.set('from', String(from));
    if (to) params = params.set('to', String(to));
    if (groupType) params = params.set('groupType', String(groupType));
    if (continent) params = params.set('continent', String(continent));
    if (isFirstTime !== undefined) params = params.set('isFirstTime', String(isFirstTime));
    return this.http.get<IGuestsResp>(this.urlGuests, { params });
  }

  createNewGuest(payload: IBodyGuest): Observable<IGuestCreateResp> {
    return this.http.post<IGuestCreateResp>(this.urlGuests, payload);
  }

  getGuestById(guestId: string): Observable<IGuestDetailResp> {
    return this.http.get<IGuestDetailResp>(`${this.urlGuests}/${guestId}`);
  }

  updateGuestById(guestId: string, guest: IBodyGuest): Observable<IGuestCreateResp> {
    return this.http.put<IGuestCreateResp>(`${this.urlGuests}/${guestId}`, guest);
  }

  removeGuestById(guestId: string): Observable<IGuestDeleteResp> {
    return this.http.delete<IGuestDeleteResp>(`${this.urlGuests}/${guestId}`);
  }
}
