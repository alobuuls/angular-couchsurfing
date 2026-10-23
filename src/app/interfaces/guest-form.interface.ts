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

export interface IState {
  name: string;
  iso2: string;
}
export interface ICity {
  name: string;
}
