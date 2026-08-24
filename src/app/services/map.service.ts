import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { IAdminRegionsGeoJson, IWorldGeoJson } from '../interfaces/map-interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly http = inject(HttpClient);

  private readonly endpointMapsGeoAllCountries = `${environment.endpointBaseCountryMap}/datasets/geo-countries/master/data/countries.geojson`;

  private readonly endpointAdminRegions = `${environment.endpointNaturalEarthAdmin1}/ne_10m_admin_1_states_provinces.geojson`;

  private worldMap$?: Observable<IWorldGeoJson>;
  private adminRegionsMap$?: Observable<IAdminRegionsGeoJson>;

  getWorldMap(): Observable<IWorldGeoJson> {
    if (!this.worldMap$) {
      this.worldMap$ = this.http.get<IWorldGeoJson>(this.endpointMapsGeoAllCountries).pipe(shareReplay(1));
    }

    return this.worldMap$;
  }

  getAdminRegionsMap(): Observable<IAdminRegionsGeoJson> {
    if (!this.adminRegionsMap$) {
      this.adminRegionsMap$ = this.http.get<IAdminRegionsGeoJson>(this.endpointAdminRegions).pipe(shareReplay(1));
    }

    return this.adminRegionsMap$;
  }
}
