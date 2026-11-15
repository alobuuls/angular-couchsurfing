//  Converts a string or Date into a valid Date object.
//  Returns null when the value is empty or invalid.
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  // Preserve the local date when the value is YYYY-MM-DD.
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      // Reject impossible dates such as 2026-02-31.
      if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
        return null;
      }
      return date;
    }
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
