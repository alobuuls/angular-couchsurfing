import { Injectable } from '@angular/core';
import { Sort } from '@angular/material/sort';

// Interfaces
import { IGuestTableRow, IGuestTableRowWithIndex } from '@interfaces/data-structure-api';

// Utils
import { compare } from '@helpers/sort.utils';

@Injectable({
  providedIn: 'root',
})
export class GuestSortService {
  sort(data: IGuestTableRowWithIndex[], sort: Sort): IGuestTableRowWithIndex[] {
    if (!sort.active || !sort.direction) return data;
    const isAsc = sort.direction === 'asc';

    return [...data].sort((a, b) => {
      if (sort.active === 'rating') return this.sortRating(a, b, isAsc);
      if (['continent', 'hometownCode', 'livingInCode'].includes(sort.active)) return this.sortLocation(a, b, sort.active, isAsc);
      return this.sortDefault(a, b, sort.active, isAsc);
    });
  }

  private sortRating(a: IGuestTableRowWithIndex, b: IGuestTableRowWithIndex, asc: boolean): number {
    const groupCompare = this.compareGroup(a, b);

    if (groupCompare !== 0) return groupCompare;

    const ratingA = this.getMinRating(a);
    const ratingB = this.getMinRating(b);
    return asc ? ratingA - ratingB : ratingB - ratingA;
  }

  private sortLocation(a: IGuestTableRowWithIndex, b: IGuestTableRowWithIndex, field: string, asc: boolean): number {
    const valueA = this.getSortValue(a, field, asc);
    const valueB = this.getSortValue(b, field, asc);

    const result = compare(valueA, valueB, asc);

    if (result !== 0) return result;
    return this.compareGroup(a, b);
  }

  private sortDefault(a: IGuestTableRowWithIndex, b: IGuestTableRowWithIndex, field: string, asc: boolean): number {
    const priorityA = this.getPriority(a, field, asc);
    const priorityB = this.getPriority(b, field, asc);

    if (priorityA !== priorityB) return priorityA - priorityB;

    const valueA = this.getSortValue(a, field, asc);
    const valueB = this.getSortValue(b, field, asc);

    return compare(valueA, valueB, asc);
  }

  private getPriority(guest: IGuestTableRow, field: string, asc: boolean): number {
    const isGroup = guest.people?.length > 1;

    if (field === 'gender') {
      const hasGender = (gender: string) => guest.people?.some(p => p.gender?.toLowerCase() === gender);

      if (asc) {
        if (hasGender('female') && !isGroup) {
          return 0;
        }

        if (hasGender('female') && isGroup) {
          return 1;
        }
      } else {
        if (hasGender('male') && !isGroup) {
          return 0;
        }

        if (hasGender('male') && isGroup) {
          return 1;
        }
      }

      return 2;
    }

    if (field === 'fullName') {
      const names =
        guest.people
          ?.map(p => p.fullName?.toLowerCase() ?? '')
          .filter(Boolean)
          .sort() ?? [];

      if (!names.length) return 2;
      return guest.people?.length === 1 ? 0 : 1;
    }

    if (field === 'birth_date') {
      const ages = guest.people?.map(p => Number(p.age)).filter(age => !isNaN(age)) ?? [];
      if (!ages.length) return 2;
      return guest.people?.length === 1 ? 0 : 1;
    }

    return 0;
  }

  private getSortValue(guest: IGuestTableRow, field: string, asc: boolean): any {
    const values =
      guest.people
        ?.map(person => this.personAccessors[field]?.(person))
        .filter(value => value !== undefined && value !== '')
        .sort() ?? [];

    if (values.length) {
      return asc ? values[0] : values[values.length - 1];
    }

    return this.sortAccessors[field]?.(guest) ?? guest[field as keyof IGuestTableRow];
  }

  private personAccessors: Record<string, (person: any) => any> = {
    fullName: p => p.fullName?.toLowerCase() ?? '',
    gender: p => p.gender?.toLowerCase() ?? '',
    continent: p => p.continent?.toLowerCase() ?? '',
    hometownCode: p => p.hometown?.code?.toLowerCase() ?? '',
    livingInCode: p => p.livingIn?.code?.toLowerCase() ?? '',
    rating: p => p.rating ?? 0,
  };

  private sortAccessors: Record<string, (guest: any) => any> = {
    nights: guest => guest.nights ?? 0,
    visitedDate: guest => new Date(guest.visitedDate ?? 0).getTime(),
    birth_date: guest => Math.min(...(guest.people?.map((p: any) => (p.age === '?' || p.age == null ? 999 : Number(p.age))) ?? [999])),
    hangOut: guest => (guest.people?.some((p: any) => p.hangOut) ? 1 : 0),
  };

  private getMinRating(guest: IGuestTableRowWithIndex): number {
    return Math.min(...(guest.people?.map(p => p.rating ?? 0) ?? [0]));
  }

  private compareGroup(a: IGuestTableRowWithIndex, b: IGuestTableRowWithIndex): number {
    const groupA = a.people?.length > 1 ? 1 : 0;
    const groupB = b.people?.length > 1 ? 1 : 0;
    return groupA - groupB;
  }
}
