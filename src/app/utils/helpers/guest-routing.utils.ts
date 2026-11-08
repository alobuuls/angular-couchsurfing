import { IGuestListItem } from '@interfaces/guests.interface';
import { isGroup } from '@utils';

// Get guest/group detail route
export const getGuestDetailRoute = (guest: IGuestListItem): string[] => {
  if (isGroup(guest)) return ['/guests/groups', guest.groupId];
  return ['/guests', guest.guestId];
};

//  Parse comma-separated query parameters into an array.
export const parseMultiParam = (value: string | null | undefined): string[] => {
  return value ? value.split(',').filter(Boolean) : [];
};

//  Parse boolean query parameters
export const parseBooleanParam = (value: string | null | undefined): boolean | undefined => {
  if (value === null || value === undefined) return undefined;
  return value === 'true';
};
