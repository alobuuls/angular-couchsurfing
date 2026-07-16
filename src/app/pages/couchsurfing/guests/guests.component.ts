import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { combineLatestWith, map, switchMap } from 'rxjs/operators';

// Material
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Services
import { GuestsService } from '@services/guests.service';
import { ErrorHandlerService } from '@services/err-handler.service';

// Helpers
import { withReqState } from 'src/app/utils/operators/with-state-operator';
import { mapGuestTable } from 'src/app/utils/mappers/guest-table.mapper';

// Interfaces
import { IGuestsTableVM, IGuestTableRow } from '@interfaces/data-structure-api';

// Libraries
import { compare } from 'src/app/utils/helpers/sort.utils';

@Component({
  selector: 'guests',
  templateUrl: './guests.component.html',
  styleUrls: ['./guests.component.css'],
})
export class GuestsComponent implements OnInit {
  vm$!: Observable<IGuestsTableVM>;

  private page$ = new BehaviorSubject<{ page: number; size: number }>({
    page: 1,
    size: 10,
  });

  private sort$ = new BehaviorSubject<Sort>({ active: '', direction: '' });

  constructor(
    private _guests: GuestsService,
    private _errH: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.buildVm();
  }

  private buildVm(): Observable<IGuestsTableVM> {
    return (this.vm$ = this.page$.pipe(
      map(value => {
        return value;
      }),

      switchMap(({ page, size }) => withReqState(this._guests.getAllGuests({ limit: size, page }), this._errH)),

      map(vm => {
        if (vm.status !== 'success') {
          return {
            ...vm,
            offset: this.getOffset(),
            data: [] as IGuestTableRow[],
          };
        }

        const enriched = mapGuestTable(vm.data);

        return {
          ...vm,
          data: enriched,
          offset: this.getOffset(),
        };
      }),

      combineLatestWith(this.sort$),

      map(([vm, sort]) => {
        if (vm.status !== 'success') return vm;

        let data = [...vm.data].map((item, index) => ({
          ...item,
          pageIndex: index,
        }));

        if (sort.active && sort.direction) {
          const isAsc = sort.direction === 'asc';
          const accessor = this.sortAccessors[sort.active] ?? ((g: any) => g?.[sort.active]);

          data.sort((a, b) => compare(accessor(a), accessor(b), isAsc));
        }

        return {
          ...vm,
          data,
          offset: this.getOffset(),
        };
      })
    ));
  }

  // 🔥 SORT INTELIGENTE (respeta backend + alterna después)
  onSortChange(sort: Sort) {
    const current = this.sort$.value;

    // 🔥 PRIMER CLICK tras carga backend → invertimos dirección sin romper UX
    if (!current.active) {
      this.sort$.next({
        active: sort.active,
        direction: 'asc', // o 'desc' si quieres invertir por defecto
      });
      return;
    }

    if (current.active === sort.active) {
      if (current.direction === 'asc') {
        this.sort$.next({ active: sort.active, direction: 'desc' });
      } else if (current.direction === 'desc') {
        this.sort$.next({ active: '', direction: '' });
      } else {
        this.sort$.next({ active: sort.active, direction: 'asc' });
      }
    } else {
      this.sort$.next({ active: sort.active, direction: 'asc' });
    }
  }

  onPageChange(event: PageEvent) {
    this.page$.next({
      page: event.pageIndex + 1,
      size: event.pageSize,
    });
  }

  private sortAccessors: Record<string, (guest: any) => any> = {
    fullName: g => (g.fullNames?.[0] ?? '').toLowerCase(),
    rating: g => g.ratings?.[0] ?? 0,
    nights: g => g.nights ?? 0,
    gender: g => (g.genders?.[0] ?? '').toLowerCase(),
    continent: g => (g.continents?.[0] ?? '').toLowerCase(),
    // ✅ SOLO POR CODE (GRUPO -> primer miembro)
    hometownCode: g => (g.hometowns?.[0]?.code ?? '').toLowerCase(),
    livingInCode: g => (g.livingIns?.[0]?.code ?? '').toLowerCase(),
    visitedDate: g => new Date(g.visitedDate ?? 0).getTime(),
    birth_date: g => {
      const age = g.ages?.[0];
      return age === '?' || age == null ? -1 : Number(age);
    },
  };

  private getOffset(): number {
    const { page, size } = this.page$.value;
    return (page - 1) * size;
  }
}
