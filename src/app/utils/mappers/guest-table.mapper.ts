import { IGuestListItem } from '@interfaces/guests.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { getAges, isGroup } from '@helpers/guests-table.utils';

export const mapGuestTable = (guests: IGuestListItem[]): IGuestTableRow[] => {
  return guests.map(guest => {
    if (isGroup(guest)) {
      const members = guest.members;
      const hometownObjects = members.map(m => ({ code: m.hometownCode, city: m.hometown }));
      const livingObjects = members.map(m => ({ code: m.livingInCode, city: m.livingIn }));

      return {
        ...guest,

        hometowns: hometownObjects,
        livingIns: livingObjects,

        continent: members.map(m => m.continent),

        people: members.map(m => ({
          fullName: m.fullName,
          guestId: m.guestId,
          gender: m.gender,
          age: getAges(guest.visitedDate, m.birthDate),
          continent: m.continent,
          whatsapp: m.prefixCode == null || m.whatsapp == null ? null : m.prefixCode + m.whatsapp,

          couchsurfing: m.urlProfileCs ?? null,

          hometown: {
            code: m.hometownCode,
            city: m.hometown ?? 'Unknown City',
          },

          livingIn: {
            code: m.livingInCode,
            city: m.livingIn ?? 'Unknown City',
          },

          hangOut: m.hangOut,
          groupId: guest.groupId,

          rating: m.rating ?? 0,
        })),

        isHangOutUnique: new Set(members.map(m => m.hangOut)).size === 1,
        isHometownUnique: new Set(members.map(m => `${m.hometownCode}-${m.hometown}`)).size === 1,
        isLivingInUnique: new Set(members.map(m => `${m.livingInCode}-${m.livingIn}`)).size === 1,
        isContinentUnique: new Set(members.map(m => m.continent)).size === 1,
      } as IGuestTableRow;
    }

    return {
      ...guest,

      people: [
        {
          guestId: guest.guestId,
          groupId: guest.groupId,
          fullName: guest.fullName,
          gender: guest.gender,
          age: getAges(guest.visitedDate, guest.birthDate),
          continent: guest.continent,
          whatsapp: guest.prefixCode == null || guest.whatsapp == null ? null : guest.prefixCode + guest.whatsapp,
          couchsurfing: guest.urlProfileCs ?? null,
          hometown: {
            code: guest.hometownCode,
            city: guest.hometown ?? 'Unknown City',
          },

          livingIn: {
            code: guest.livingInCode,
            city: guest.livingIn ?? 'Unknown City',
          },

          hangOut: guest.hangOut,

          rating: guest.rating ?? 0,
        },
      ],

      isHometownUnique: true,
      isLivingInUnique: true,
      isContinentUnique: true,
      isHangOutUnique: true,
    } as IGuestTableRow;
  });
};
