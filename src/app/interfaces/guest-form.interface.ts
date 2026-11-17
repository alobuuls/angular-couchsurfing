import { Continents, Regions } from '../types/word.types';
import { IGroupDetail, IGuestDetail, IGuestFormPayload, ITripDetail } from './guests.interface';

export interface LocationConfig {
  countryControl: string;
  stateControl: string;
  cityControl: string;
  getStates: () => IState[];
  setStates: (states: IState[]) => void;
  setCities: (cities: ICity[]) => void;
  setLoadingStates: (loading: boolean) => void;
  setLoadingCities: (loading: boolean) => void;
}

export interface IContinentRegionGroup {
  continent: Continents;
  regions: Regions[];
}

export interface IState {
  name: string;
  iso2: string;
}

export interface ICity {
  name: string;
}

export interface IGuestFormItem {
  id: number;
  guest?: IGuestDetail;
}

export interface IGuestsFormSubmit {
  groupType: IGroupDetail['groupType'] | 'solo';
  trip: ITripDetail;
  guests: IGuestFormPayload[];
}

export interface IGuestsFormDraft {
  groupType: 'solo' | 'couple' | 'friends' | 'family';
  trip: Record<string, any>;
  guests: Record<string, any>[];
}
