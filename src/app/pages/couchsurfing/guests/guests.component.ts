import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { combineLatestWith, map, switchMap } from 'rxjs/operators';

// Material
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

// Services
import { GuestsService } from '@services/guests.service';
import { GroupsService } from '@services/groups.service';
import { AlertsService } from '@services/alerts.service';
import { ErrorHandlerService } from '@services/err-handler.service';

// Helpers
import { withReqState } from 'src/app/utils/operators/with-state-operator';
import { mapGuestTable } from 'src/app/utils/mappers/guest-table.mapper';
import { isGroup } from 'src/app/utils/helpers/guests-table.utils';
import { compare } from 'src/app/utils/helpers/sort.utils';

// Interfaces
import { IGuest, IGuestListItem } from '@interfaces/couchsurfing.interface';
import { IGuestsTableVM, IGuestTableRow } from '@interfaces/data-structure-api';

// Const
import { ALERT_MESSAGES } from '@const/alerts';

// Libraries
import Swal from 'sweetalert2';

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
    private _groups: GroupsService,
    private _alerts: AlertsService,
    private _router: Router,
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

  openDetail(guest: IGuestListItem): void {
    const group = isGroup(guest);
    if (group) {
      this._router.navigate(['/couchsurfing/groups', guest.groupId]);
      return;
    }
    this._router.navigate(['/couchsurfing/guests', guest.guestId]);
  }

  openCouchsurfing(guest: IGuestListItem): void {
    const group = isGroup(guest);
    const id = group ? guest.members[0].urlProfileCs : guest.urlProfileCs;
    const urlCs = `https://www.couchsurfing.com/c/users/${id}`;
    window.open(`${urlCs}`, '_blank');
  }

  openWhatsapp(guest: IGuest): void {
    const phone = `${guest.prefixCode}${guest.whatsapp}`;
    window.open(`https://wa.me/${phone}`, '_blank');
  }

  async removeGuestConfirmation(guest: IGuestListItem): Promise<void> {
    const group = isGroup(guest);
    const fullname = group ? guest.members[0].fullName : guest.fullName;

    const alerts = ALERT_MESSAGES.deleteGuest;

    const first = await this._alerts.showAlert({
      icon: 'question',
      title: '',
      html: alerts.confirmation.message,
      confirmText: alerts.confirmation.confirmButtonText,
      showCancelButton: false,
    });

    if (!first.isConfirmed) return;

    const second = await this._alerts.showAlert({
      icon: 'warning',
      title: alerts.warning.title,
      html: alerts.warning.message(fullname),
      confirmText: alerts.warning.confirmButtonText,
      showCancelButton: false,
    });

    if (!second.isConfirmed) return;

    const { isConfirmed } = await Swal.fire({
      title: alerts.typeToConfirm.title(fullname),
      input: 'text',
      inputPlaceholder: fullname,
      confirmButtonColor: '#ff0000',
      showCancelButton: true,
      preConfirm: (value: string) => {
        if (value === fullname) return true;
        Swal.showValidationMessage(`Must type "${fullname}" exactly`);
        return false;
      },
    });

    if (!isConfirmed) return;

    const where = group ? this._groups.removeGroupById.bind(this._groups) : this._guests.removeGuestById.bind(this._guests);
    const id = group ? guest.groupId : guest.guestId;

    where(id).subscribe(() => {
      this._alerts.showToast({
        icon: 'success',
        title: ALERT_MESSAGES.deleteGuest.success.message(fullname),
        time: 6000,
      });

      this.page$.next(this.page$.value);
    });
  }

  editGuest(item: IGuestListItem): void {
    if (isGroup(item)) {
      this._router.navigate(['/couchsurfing/groups/edit', item.groupId]);

      return;
    }
    this._router.navigate(['/couchsurfing/guests/edit', item.guestId]);
  }
}
