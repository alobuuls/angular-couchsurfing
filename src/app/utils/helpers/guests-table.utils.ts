import { IGroupDetail, IGuestListItem } from '@interfaces/couchsurfing.interface';

export function isGroup(guest: IGuestListItem): guest is IGroupDetail {
  return 'members' in guest;
}

export function collapseIfSame<T>(items: T[], getValue: (item: T) => any): any[] {
  if (!items || items.length === 0) return [];

  const values = items.map(getValue);
  const first = values[0];

  const allEqual = values.every(v => v === first);

  return allEqual ? [first] : values;
}

export function getAge(birthDate?: string): number | '?' {
  if (!birthDate) return '?';

  const year = new Date(birthDate).getFullYear();
  if (!year) return '?';

  return new Date().getFullYear() - year;
}
