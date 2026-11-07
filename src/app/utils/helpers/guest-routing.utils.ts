import { IGuestListItem } from '@interfaces/guests.interface';
import { isGroup } from './guests-table.utils';

// Get guest/group detail route
export function getGuestDetailRoute(guest: IGuestListItem): string[] {
  if (isGroup(guest)) {
    return ['/guests/groups', guest.groupId];
  }

  return ['/guests', guest.guestId];
}
