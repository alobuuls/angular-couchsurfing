import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// Interfaces
import { IGroupDetail, IGroupDetailResp, IGuestCreateResp, IGuestDeleteResp } from '@interfaces/couchsurfing.interface';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private urlBaseApi: string = `${environment.endpointUrlApiCs}/groups`;

  constructor(private http: HttpClient) {}

  getGroupById(groupId: string): Observable<IGroupDetailResp> {
    return this.http.get<IGroupDetailResp>(`${this.urlBaseApi}/${groupId}`);
  }

  createNewGroup(payload: IGroupDetail): Observable<IGuestCreateResp> {
    return this.http.post<IGuestCreateResp>(this.urlBaseApi, payload);
  }

  updateGroupById(guestId: string, group: IGroupDetail): Observable<IGuestCreateResp> {
    return this.http.put<IGuestCreateResp>(`${this.urlBaseApi}/guests/${guestId}`, group);
  }

  removeGroupById(groupId: string): Observable<IGuestDeleteResp> {
    return this.http.delete<IGuestDeleteResp>(`${this.urlBaseApi}/${groupId}`);
  }
}
