export interface IWorldGeoJson {
  type: string;
  features: ICountryFeature[];
}

export interface ICountryFeature {
  type: string;
  properties: {
    name: string;
    'ISO3166-1-Alpha-3': string;
    'ISO3166-1-Alpha-2': string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface IAdminRegionsGeoJson {
  type: 'FeatureCollection';
  features: IAdminRegionsFeature[];
}

export interface IAdminRegionsFeature {
  type: 'Feature';

  properties: {
    name: string;
    geonunit?: string;
    gu_a3?: string;
    adm0_a3?: string;
    iso_3166_2?: string;
    admin?: string;
  };

  geometry: {
    type: string;
    coordinates: any;
  };
}
