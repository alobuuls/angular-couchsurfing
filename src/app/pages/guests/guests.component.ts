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
import { Continents, CountriesCodes, ICountry, Regions } from '@type/word.types';

// Constants
import { WORLD } from '@config/world';
import { REGION_NAMES } from '@config/world/regions';

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

  // Regions
  regions: Regions[] = [];
  filteredRegions: Regions[] = [];

  regionNames = REGION_NAMES;
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
    this.listenRegionFilter();
  }

  // FILTERS
  private initFiltersForm(): void {
    this.filtersForm = this.fb.group({
      country: [''],
      continent: [''],
      region: [''],
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
      region: formValue.region || undefined,
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
    this.filtersForm.reset({ country: '', continent: '', groupType: '', from: '', to: '', isFirstTime: '', region: '' });

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

    // Get regions from data countries
    this.regions = [...new Set(this.countries.map(country => country.region))];

    // Initially show all regions to autocomplete
    this.filteredRegions = [...this.regions];
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
      // Si es un código porque seleccionó una opción,
      // no hacemos filtrado por texto
      if (typeof value !== 'string') return;

      const search = value.toLowerCase().trim();
      const selectedContinent = this.filtersForm.get('continent')?.value;
      const selectedRegion = this.filtersForm.get('region')?.value;
      let countries = this.countries;

      // Filter by continent
      if (selectedContinent) {
        countries = countries.filter(country => country.continent === selectedContinent);
      }
      // Filter by region
      if (selectedRegion) {
        countries = countries.filter(country => country.region === selectedRegion);
      }
      // No search text
      if (!search) {
        this.filteredCountries = [...countries];
        return;
      }
      // Search by country name or code
      this.filteredCountries = countries.filter(country => country.name.toLowerCase().includes(search) || country.countryCode.toLowerCase().includes(search));
    });
  }

  displayCountryCode = (countryCode: string | null): string => {
    if (!countryCode) return 'All Countries';
    const country = this.countries.find(country => country.countryCode === countryCode);
    return country?.name ?? '';
  };

  // FITER COUNTRY BY CONTINENT
  private listenContinentFilter(): void {
    const continentCtrl = this.filtersForm.get('continent');
    const regionCtrl = this.filtersForm.get('region');
    const countryCtrl = this.filtersForm.get('country');

    continentCtrl?.valueChanges.subscribe((continent: Continents | '') => {
      // No continent selected
      if (!continent) {
        this.filteredRegions = [...this.regions];
        this.filteredCountries = [...this.countries];

        return;
      }

      // Regions belonging to selected continent
      this.filteredRegions = [...new Set(this.countries.filter(country => country.continent === continent).map(country => country.region))];

      // Countries belonging to selected continent
      this.filteredCountries = this.countries.filter(country => country.continent === continent);

      // Check current region
      const currentRegion = regionCtrl?.value;

      if (currentRegion) {
        const regionExists = this.filteredRegions.includes(currentRegion);

        if (!regionExists) {
          regionCtrl?.setValue('', {
            emitEvent: false,
          });
        }
      }

      // Check current country
      const currentCountry = countryCtrl?.value;

      if (currentCountry) {
        const countryExists = this.filteredCountries.some(country => country.countryCode === currentCountry);
        if (!countryExists) {
          countryCtrl?.setValue('', {
            emitEvent: false,
          });
        }
      }
    });
  }

  onCountrySelected(event: MatAutocompleteSelectedEvent): void {
    const countryCode = event.option.value;
    const continentCtrl = this.filtersForm.get('continent');
    const regionCtrl = this.filtersForm.get('region');

    // All Countries
    if (!countryCode) {
      continentCtrl?.setValue('', { emitEvent: false });
      regionCtrl?.setValue('', { emitEvent: false });
      this.filteredRegions = [...this.regions];
      this.filteredCountries = [...this.countries];

      return;
    }

    const selectedCountry = this.countries.find(country => country.countryCode === countryCode);

    if (!selectedCountry) return;

    // Set related filters
    continentCtrl?.setValue(selectedCountry.continent, {
      emitEvent: false,
    });

    regionCtrl?.setValue(selectedCountry.region, {
      emitEvent: false,
    });

    // Update regions
    this.filteredRegions = [...new Set(this.countries.filter(country => country.continent === selectedCountry.continent).map(country => country.region))];

    // Update countries
    this.filteredCountries = this.countries.filter(country => country.continent === selectedCountry.continent && country.region === selectedCountry.region);
  }

  getDetailForShowingMore(guestId: string) {
    this._guests.getGuestById(guestId).subscribe(res => res);
  }

  // REGIONS
  private listenRegionFilter(): void {
    const regionCtrl = this.filtersForm.get('region');
    const continentCtrl = this.filtersForm.get('continent');
    const countryCtrl = this.filtersForm.get('country');

    regionCtrl?.valueChanges.subscribe((region: Regions | '') => {
      // No region selected
      if (!region) {
        const continent = continentCtrl?.value;

        if (continent) {
          // Show countries from selected continent
          this.filteredCountries = this.countries.filter(country => country.continent === continent);

          // Show regions from selected continent
          this.filteredRegions = [...new Set(this.countries.filter(country => country.continent === continent).map(country => country.region))];
        } else {
          // Show everything
          this.filteredCountries = [...this.countries];
          this.filteredRegions = [...this.regions];
        }

        return;
      }

      // Countries belonging to selected region
      const regionCountries = this.countries.filter(country => country.region === region);

      // Show only countries from selected region
      this.filteredCountries = regionCountries;

      // Get continent from region
      const regionContinent = regionCountries[0]?.continent;

      if (regionContinent) {
        // Set continent WITHOUT triggering listenContinentFilter
        continentCtrl?.setValue(regionContinent, {
          emitEvent: false,
        });

        // Show only regions from that continent
        this.filteredRegions = [...new Set(this.countries.filter(country => country.continent === regionContinent).map(country => country.region))];
      }

      // Check current country
      const currentCountry = countryCtrl?.value;

      if (currentCountry) {
        const countryExists = regionCountries.some(country => country.countryCode === currentCountry);

        // Clear country if it doesn't belong to selected region
        if (!countryExists) {
          countryCtrl?.setValue('');
        }
      }
    });
  }

  // CARDS
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
