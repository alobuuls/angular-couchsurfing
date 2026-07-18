import { IGuestListItem } from '@interfaces/couchsurfing.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { getAge, isGroup } from '../helpers/guests-table.utils';

export function mapGuestTable(guests: IGuestListItem[]): IGuestTableRow[] {
  return guests.map(guest => {
    if (isGroup(guest)) {
      const members = guest.members;

      const hometownObjects = members.map(m => ({
        code: m.hometownCode,
        city: m.hometown,
      }));

      const livingObjects = members.map(m => ({
        code: m.livingInCode,
        city: m.livingIn,
      }));

      return {
        ...guest,

        hometowns: hometownObjects,
        livingIns: livingObjects,

        continent: members.map(m => m.continent),

        people: members.map(m => ({
          fullName: m.fullName,
          gender: m.gender,
          age: getAge(m.birthDate),
          continent: m.continent,
          whatsapp: m.prefixCode == null || m.whatsapp == null ? null : m.prefixCode + m.whatsapp,

          couchsurfing: m.urlProfileCs ?? null,

          hometown: {
            code: m.hometownCode,
            city: m.hometown,
          },

          livingIn: {
            code: m.livingInCode,
            city: m.livingIn,
          },

          hangOut: m.hangOut,

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
          fullName: guest.fullName,
          gender: guest.gender,
          age: getAge(guest.birthDate),
          continent: guest.continent,
          whatsapp: guest.prefixCode == null || guest.whatsapp == null ? null : guest.prefixCode + guest.whatsapp,
          couchsurfing: guest.urlProfileCs ?? null,
          hometown: {
            code: guest.hometownCode,
            city: guest.hometown,
          },

          livingIn: {
            code: guest.livingInCode,
            city: guest.livingIn,
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
}
