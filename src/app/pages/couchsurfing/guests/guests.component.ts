import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { combineLatestWith, map, switchMap } from 'rxjs/operators';

// Material
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Services
import { GuestsService } from '@services/guests.service';
import { GuestDeleteService } from '@services/guest-delete.service';
import { ErrorHandlerService } from '@services/err-handler.service';
import { GuestSortService } from '@services/guest-sort.service';

// Helpers
import { withReqState } from 'src/app/utils/operators/with-state-operator';
import { mapGuestTable } from 'src/app/utils/mappers/guest-table.mapper';
import { isGroup } from 'src/app/utils/helpers/guests-table.utils';

// Interfaces
import { IGuestListItem } from '@interfaces/couchsurfing.interface';
import { IGuestsTableVM, IGuestTableRow, IGuestTableRowWithIndex } from '@interfaces/data-structure-api';

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
    private _router: Router,
    private _guests: GuestsService,
    private _sortService: GuestSortService,
    private _deleteService: GuestDeleteService,
    private _errH: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initVm();
  }

  private initVm(): void {
    this.vm$ = this.page$.pipe(
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

        let data: IGuestTableRowWithIndex[] = vm.data.map((item, index) => ({
          ...item,
          pageIndex: this.getOffset() + index,
        }));

        data = this._sortService.sort(data, sort);

        return {
          ...vm,
          data,
          offset: this.getOffset(),
        };
      })
    );
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

  private getOffset(): number {
    const { page, size } = this.page$.value;
    return (page - 1) * size;
  }

  openDetail(guest: IGuestListItem): void {
    const group = isGroup(guest);
    if (group) {
      this._router.navigate(['/couchsurfing/groups', guest.groupId]);
      return;
    }
    this._router.navigate(['/couchsurfing/guests', guest.guestId]);
  }

  openCouchsurfing(profileId: string): void {
    window.open(`https://www.couchsurfing.com/c/users/${profileId}`, '_blank');
  }

  openWhatsapp(whatsapp: string): void {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
  }

  async removeGuestConfirmation(guest: IGuestListItem): Promise<void> {
    const deleted = await this._deleteService.confirmAndDelete(guest);
    if (!deleted) return;
    this.page$.next({ ...this.page$.value });
  }

  editGuest(item: IGuestListItem): void {
    if (isGroup(item)) {
      this._router.navigate(['/couchsurfing/groups/edit', item.groupId]);

      return;
    }
    this._router.navigate(['/couchsurfing/guests/edit', item.guestId]);
  }
}
