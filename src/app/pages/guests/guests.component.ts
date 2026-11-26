import { Component, DestroyRef, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, timer, throwError } from 'rxjs';
import { combineLatestWith, map, switchMap, tap, finalize, retry, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

// Material
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

// Services
import { GuestsService } from '@pages/guests/services/guests.service';
import { DeleteConfirmationService } from '@core/services/delete-confirmation.service';
import { ErrorHandlerService } from '@core/services/err-handler.service';
import { AlertsService } from '@core/services/alerts.service';
import { GuestSortService } from '@shared/services/guest-sort.service';
import { GeonameService } from '@shared/services/geoname.service';
import { FormatService } from '@shared/services/format.service';
import { StatsService } from '@shared/services/stats.service';
import { CountrySearchService } from '@shared/services/country-search.service';

// Interfaces
import { IGuestListItem, IQueryParamsGuests, IYearlyStat } from '@interfaces/guests.interface';
import { ICurrentView, IGuestsTableVM, IGuestTableRow, IGuestTableRowWithIndex, VIEW_CONFIG, IErrResp } from '@interfaces/data-structure-api';
import { IContinentRegionGroup } from '@interfaces/guest-form.interface';

// Types
import { CONTINENTS, Continents, CountriesCodes, ICountry, LANG, Language, Regions } from '@type/word.types';
import { LocationFilter } from '@type/guest.types';

// Constants
import { WORLD, REGION_NAMES, COUNTRY_REGION_INDEX, REGION_CONTINENT_INDEX, getCountryLocation } from '@config/world';

// Utils
import { withReqState, isGroup, mapGuestTable, parseBooleanParam, parseMultiParam } from '@utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const GENDERS = ['female', 'male', 'trans'] as const;

const normalizeFilters = (value: object): string =>
  JSON.stringify(
    Object.entries(value)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
  );
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

  // Search button loading
  isSearching = false;
  private searchView: ICurrentView | null = null;

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
    global: 'fa-solid fa-earth',
  };

  currentView: ICurrentView = 'table';

  // Current Filters
  private filters$ = new BehaviorSubject<IQueryParamsGuests>({});

  filteredRegionGroups: IContinentRegionGroup[] = [];

  private readonly cardsEndMessageConfig: Record<
    LocationFilter,
    {
      key: string;
      param: string;
      getName: (value: string) => string;
    }
  > = {
    country: {
      key: 'GUESTS_VIEW.CARDS_END_COUNTRY',
      param: 'country',
      getName: value => this.getCountryName(value),
    },
    region: {
      key: 'GUESTS_VIEW.CARDS_END_REGION',
      param: 'region',
      getName: value => this.getRegionName(value as Regions),
    },
    continent: {
      key: 'GUESTS_VIEW.CARDS_END_CONTINENT',
      param: 'continent',
      getName: value => this.getContinentName(value as Continents),
    },
  };

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

  cardsError: IErrResp | null = null;

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

  @ViewChild('countryInput') countryInput!: ElementRef<HTMLInputElement>;

  @HostListener('window:online')
  onConnectionRestored(): void {
    if (this.currentView !== 'cards' || !this.cardsHasMore || this.cardsLoading) return;

    if (this.cardsError) {
      this.retryCards();
    }
  }

  private readonly destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _guests = inject(GuestsService);
  private _sortService = inject(GuestSortService);
  private _deleteService = inject(DeleteConfirmationService);
  private _errH = inject(ErrorHandlerService);
  private _alerts = inject(AlertsService);
  private readonly _countrySearch = inject(CountrySearchService);
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
      platform: [[]],
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

  onFiltersSubmit(): void {
    // Prevent repeated submissions
    if (this.isSearching) return;

    this.isSearching = true;
    this.searchView = this.currentView;

    const formValue = this.filtersForm.getRawValue();

    const filters: IQueryParamsGuests = {
      country: this.formatMultiFilter(formValue.country),
      continent: this.formatMultiFilter(formValue.continent),
      region: this.formatMultiFilter(formValue.region),
      groupType: this.formatMultiFilter(formValue.groupType),
      platform: this.formatMultiFilter(formValue.platform),
      from: this.formatDate(formValue.from),
      to: this.formatDate(formValue.to),
      isFirstTime: this.getBooleanFilter(formValue.isFirstTime),
      ambassador: this.getBooleanFilter(formValue.ambassador),
      didTheyReq: this.getBooleanFilter(formValue.didTheyReq),
      hangOut: this.getBooleanFilter(formValue.hangOut),
    };

    this.page$.next({
      page: 1,
      size: this.page$.value.size,
    });

    this.filters$.next(filters);
    this.updateFiltersInUrl(filters);

    this.resetCards();

    if (this.currentView === 'cards') {
      this.loadMoreCards();
    }

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
      platform: [],
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
    this.updateFilteredRegions();
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
        platform: filters.platform ?? null,
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
      tap(vm => {
        if (this.isSearching && this.searchView === 'table' && vm.status !== 'loading') {
          this.isSearching = false;
          this.searchView = null;
        }

        if (vm.status === 'error' && vm.error) this._alerts.showAlert({ icon: 'error', title: 'Error', html: vm.error.message, showCancelButton: false, confirmText: 'Close' });
      }),
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

    // Get unique regions from COUNTRY_REGION_INDEX
    this.regions = [...new Set(Object.values(COUNTRY_REGION_INDEX).map(location => location.region))];

    // Initially show all regions and countries
    this.updateFilteredRegions();
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

  clearSelectedCountries(): void {
    this.filtersForm.get('country')?.setValue([]);
    this.countrySearchCtrl.setValue('', { emitEvent: false });

    if (this.countryInput) {
      this.countryInput.nativeElement.value = '';
      this.countryInput.nativeElement.focus();
    }

    this.updateFilteredCountries();
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

  get cardsEndMessage(): { key: string; params?: Record<string, string> } {
    const filters = this.filters$.value;
    const priority: LocationFilter[] = ['country', 'region', 'continent'];

    // Find a single selected location filter
    const selectedFilter = priority
      .map(filter => ({
        filter,
        values: filters[filter]?.split(',').filter(Boolean) ?? [],
      }))
      .find(item => item.values.length === 1);

    // Check whether multiple locations are selected
    const hasMultipleLocations = priority.some(filter => {
      const values = filters[filter]?.split(',').filter(Boolean) ?? [];
      return values.length > 1;
    });

    // Check whether other filters are active
    const hasOtherFilters = Object.entries(filters).some(([key, value]) => {
      if ([...priority, 'from', 'to', 'limit', 'page'].includes(key)) {
        return false;
      }
      return value !== undefined && value !== null && value !== '';
    });

    if (selectedFilter && !hasMultipleLocations) {
      const config = this.cardsEndMessageConfig[selectedFilter.filter];
      return {
        key: config.key,
        params: {
          [config.param]: config.getName(selectedFilter.values[0]),
        },
      };
    }
    return {
      key: hasOtherFilters || hasMultipleLocations ? 'GUESTS_VIEW.CARDS_END_FILTERS' : 'GUESTS_VIEW.CARDS_END',
    };
  }

  private parseFilters(params: Params): IQueryParamsGuests {
    const str = (key: string): string | undefined => params[key] || undefined;

    const num = (key: string): number | undefined => {
      const raw = params[key];
      if (raw === undefined || raw === '') return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined; // evita NaN
    };

    return {
      gender: GENDERS.find(g => g === params['gender']), // 'female' | 'male' | 'trans' | undefined

      platform: str('platform'),
      groupType: str('groupType'),
      continent: str('continent'),
      region: str('region'),
      country: str('country'),
      hometownState: str('hometownState'),
      livingInState: str('livingInState'),
      from: str('from'),
      to: str('to'),

      rating: num('rating'),
      day: str('day'),
      birthDate: str('birthDate'),

      gift: parseBooleanParam(params['gift']),
      gay: parseBooleanParam(params['gay']),
      isFirstTime: parseBooleanParam(params['isFirstTime']),
      hangOut: parseBooleanParam(params['hangOut']),
      ambassador: parseBooleanParam(params['ambassador']),
      didTheyReq: parseBooleanParam(params['didTheyReq']),
    };
  }

  private parseView(params: Params): ICurrentView {
    const view = params['view'];
    return view === 'cards' || view === 'map' ? view : 'table';
  }

  private restoreForm(params: Params, f: IQueryParamsGuests): void {
    this.filtersForm.patchValue(
      {
        continent: parseMultiParam(params['continent']),
        region: parseMultiParam(params['region']),
        country: parseMultiParam(params['country']),
        groupType: parseMultiParam(params['groupType']),
        platform: parseMultiParam(params['platform']),
        from: f.from ? new Date(`${f.from}T00:00:00`) : '',
        to: f.to ? new Date(`${f.to}T00:00:00`) : '',
        isFirstTime: f.isFirstTime ?? '',
        hangOut: f.hangOut ?? '',
        ambassador: f.ambassador ?? '',
        didTheyReq: f.didTheyReq ?? '',
      },
      { emitEvent: false }
    );
  }

  private listenQueryParams(): void {
    this._route.queryParams
      .pipe(
        map(params => ({
          params,
          filters: this.parseFilters(params),
          view: this.parseView(params),
        })),
        // view cuenta en la comparación, si no un cambio solo de vista se descartaría
        distinctUntilChanged((a, b) => a.view === b.view && normalizeFilters(a.filters) === normalizeFilters(b.filters)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ params, filters, view }) => {
        const viewChanged = this.currentView !== view;
        this.currentView = view;

        this.restoreForm(params, filters);
        this.updateFilteredRegions();
        this.updateFilteredCountries();

        if (normalizeFilters(filters) !== normalizeFilters(this.filters$.value)) {
          this.filters$.next(filters);
          this.page$.next({ page: 1, size: this.page$.value.size });
          this.resetCards();
          this.mapData = [];
          this.loadActiveView();
          return;
        }

        if (viewChanged) this.loadActiveView(true);
      });
  }

  private loadActiveView(onlyIfEmpty = false): void {
    if (this.currentView === 'cards' && (!onlyIfEmpty || !this.cardsData.length)) {
      this.loadMoreCards();
    }
    if (this.currentView === 'map' && (!onlyIfEmpty || !this.mapData.length)) {
      this.loadMapData();
    }
  }

  // INFINITE SCROLL
  // Load the next page of guests for the cards view
  loadMoreCards(): void {
    // Prevent duplicated requests or requests after an error
    if (this.cardsLoading || !this.cardsHasMore || this.cardsError) return;

    this.cardsLoading = true;

    this._guests
      .getAllGuests({
        limit: this.cardsPageSize,
        page: this.cardsPage,
        ...this.filters$.value,
      })
      .pipe(
        retry({
          count: 3,
          delay: error => {
            const isNetworkOrServerError = error.status === 0 || error.status >= 500;

            return isNetworkOrServerError ? timer(1000) : throwError(() => error);
          },
        })
      )
      .subscribe({
        next: response => {
          const newGuests = mapGuestTable(response.data);

          // Append the new guests instead of replacing existing cards
          this.cardsData = [...this.cardsData, ...newGuests];

          // Update pagination using the API response
          this.cardsPage = response.pagination.page + 1;
          this.cardsHasMore = response.pagination.hasNextPage;

          this.cardsError = null;
          this.cardsLoading = false;

          if (this.searchView === 'cards') {
            this.isSearching = false;
            this.searchView = null;
          }
        },

        error: error => {
          if (this.searchView === 'cards') {
            this.isSearching = false;
            this.searchView = null;
          }

          this.cardsLoading = false;

          // Store the translated error state
          this.cardsError = this._errH.handle(error);

          // Show the error alert only after all automatic retries fail
          this._alerts.showAlert({
            icon: 'error',
            title: this._translate.instant('GENERAL.ERROR'),
            html: this.cardsError.message,
            showCancelButton: false,
            confirmText: this._translate.instant('GENERAL.CLOSE'),
          });
        },
      });
  }

  // Reset the cards infinite scroll state
  private resetCards(): void {
    this.cardsData = [];
    this.cardsPage = 1;
    this.cardsHasMore = true;
    this.cardsLoading = false;
    this.cardsError = null;
  }

  retryCards(): void {
    if (this.cardsLoading || !this.cardsError) return;

    this.cardsError = null;
    this.loadMoreCards();
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
      .pipe(
        finalize(() => {
          this.mapLoading = false;

          if (this.searchView === 'map') {
            this.isSearching = false;
            this.searchView = null;
          }
        })
      )
      .subscribe({
        next: response => {
          this.mapData = mapGuestTable(response.data);
        },
        error: () => {
          this.mapData = [];
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
      const validRegions = selectedRegions.filter(region => !selectedContinents.length || selectedContinents.includes(REGION_CONTINENT_INDEX[region]));

      // Keep only countries compatible with the selected continents and regions
      const validCountries = selectedCountries.filter(code => {
        const location = getCountryLocation(code);

        return (
          !!location && (!selectedContinents.length || selectedContinents.includes(location.continent)) && (!selectedRegions.length || validRegions.includes(location.region))
        );
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
        const location = getCountryLocation(code);

        return (
          !!location && (!selectedContinents.length || selectedContinents.includes(location.continent)) && (!selectedRegions.length || selectedRegions.includes(location.region))
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
    this.filteredRegions = selectedContinents.length ? this.regions.filter(region => selectedContinents.includes(REGION_CONTINENT_INDEX[region])) : [...this.regions];

    this.sortRegionsByLanguage();
    this.groupFilteredRegionsByContinent();
  }

  private groupFilteredRegionsByContinent(): void {
    this.filteredRegionGroups = this.continents
      .map(continent => ({
        continent,
        regions: this.filteredRegions.filter(region => REGION_CONTINENT_INDEX[region] === continent),
      }))
      .filter(group => group.regions.length > 0);
  }

  private updateFilteredCountries(): void {
    const selectedContinents = (this.filtersForm.get('continent')?.value ?? []) as Continents[];
    const selectedRegions = (this.filtersForm.get('region')?.value ?? []) as Regions[];
    const selectedCountries = (this.filtersForm.get('country')?.value ?? []) as CountriesCodes[];

    const search = this.countrySearchCtrl.value ?? '';
    const availableCountries = this.countries.filter(country => {
      const location = getCountryLocation(country.countryCode);

      if (!location) return false;
      const matchesContinent = !selectedContinents.length || selectedContinents.includes(location.continent);
      const matchesRegion = !selectedRegions.length || selectedRegions.includes(location.region);
      return matchesContinent && matchesRegion;
    });

    const filtered = this._countrySearch.filter(availableCountries, search);

    // Selected countries first.
    this.filteredCountries = [
      ...filtered.filter(country => selectedCountries.includes(country.countryCode)),
      ...filtered.filter(country => !selectedCountries.includes(country.countryCode)),
    ];
  }
}
