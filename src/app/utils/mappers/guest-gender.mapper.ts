import { GuestGender, IGenderConfig } from '../../interfaces/map.interface';

export const GUEST_GENDER_CONFIG: Record<GuestGender, IGenderConfig> = {
  female: {
    icon: 'female',
    color: 'var(--color-female)',
    labelKey: 'GENERAL.FEMALE',
  },
  male: {
    icon: 'male',
    color: 'var(--color-male)',
    labelKey: 'GENERAL.MALE',
  },
  trans: {
    icon: 'transgender',
    color: 'var(--color-trans)',
    labelKey: 'GENERAL.TRANS',
  },
};
