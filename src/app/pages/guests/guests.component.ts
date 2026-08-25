import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { combineLatestWith, map, switchMap } from 'rxjs/operators';

// Material
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

// Services
import { GuestsService } from '@services/guests.service';
import { GuestDeleteService } from '@services/delete-confirmation.service';
import { ErrorHandlerService } from '@services/err-handler.service';
import { GuestSortService } from '@services/guest-sort.service';

// Helpers
import { withReqState } from 'src/app/utils/operators/with-state-operator';
import { mapGuestTable } from 'src/app/utils/mappers/guest-table.mapper';
import { isGroup } from 'src/app/utils/helpers/guests-table.utils';

// Interfaces
import { IGuestListItem, IQueryParamsGuests } from '@interfaces/guests.interface';
import { ICurrentView, IGuestsTableVM, IGuestTableRow, IGuestTableRowWithIndex, VIEW_CONFIG } from '@interfaces/data-structure-api';

// Types
import { Continents, CountriesCodes, ICountry } from '@type/word.types';

// Constants
import { WORLD } from '@config/world';

@Component({
  selector: 'guests',
  templateUrl: './guests.component.html',
  styleUrls: ['./guests.component.css'],
})
export class GuestsComponent implements OnInit {
  vm$!: Observable<IGuestsTableVM>;

  // Filters
  filtersForm!: FormGroup;

  // Countries
  countries: Array<ICountry & { countryCode: CountriesCodes }> = [];

  // Countries filtered by autocomplete search
  filteredCountries: Array<ICountry & { countryCode: CountriesCodes }> = [];

  // Continents
  continents: Continents[] = ['africa', 'america', 'asia', 'europe', 'oceania'];
  continentIcons = {
    africa: 'fa-solid fa-earth-africa',
    america: 'fa-solid fa-earth-americas',
    asia: 'fa-solid fa-earth-asia',
    europe: 'fa-solid fa-earth-europe',
    oceania: 'fa-solid fa-earth-oceania',
  };

  currentView: ICurrentView = 'table';

  // Current Filters
  private filters$ = new BehaviorSubject<IQueryParamsGuests>({});

  // Pagination
  private page$ = new BehaviorSubject<{ page: number; size: number }>({ page: 1, size: 10 });

  // Sort
  private sort$ = new BehaviorSubject<Sort>({
    active: '',
    direction: '',
  });

  constructor(
    private fb: FormBuilder,
    private _router: Router,
    private _route: ActivatedRoute,
    private _guests: GuestsService,
    private _sortService: GuestSortService,
    private _deleteService: GuestDeleteService,
    private _errH: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initFiltersForm();
    this.loadDataCountries();
    this.listenQueryParams();
    this.initVm();
    this.listenCountryAutocomplete();
    this.listenContinentFilter();
  }

  // FILTERS
  private initFiltersForm(): void {
    this.filtersForm = this.fb.group({
      country: [''],
      continent: [''],
      groupType: [''],
      from: [new Date(2023, 0, 1)],
      to: [new Date()],
      isFirstTime: [''],
    });
  }

  onFiltersSubmit(): void {
    const formValue = this.filtersForm.getRawValue();

    const filters: IQueryParamsGuests = {
      country: formValue.country || undefined,
      continent: formValue.continent || undefined,
      groupType: formValue.groupType || undefined,
      from: this.formatDate(formValue.from),
      to: this.formatDate(formValue.to),
      isFirstTime: this.getBooleanFilter(formValue.isFirstTime),
    };

    // Update filters
    this.filters$.next(filters);

    // Reset pagination
    this.page$.next({ page: 1, size: this.page$.value.size });
  }

  clearFilters(): void {
    this.filtersForm.reset({ country: '', continent: '', groupType: '', from: '', to: '', isFirstTime: '' });

    // Show all countries again to autocomplete
    this.filteredCountries = [...this.countries];
  }

  private getBooleanFilter(value: boolean | string | null): boolean | undefined {
    if (value === '' || value === null || value === undefined) return undefined;
    return value === true || value === 'true';
  }

