import { IGroupDetail, IGuestListItem } from '@interfaces/guests.interface';

export const isGroup = (guest: IGuestListItem): guest is IGroupDetail => {
  return 'members' in guest;
};

export const collapseIfSame = <T, R>(items: T[], getValue: (item: T) => R): R[] => {
  if (!items || items.length === 0) return [];
  const values = items.map(getValue);
  const first = values[0];
  const allEqual = values.every(v => v === first);
  return allEqual ? [first] : values;
};

const parseBirthDate = (dateString: string): Date => {
  const [year, month = 1, day = 1] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const parseDate = (dateString: string): Date => {
  const [year, month = 1, day = 1] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getAges = (visitedDate: string, birthDate?: string | null): { ageWhenVisited: number | '?'; currentAge: number | '?'; birthDate: string } => {
  if (!visitedDate || !birthDate) {
    return {
      ageWhenVisited: '?',
      currentAge: '?',
      birthDate: '?',
    };
  }

  const birth = parseBirthDate(birthDate);
  const visited = parseDate(visitedDate);
  const today = new Date();

  const calculateAge = (date: Date): number => {
    let age = date.getFullYear() - birth.getFullYear();
    const birthdayHasNotHappened = date.getMonth() < birth.getMonth() || (date.getMonth() === birth.getMonth() && date.getDate() < birth.getDate());
    if (birthdayHasNotHappened) age--;
    return age;
  };

  return {
    currentAge: calculateAge(today),
    ageWhenVisited: calculateAge(visited),
    birthDate,
  };
};
