import { TGuestGender } from '@interfaces/guests.interface';
export interface IGenderConfig {
  icon: string;
  color: string;
  labelKey: string;
}

// One config per gender: TypeScript warns if one is missing.
export type TGenderConfigMap = Record<TGuestGender, IGenderConfig>;

/** @deprecated Use TGuestGender from guests.interface. */
export type GuestGender = TGuestGender;
