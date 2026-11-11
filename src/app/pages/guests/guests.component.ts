import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { combineLatestWith, map, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

// Material
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

// Services
import { GuestsService } from '@services/guests.service';
import { DeleteConfirmationService } from '@core/services/delete-confirmation.service';
import { ErrorHandlerService } from '@core/services/err-handler.service';
import { GuestSortService } from '@services/guest-sort.service';
import { GeonameService } from '@services/geoname.service';
import { FormatService } from '@services/format.service';
import { StatsService } from '@services/stats.service';

// Helpers
import { withReqState, isGroup, mapGuestTable } from '@utils';

// Interfaces
import { IGuestListItem, IQueryParamsGuests, IYearlyStat } from '@interfaces/guests.interface';
import { ICurrentView, IGuestsTableVM, IGuestTableRow, IGuestTableRowWithIndex, VIEW_CONFIG } from '@interfaces/data-structure-api';

// Types
import { CONTINENTS, Continents, CountriesCodes, ICountry, LANG, Language, Regions } from '@type/word.types';

// Constants
import { WORLD } from '@config/world';
import { REGION_NAMES } from '@config/world/regions';

// Utils
import { parseBooleanParam, parseMultiParam } from '@utils';

@Component({
  providers: [GuestSortService, StatsService],
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
  continents: Continents[] = [...CONTINENTS];

  continentIcons = {
    africa: 'fa-solid fa-earth-africa',
    america: 'fa-solid fa-earth-americas',
    asia: 'fa-solid fa-earth-asia',
    europe: 'fa-solid fa-earth-europe',
    oceania: 'fa-solid fa-earth-oceania',
  };

  currentView: ICurrentView = 'table';

  @ViewChild('countryInput') countryInput!: ElementRef<HTMLInputElement>;

  // Current Filters
  private filters$ = new BehaviorSubject<IQueryParamsGuests>({});

  // Table pagination
  private page$ = new BehaviorSubject<{ page: number; size: number }>({
    page: 1,
    size: 10,
  });

  // Cards infinite scroll
  cardsData: IGuestTableRow[] = [];
  cardsPage = 1;
  cardsPageSize = 10;
  cardsLoading = false;
  cardsHasMore = true;

  // Map
  mapData: IGuestTableRow[] = [];
  mapLimit = 200;
  mapLoading = false;
  mapLimitOptions = [10, 20, 30, 50, 100, 200];

  // Sort
  private sort$ = new BehaviorSubject<Sort>({
    active: '',
    direction: '',
  });

  // Year stats
  monthlyStats: IYearlyStat[] = [];

  private fb = inject(FormBuilder);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _guests = inject(GuestsService);
  private _sortService = inject(GuestSortService);
  private _deleteService = inject(DeleteConfirmationService);
  private _errH = inject(ErrorHandlerService);
  private readonly _geoname = inject(GeonameService);
  private readonly _format = inject(FormatService);
  private _translate = inject(TranslateService);

  ngOnInit(): void {
    this.initFiltersForm();
    this.loadDataCountries();
    this.listenQueryParams();
    this.initVm();
    this.listenCountryAutocomplete();
    this.listenLocationFilters();
    this.listenLanguageChange();
  }

  countrySearchCtrl = this.fb.control('');

  // FILTERS
  private initFiltersForm(): void {
    this.filtersForm = this.fb.group({
      country: [[]],
      continent: [[]],
      region: [[]],
      groupType: [[]],
      from: [new Date(2023, 0, 1)],
      to: [new Date()],
      isFirstTime: [''],
      hangOut: [''],
      ambassador: [''],
      didTheyReq: [''],
    });
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  onFiltersSubmit(): void {
    const formValue = this.filtersForm.getRawValue();

    const filters: IQueryParamsGuests = {
      country: this.formatMultiFilter(formValue.country),
      continent: this.formatMultiFilter(formValue.continent),
      region: this.formatMultiFilter(formValue.region),
      groupType: this.formatMultiFilter(formValue.groupType),
      from: this.formatDate(formValue.from),
      to: this.formatDate(formValue.to),
      isFirstTime: this.getBooleanFilter(formValue.isFirstTime),
      ambassador: this.getBooleanFilter(formValue.ambassador),
      didTheyReq: this.getBooleanFilter(formValue.didTheyReq),
      hangOut: this.getBooleanFilter(formValue.hangOut),
    };

    // Reset table pagination first
    this.page$.next({
      page: 1,
      size: this.page$.value.size,
    });

    // Update filters
    this.filters$.next(filters);
    this.updateFiltersInUrl(filters);

    // Reset cards infinite scroll
    this.resetCards();

    // Reload cards if the current view is cards
    if (this.currentView === 'cards') {
      this.loadMoreCards();
    }

    // Reload map if the current view is map
    if (this.currentView === 'map') {
      this.loadMapData();
    }
  }

  clearFilters(): void {
    this.filtersForm.reset({
      country: [],
      continent: [],
      region: [],
      groupType: [],
      from: '',
      to: '',
      isFirstTime: '',
      hangOut: '',
      ambassador: '',
      didTheyReq: '',
    });

    this.countrySearchCtrl.setValue('', { emitEvent: false });

    // Show all countries again to autocomplete
    this.filteredCountries = [...this.countries];
    // Show all regions again to autocomplete
    this.filteredRegions = [...this.regions];

    this.onFiltersSubmit();
  }

  private updateFiltersInUrl(filters: IQueryParamsGuests): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        country: filters.country ?? null,
        continent: filters.continent ?? null,
        region: filters.region ?? null,
        groupType: filters.groupType ?? null,
        from: filters.from ?? null,
        to: filters.to ?? null,
        isFirstTime: filters.isFirstTime?.toString() ?? null,
        hangOut: filters.hangOut?.toString() ?? null,
        ambassador: filters.ambassador?.toString() ?? null,
        didTheyReq: filters.didTheyReq?.toString() ?? null,
      },
      queryParamsHandling: 'merge',
    });
  }

  getRegionName(region: Regions): string {
    return this._geoname.getRegionName(region);
  }

  getCountryName(code: string): string {
    return this._format.formatCountry(code);
  }

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
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

  private listenLanguageChange(): void {
    this._translate.onLangChange.subscribe(() => {
      this.sortCountriesByLanguage();
      this.sortRegionsByLanguage();
      this.updateFilteredRegions();
      this.updateFilteredCountries();
    });
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

        this.monthlyStats = vm.monthlyStats ?? [];

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

  private formatMultiFilter(values: string[] | null): string | undefined {
    return values?.length ? values.join(',') : undefined;
  }

  // COUNTRIES

  private loadDataCountries(): void {
    this.countries = (Object.entries(WORLD) as [CountriesCodes, ICountry][]).map(([countryCode, country]) => ({
      countryCode,
      ...country,
    }));

    // Sort countries using the current language
    this.sortCountriesByLanguage();

    // Get regions from data countries
    this.regions = [...new Set(this.countries.map(country => country.region))];

    // Initially show all regions and countries
    this.filteredRegions = [...this.regions];
    this.filteredCountries = [...this.countries];
  }

  // DELETE
  async removeGuestConfirmation(guest: IGuestListItem): Promise<void> {
    const deleted = await this._deleteService.confirmAndDelete(guest, item => {
      const group = isGroup(item);
      const id = group ? item.groupId : item.guestId;
      return group ? this._guests.removeGroupById(id) : this._guests.removeGuestById(id);
    });
    if (!deleted) return;

    // Refresh the table data
    this.page$.next({ ...this.page$.value });

    // Remove cache data, so the other views reload when opened
    this.resetCards();
    this.mapData = [];

    // Reload the data for the current view
    if (this.currentView === 'cards') {
      this.loadMoreCards();
    }

    if (this.currentView === 'map') {
      this.loadMapData();
    }
  }

  // AUTOCOMPLETE
  private listenCountryAutocomplete(): void {
    this.countrySearchCtrl.valueChanges.subscribe(() => {
      this.updateFilteredCountries();
    });
  }

  private sortRegionsByLanguage(): void {
    const currentLang = this._translate.currentLang || 'en';
    const lang: Language = LANG.includes(currentLang as Language) ? (currentLang as Language) : 'en';
    this.regions.sort((a, b) => this.getRegionName(a).localeCompare(this.getRegionName(b), lang));
    this.filteredRegions.sort((a, b) => this.getRegionName(a).localeCompare(this.getRegionName(b), lang));
  }

  private sortCountriesByLanguage(): void {
    const currentLang = this._translate.currentLang || 'en';

    const lang: Language = LANG.includes(currentLang as Language) ? (currentLang as Language) : 'en';

    this.countries.sort((a, b) => {
      const nameA = this.getCountryName(a.countryCode);
      const nameB = this.getCountryName(b.countryCode);

      return nameA.localeCompare(nameB, lang);
    });

    this.updateFilteredCountries();
  }

  toggleCountry(countryCode: CountriesCodes): void {
    const countryCtrl = this.filtersForm.get('country');
    const selectedCountries = (countryCtrl?.value ?? []) as CountriesCodes[];

    const updatedCountries = selectedCountries.includes(countryCode) ? selectedCountries.filter(code => code !== countryCode) : [...selectedCountries, countryCode];

    countryCtrl?.setValue(updatedCountries);

    this.countrySearchCtrl.setValue('', { emitEvent: false });
    this.countryInput.nativeElement.value = '';

    this.updateFilteredCountries();
  }

  openCountryList(): void {
    this.countrySearchCtrl.setValue('', { emitEvent: true });
    this.updateFilteredCountries();
  }

  onCountrySelected(event: MatAutocompleteSelectedEvent): void {
    event.option.deselect();
    this.countrySearchCtrl.setValue('', { emitEvent: true });
    this.countryInput.nativeElement.focus();
  }

  removeCountry(countryCode: CountriesCodes): void {
    const countryCtrl = this.filtersForm.get('country');
    const selectedCountries = (countryCtrl?.value ?? []) as CountriesCodes[];

    countryCtrl?.setValue(selectedCountries.filter(code => code !== countryCode));
  }

  getDetailForShowingMore(guestId: string) {
    this._guests.getGuestById(guestId).subscribe(res => res);
  }

  // UPDATE VIEW IN URL
  // Keep the current view synchronized with the URL query parameters
  private updateViewInUrl(view: ICurrentView): void {
    const currentUrlView = this._route.snapshot.queryParamMap.get('view');
    if ((view === 'table' && !currentUrlView) || currentUrlView === view) {
      return;
    }

    this._router.navigate([], {
      // Navigate relative to the current route
      relativeTo: this._route,
      // Remove the view parameter for the default table view. Otherwise, set it to the selected view (cards or map)
      queryParams: {
        view: view === 'table' ? null : view,
      },
      // Preserve the other query parameters, such as statistics filters
      queryParamsHandling: 'merge',
    });
  }

  // CARDS
  // Set view
  setView(view: ICurrentView): void {
    this.currentView = view;
    this.updateViewInUrl(view);

    if (view === 'cards' && !this.cardsData.length) {
      this.loadMoreCards();
    }

    if (view === 'map' && !this.mapData.length) {
      this.loadMapData();
    }
  }

  changeView(): void {
    const nextView = VIEW_CONFIG[this.currentView].next;
    this.setView(nextView);
  }

  get nextViewTooltip(): string {
    const nextView = VIEW_CONFIG[this.currentView].next;
    return `GUESTS_VIEW.CHANGE_TO_${nextView.toUpperCase()}`;
  }

  get nextViewIcon(): string {
    const nextView = VIEW_CONFIG[this.currentView].next;
    const icons: Record<ICurrentView, string> = {
      table: 'table_chart',
      cards: 'grid_view',
      map: 'map',
    };
    return icons[nextView];
  }

  private listenQueryParams(): void {
    this._route.queryParams.subscribe(params => {
      // CURRENT VIEW
      const view: ICurrentView = params['view'] === 'cards' || params['view'] === 'map' ? params['view'] : 'table';
      // Check whether the user changed the view
      const viewChanged = this.currentView !== view;
      this.currentView = view;

      // READ FILTERS FROM URL
      const rating = params['rating'];
      const gift = params['gift'];
      const gender = params['gender'];
      const gay = params['gay'];
      const hometownState = params['hometownState'];
      const livingInState = params['livingInState'];
      const day = params['day'];
      const birthDate = params['birthDate'];
      const continent = params['continent'];
      const region = params['region'];
      const country = params['country'];
      const groupType = params['groupType'];
      const from = params['from'];
      const to = params['to'];
      const isFirstTime = params['isFirstTime'];
      const hangOut = params['hangOut'];
      const ambassador = params['ambassador'];
      const didTheyReq = params['didTheyReq'];

      // RESTORE FILTER FORM VALUES
      //Convert URL parameters into the expected from control values
      this.filtersForm.patchValue(
        {
          continent: parseMultiParam(continent),
          region: parseMultiParam(region),
          country: parseMultiParam(country),
          groupType: parseMultiParam(groupType),

          // Comprobe truthy value
          from: from ? new Date(`${from}T00:00:00`) : '',
          to: to ? new Date(`${to}T00:00:00`) : '',

          isFirstTime: parseBooleanParam(isFirstTime) ?? '',
          hangOut: parseBooleanParam(hangOut) ?? '',
          ambassador: parseBooleanParam(ambassador) ?? '',
          didTheyReq: parseBooleanParam(didTheyReq) ?? '',
        },
        { emitEvent: false }
      );

      // RESTORE FILTERED OPTIONS
      // Update available regions and countries based on the selected filters
      this.updateFilteredRegions();
      this.updateFilteredCountries();

      // BUILD FILTERS
      // Convert URL parameters into the format expected by the API
      const filters: IQueryParamsGuests = {
        groupType: groupType || undefined,
        rating: rating ? Number(rating) : undefined,
        gift: gift !== undefined ? gift === 'true' : undefined,
        gender: gender || undefined,
        gay: gay !== undefined ? gay === 'true' : undefined,
        continent: continent || undefined,
        region: region || undefined,
        country: country || undefined,
        hometownState: hometownState || undefined,
        livingInState: livingInState || undefined,
        from: from || undefined,
        to: to || undefined,
        day: day || undefined,
        birthDate: birthDate || undefined,
        isFirstTime: parseBooleanParam(isFirstTime),
        hangOut: parseBooleanParam(hangOut),
        ambassador: parseBooleanParam(ambassador),
        didTheyReq: parseBooleanParam(didTheyReq),
      };

      // COMPARE FITERS
      // Normalize both objects to avoid unnecessary requests when filters have not changed
      const normalizeFilters = (value: IQueryParamsGuests) =>
        JSON.stringify(
          Object.entries(value)
            .filter(([, item]) => item !== undefined && item !== null && item !== '')
            .sort(([a], [b]) => a.localeCompare(b))
        );

      const filtersChanged = normalizeFilters(filters) !== normalizeFilters(this.filters$.value);

      // HANDLE FILTER CHANGES
      // Reset pagination and cached data only when filters actually change
      if (filtersChanged) {
        this.filters$.next(filters);

        this.page$.next({
          page: 1,
          size: this.page$.value.size,
        });

        // Clear previously loaded cards and map data
        this.resetCards();
        this.mapData = [];

        // Load data for the active view
        if (this.currentView === 'cards') {
          this.loadMoreCards();
        }

        if (this.currentView === 'map') {
          this.loadMapData();
        }
        return;
      }

      // HANDLE VIEW CHANGES
      // Reuse cached data whenever possible instead of requesting it again
      if (viewChanged) {
        // Load cards only if the have not been loaded yet
        if (this.currentView === 'cards' && !this.cardsData.length) {
          this.loadMoreCards();
        }

        // Load map only if its data is not available yet
        if (this.currentView === 'map' && !this.mapData.length) {
          this.loadMapData();
        }
      }
    });
  }

  // INFINITE SCROLL
  // Load the next page of guests for the cards view
  loadMoreCards(): void {
    // Prevent duplicated requests while loading or when there is no more data
    if (this.cardsLoading || !this.cardsHasMore) return;
    this.cardsLoading = true;
    this._guests
      .getAllGuests({
        limit: this.cardsPageSize,
        page: this.cardsPage,
        ...this.filters$.value,
      })
      .subscribe({
        next: response => {
          const newGuests = mapGuestTable(response.data);

          // Append the new guests instead of replacing the existing cards
          this.cardsData = [...this.cardsData, ...newGuests];

          // Move to the next page for the next scroll
          this.cardsPage++;

          // If the API returned fewer guests than requested,
          // there are no more pages to load
          if (newGuests.length < this.cardsPageSize) {
            this.cardsHasMore = false;
          }
          this.cardsLoading = false;
        },
        error: () => {
          this.cardsLoading = false;
        },
      });
  }

  // Reset the cards infinite scroll state
  private resetCards(): void {
    this.cardsData = [];
    this.cardsPage = 1;
    this.cardsHasMore = true;
    this.cardsLoading = false;
  }

  // MAP
  loadMapData(): void {
    if (this.mapLoading) return;
    this.mapLoading = true;

    this._guests
      .getAllGuests({
        limit: this.mapLimit,
        page: 1,
        ...this.filters$.value,
      })
      .subscribe({
        next: response => {
          this.mapData = mapGuestTable(response.data);
          this.mapLoading = false;
        },
        error: () => {
          this.mapData = [];
          this.mapLoading = false;
        },
      });
  }

  onMapLimitChange(limit: number): void {
    this.mapLimit = limit;
    this.loadMapData();
  }

  // LOCATION FILTERS
  private listenLocationFilters(): void {
    const continentCtrl = this.filtersForm.get('continent');
    const regionCtrl = this.filtersForm.get('region');
    const countryCtrl = this.filtersForm.get('country');

    continentCtrl?.valueChanges.subscribe(() => {
      const selectedContinents = (continentCtrl.value ?? []) as Continents[];
      const selectedRegions = (regionCtrl?.value ?? []) as Regions[];
      const selectedCountries = (countryCtrl?.value ?? []) as CountriesCodes[];

      // Keep only regions that belong to the selected continents
      const validRegions = selectedRegions.filter(region =>
        this.countries.some(country => country.region === region && (!selectedContinents.length || selectedContinents.includes(country.continent)))
      );

      // Keep only countries compatible with the selected continents and regions
      const validCountries = selectedCountries.filter(code => {
        const country = this.countries.find(item => item.countryCode === code);

        return !!country && (!selectedContinents.length || selectedContinents.includes(country.continent)) && (!selectedRegions.length || validRegions.includes(country.region));
      });

      if (validRegions.length !== selectedRegions.length) {
        regionCtrl?.setValue(validRegions, { emitEvent: false });
      }

      if (validCountries.length !== selectedCountries.length) {
        countryCtrl?.setValue(validCountries, { emitEvent: false });
      }

      this.updateFilteredRegions();
      this.updateFilteredCountries();
    });

    regionCtrl?.valueChanges.subscribe(() => {
      const selectedContinents = (continentCtrl?.value ?? []) as Continents[];
      const selectedRegions = (regionCtrl?.value ?? []) as Regions[];
      const selectedCountries = (countryCtrl?.value ?? []) as CountriesCodes[];

      const validCountries = selectedCountries.filter(code => {
        const country = this.countries.find(item => item.countryCode === code);

        return (
          !!country && (!selectedContinents.length || selectedContinents.includes(country.continent)) && (!selectedRegions.length || selectedRegions.includes(country.region))
        );
      });

      if (validCountries.length !== selectedCountries.length) {
        countryCtrl?.setValue(validCountries, { emitEvent: false });
      }

      this.updateFilteredRegions();
      this.updateFilteredCountries();
    });

    this.updateFilteredRegions();
    this.updateFilteredCountries();
  }

  private updateFilteredRegions(): void {
    const selectedContinents = (this.filtersForm.get('continent')?.value ?? []) as Continents[];

    this.filteredRegions = selectedContinents.length
      ? this.regions.filter(region => this.countries.some(country => country.region === region && selectedContinents.includes(country.continent)))
      : [...this.regions];

    this.sortRegionsByLanguage();
  }

  private updateFilteredCountries(): void {
    const selectedContinents = (this.filtersForm.get('continent')?.value ?? []) as Continents[];
    const selectedRegions = (this.filtersForm.get('region')?.value ?? []) as Regions[];
    const selectedCountries = (this.filtersForm.get('country')?.value ?? []) as CountriesCodes[];

    const search = this.normalizeSearchText(this.countrySearchCtrl.value ?? '');

    const filtered = this.countries.filter(country => {
      const matchesContinent = !selectedContinents.length || selectedContinents.includes(country.continent);
      const matchesRegion = !selectedRegions.length || selectedRegions.includes(country.region);
      const countryName = this.normalizeSearchText(this.getCountryName(country.countryCode));
      const englishName = this.normalizeSearchText(country.name.en);
      const countryCode = this.normalizeSearchText(country.countryCode);
      const matchesSearch = !search || countryName.includes(search) || englishName.includes(search) || countryCode.includes(search);
      return matchesContinent && matchesRegion && matchesSearch;
    });

    // Mostrar primero los países seleccionados
    this.filteredCountries = [
      ...filtered.filter(country => selectedCountries.includes(country.countryCode)),
      ...filtered.filter(country => !selectedCountries.includes(country.countryCode)),
    ];
  }
}
