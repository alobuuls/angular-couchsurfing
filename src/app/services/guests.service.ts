import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IBodyGuest, IGuestCreateResp, IGuestDeleteResp, IGuestDetailResp, IGuestsResp } from '@interfaces/couchsurfing.interface';

@Injectable({
  providedIn: 'root',
})
export class GuestsService {
  private urlBaseApi: string = `${environment.endpointUrlApiCs}`;

  constructor(private http: HttpClient) {}

  getAllGuests({
    limit = 10,
    page = 1,
  }: {
    limit?: number;
    page?: number;
  } = {}): Observable<IGuestsResp> {
    const params = new HttpParams().set('limit', String(limit)).set('page', String(page));

    return this.http.get<IGuestsResp>(`${this.urlBaseApi}/guests`, { params });
  }

  createNewGuest(payload: IBodyGuest): Observable<IGuestCreateResp> {
    return this.http.post<IGuestCreateResp>(`${this.urlBaseApi}/guests`, payload);
  }

  getGuestById(guestId: string): Observable<IGuestDetailResp> {
    return this.http.get<IGuestDetailResp>(`${this.urlBaseApi}/guests/${guestId}`);
  }

  updateGuestById(guestId: string, guest: IBodyGuest): Observable<IGuestCreateResp> {
    return this.http.put<IGuestCreateResp>(`${this.urlBaseApi}/guests/${guestId}`, guest);
  }

  removeGuestById(guestId: string): Observable<IGuestDeleteResp> {
    return this.http.delete<IGuestDeleteResp>(`${this.urlBaseApi}/guests/${guestId}`);
  }
}