  private formatDate(dateValue: Date | string | null): string | undefined {
    if (!dateValue) return undefined;
    const date = new Date(dateValue);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  // VIEW MODEL
  private initVm(): void {
    this.vm$ = combineLatest([this.page$, this.filters$]).pipe(
      switchMap(([{ page, size: limit }, filters]) => withReqState(this._guests.getAllGuests({ limit, page, ...filters }), this._errH)),

      map(vm => {
        if (vm.status !== 'success') {
          return {
            ...vm,
            offset: this.getOffset(),
            data: [] as IGuestTableRow[],
          };
        }

        const data = mapGuestTable(vm.data);
        const offset = this.getOffset();

        return { ...vm, data, offset };
      }),

      combineLatestWith(this.sort$),

      map(([vm, sort]) => {
        if (vm.status !== 'success') return vm;

        let data: IGuestTableRowWithIndex[] = vm.data.map((item, index) => ({ ...item, pageIndex: this.getOffset() + index }));
        data = this._sortService.sort(data, sort);

        return {
          ...vm,
          data,
          offset: this.getOffset(),
        };
      })
    );
  }

  // SORT
  onSortChange(sort: Sort): void {
    const current = this.sort$.value;

    // First click
    if (!current.active) {
      this.sort$.next({ active: sort.active, direction: 'asc' });
      return;
    }

    // Same column
    if (current.active === sort.active) {
      if (current.direction === 'asc') {
        this.sort$.next({ active: sort.active, direction: 'desc' });
      } else if (current.direction === 'desc') {
        this.sort$.next({ active: '', direction: '' });
      } else {
        this.sort$.next({ active: sort.active, direction: 'asc' });
      }
      return;
    }

    // New column
    this.sort$.next({ active: sort.active, direction: 'asc' });
  }

  // PAGINATION
  onPageChange(event: PageEvent): void {
    this.page$.next({ page: event.pageIndex + 1, size: event.pageSize });
  }

  private getOffset(): number {
    const { page, size } = this.page$.value;
    return (page - 1) * size;
  }

  // COUNTRIES
  private loadDataCountries(): void {
    this.countries = (Object.entries(WORLD) as [CountriesCodes, ICountry][])
      .map(([countryCode, country]) => ({
        countryCode,
        ...country,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Initially show all countries to autocomplete
    this.filteredCountries = [...this.countries];
  }

  // NAVIGATION
  openDetail(guest: IGuestListItem): void {
    const group = isGroup(guest);
    if (group) {
      this._router.navigate(['/guests/groups', guest.groupId]);
      return;
    }
    this._router.navigate(['/guests', guest.guestId]);
  }

  openCouchsurfing(profileId: string): void {
    window.open(`https://www.couchsurfing.com/c/users/${profileId}`, '_blank');
  }

  openWhatsapp(whatsapp: string): void {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
  }

  // DELETE
  async removeGuestConfirmation(guest: IGuestListItem): Promise<void> {
    const deleted = await this._deleteService.confirmAndDelete(guest, item => {
      const group = isGroup(item);
      const id = group ? item.groupId : item.guestId;
      return group ? this._guests.removeGroupById(id) : this._guests.removeGuestById(id);
    });
    if (!deleted) return;
    this.page$.next({ ...this.page$.value });
  }
  // EDIT
  editGuest(item: IGuestListItem): void {
    if (isGroup(item)) {
      this._router.navigate(['/guests/groups/edit', item.groupId]);
      return;
    }
    this._router.navigate(['/guests/edit', item.guestId]);
  }

  // AUTOCOMPLETE
  private listenCountryAutocomplete(): void {
    const countryCtrl = this.filtersForm.get('country');

    countryCtrl?.valueChanges.subscribe(value => {
      // Si el valor es un código porque seleccionó una opción,
      // no hacemos filtrado por texto
      if (typeof value !== 'string') return;

      const search = value.toLowerCase().trim();
      const selectedContinent = this.filtersForm.get('continent')?.value;

      // Start with all countries
      let countries = this.countries;

      if (selectedContinent) {
        countries = countries.filter(country => country.continent === selectedContinent);
      }

      // If there is no search text, show countries from selected continent
      if (!search) {
        this.filteredCountries = [...countries];
        return;
      }

      // filter by country name or country code
      this.filteredCountries = countries.filter(country => country.name.toLowerCase().includes(search) || country.countryCode.toLowerCase().includes(search));
    });
  }

  displayCountryCode = (countryCode: string | null): string => {
    if (!countryCode) return 'All Countries';
    const country = this.countries.find(country => country.countryCode === countryCode);
    return country?.name ?? '';
  };

  // Fiter country by continent
  private listenContinentFilter(): void {
    const continentCtrl = this.filtersForm.get('continent');
    const countryCtrl = this.filtersForm.get('country');

    continentCtrl?.valueChanges.subscribe(continent => {
      // No continent selected
      if (!continent) {
        this.filteredCountries = [...this.countries];
        return;
      }

      // Filter countries by continent
      this.filteredCountries = this.countries.filter(country => country.continent === continent);

      // Check if current country belongs to selected continent
      const currentCountry = countryCtrl?.value;

      if (!currentCountry) return;
      const countryExists = this.filteredCountries.some(country => country.countryCode === currentCountry);

      // Clear country if it doesn't belong to selected continent
      if (!countryExists) {
        countryCtrl?.setValue('');
      }
    });
  }

  onCountrySelected(event: MatAutocompleteSelectedEvent): void {
    const countryCode = event.option.value;
    // All Countries
    if (!countryCode) {
      this.filtersForm.get('continent')?.setValue('');
      return;
    }
    const selectedCountry = this.countries.find(country => country.countryCode === countryCode);
    if (!selectedCountry) return;
    this.filtersForm.get('continent')?.setValue(selectedCountry.continent);
  }

  getDetailForShowingMore(guestId: string) {
    this._guests.getGuestById(guestId).subscribe(res => res);
  }

  // Set view
  setView(view: ICurrentView): void {
    this.currentView = view;
  }

  get nextViewIcon(): string {
    return VIEW_CONFIG[this.currentView].icon;
  }

  get nextViewTooltip(): string {
    return VIEW_CONFIG[this.currentView].tooltip;
  }

  changeView(): void {
    this.currentView = VIEW_CONFIG[this.currentView].next;
  }

  // To see cards from stats
  private listenQueryParams(): void {
    this._route.queryParams.subscribe(params => {
      const rating = params['rating'];
      const view = params['view'];
      const groupType = params['groupType'];

      if (view) {
        this.currentView = view;
      }

      if (rating || groupType) {
        const currentFilters = this.filters$.value;

        this.filters$.next({
          ...currentFilters,
          rating: rating ? Number(rating) : undefined,
          groupType: groupType || undefined,
        });
      }
    });
  }
}
