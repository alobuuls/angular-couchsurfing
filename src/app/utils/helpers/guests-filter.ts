import type { TGroupFilter, TGroupFilterQuery } from '@interfaces/guests.interface';

export const GROUP_FILTERS = ['solo', 'couple', 'friends', 'family', 'all-groups'] as const satisfies readonly TGroupFilter[];

export const isGroupFilter = (value: unknown): value is TGroupFilter => (GROUP_FILTERS as readonly unknown[]).includes(value);

// Keeps only the valid values and joins them. Returns undefined when there is none.
export const toGroupFilterQuery = (values: readonly string[] | null | undefined): TGroupFilterQuery | undefined => {
  const valid = (values ?? []).filter(isGroupFilter);
  return valid.length ? (valid.join(',') as TGroupFilterQuery) : undefined;
};
