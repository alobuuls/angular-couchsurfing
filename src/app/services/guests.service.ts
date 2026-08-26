import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IBodyGuest, IGroupDetail, IGroupDetailResp, IGuestCreateResp, IGuestDeleteResp, IGuestDetailResp, IGuestsResp, IQueryParamsGuests } from '@interfaces/guests.interface';
@Injectable({
  providedIn: 'root',
})
export class GuestsService {
  private urlGuests: string = `${environment.endpointUrlApiCs}/guests`;
  private urlGuestsGroups: string = `${environment.endpointUrlApiCs}/groups`;

  constructor(private http: HttpClient) {}

  getAllGuests({
    limit = 10,
    page = 1,
    country,
    from,
    to,
    groupType,
    continent,
    isFirstTime,
    rating,
    region,
    ambassador,
    didTheyReq,
  }: IQueryParamsGuests): Observable<IGuestsResp> {
    let params = new HttpParams().set('limit', String(limit)).set('page', String(page));
    if (country) params = params.set('country', String(country));
    if (from) params = params.set('from', String(from));
    if (to) params = params.set('to', String(to));
    if (groupType) params = params.set('groupType', String(groupType));
    if (continent) params = params.set('continent', String(continent));
    if (isFirstTime !== undefined) params = params.set('isFirstTime', String(isFirstTime));
    if (rating !== undefined) params = params.set('rating', String(rating));
    if (region !== undefined) params = params.set('region', String(region));
    if (ambassador !== undefined) params = params.set('ambassador', String(ambassador));
    if (didTheyReq !== undefined) params = params.set('didTheyReq', String(didTheyReq));
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

  // GROUPS
  getGroupById(groupId: string): Observable<IGroupDetailResp> {
    return this.http.get<IGroupDetailResp>(`${this.urlGuestsGroups}/${groupId}`);
  }

  createNewGroup(payload: IGroupDetail): Observable<IGuestCreateResp> {
    return this.http.post<IGuestCreateResp>(this.urlGuestsGroups, payload);
  }

  updateGroupById(guestId: string, group: IGroupDetail): Observable<IGuestCreateResp> {
    return this.http.put<IGuestCreateResp>(`${this.urlGuestsGroups}/guests/${guestId}`, group);
  }

  removeGroupById(groupId: string): Observable<IGuestDeleteResp> {
    return this.http.delete<IGuestDeleteResp>(`${this.urlGuestsGroups}/${groupId}`);
  }
}
