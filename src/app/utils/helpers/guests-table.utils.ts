import { IGroupDetail, IGuestListItem } from '@interfaces/guests.interface';

export const isGroup = (guest: IGuestListItem): guest is IGroupDetail => {
  return 'members' in guest;
};

export const collapseIfSame = <T>(items: T[], getValue: (item: T) => any): any[] => {
  if (!items || items.length === 0) return [];
  const values = items.map(getValue);
  const first = values[0];
  const allEqual = values.every(v => v === first);
  return allEqual ? [first] : values;
};

export const getAge = (birthDate?: string): number | '?' => {
  if (!birthDate) return '?';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
