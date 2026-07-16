export function compare(a: any, b: any, isAsc: boolean) {
    if (a == null) return isAsc ? -1 : 1;
    if (b == null) return isAsc ? 1 : -1;

    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
