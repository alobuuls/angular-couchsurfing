export function compare(a: string | number | null | undefined, b: string | number | null | undefined, isAsc: boolean): number {
  if (a == null) return isAsc ? -1 : 1;
  if (b == null) return isAsc ? 1 : -1;

  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
