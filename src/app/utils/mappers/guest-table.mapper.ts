import { IGuestListItem } from '@interfaces/couchsurfing.interface';
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { collapseIfSame, getAge, isGroup } from '../helpers/guests-table.utils';

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

      const isHometownUnique = new Set(hometownObjects.map(x => `${x.code}-${x.city}`)).size === 1;

      const isLivingInUnique = new Set(livingObjects.map(x => `${x.code}-${x.city}`)).size === 1;

      const isRatingUnique = members ? new Set(members.map(m => m.rating ?? 0)).size === 1 : true;

      return {
        ...guest,

        hometowns: hometownObjects,
        livingIns: livingObjects,

        isHometownUnique,
        isLivingInUnique,

        ratings: members.map(m => m.rating ?? 0),

        isRatingUnique,

        fullNames: collapseIfSame(members, m => m.fullName),

        genders: collapseIfSame(members, m => m.gender),

        ages: members.map(m => (m.birthDate ? getAge(m.birthDate) : '?')),

        continents: collapseIfSame(members, m => m.continent),
      } as IGuestTableRow;
    }

    const hometownObjects = [
      {
        code: guest.hometownCode,
        city: guest.hometown,
      },
    ];

    const livingObjects = [
      {
        code: guest.livingInCode,
        city: guest.livingIn,
      },
    ];

    const isHometownUnique = true;
    const isLivingInUnique = true;
    const isRatingUnique = true;

    return {
      ...guest,

      hometowns: hometownObjects,
      livingIns: livingObjects,

      isHometownUnique,
      isLivingInUnique,

      ratings: [guest.rating],
      isRatingUnique,

      fullNames: [guest.fullName],
      genders: [guest.gender],
      ages: [getAge(guest.birthDate)],
      continents: [guest.continent],
    } as IGuestTableRow;
  });
}
