//  Converts a string or Date into a valid Date object.
//  Returns null when the value is empty or invalid.
export const parseDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;

  // Preserve the local date when the value is YYYY-MM-DD.
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      // Reject impossible dates such as 2026-02-31.
      if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
      return date;
    }
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// BIRTHDATE FORMAT
export const hasCompleteBirthDate = (birthDate?: string | null): boolean => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;

  const [year, month, day] = birthDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const getBirthYear = (birthDate?: string | null): number | null => {
  if (!birthDate) return null;

  const match = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/.exec(birthDate);

  if (!match) return null;

  const year = Number(match[1]);

  if (year > new Date().getFullYear()) return null;

  // Validate the complete date when day precision is available.
  if (match[3] && !hasCompleteBirthDate(birthDate)) return null;

  return year;
};

export const getApproximateAge = (birthDate?: string | null): number | null => {
  const birthYear = getBirthYear(birthDate);

  return birthYear !== null ? new Date().getFullYear() - birthYear : null;
};
