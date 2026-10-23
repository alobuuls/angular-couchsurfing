import { Component, DestroyRef, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

// Cdk
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// Material
import { ErrorStateMatcher } from '@angular/material/core';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

// Services
import { AlertsService } from '@services/alerts.service';
import { CityService } from '@services/city.service';
import { FormatService } from '@services/format.service';

// Interfaces
import { IBodyGuest, IGuestDetail } from '@interfaces/guests.interface';
import { LocationConfig, ICity, IState } from '@interfaces/guest-form.interface';

// Types
import { ICountry, CountriesCodes, LANG, Language } from '@type/word.types';

// Const
import { WORLD } from '@config/world';
import { OCCUPATIONS_BY_AREA, OCCUPATION_AREA_TRANSLATIONS, OCCUPATION_TRANSLATIONS } from '@config/occupations/occupations';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.component.html',
  styleUrls: ['./guest-form.component.css'],
})
export class GuestFormComponent implements OnInit {
  // To scroll error
  @ViewChild('guestForm', { static: false }) guestForm!: ElementRef<HTMLFormElement>;

  // Group Form
  @Input() selectedGroupType: 'solo' | 'couple' | 'friends' | 'family' | null = null;

  @Output() save = new EventEmitter<IBodyGuest>();

  // Edit Form
  @Input() guest?: IGuestDetail;

  // Create Form
  formCreateGuest!: FormGroup;

  instantErrorMatcher: ErrorStateMatcher = {
    isErrorState: control => !!(control && control.invalid && (control.dirty || control.touched)),
  };

  // Rating
  stars: [number, number, number, number, number] = [1, 2, 3, 4, 5];
  hoverRating: number = 0;

  ratingMsgs: Record<number, string> = {
    1: 'GUEST_FORM.RATING.1',
    2: 'GUEST_FORM.RATING.2',
    3: 'GUEST_FORM.RATING.3',
    4: 'GUEST_FORM.RATING.4',
    5: 'GUEST_FORM.RATING.5',
  };

  // BirthDate Limit
  maxBirthDate: Date = new Date();
  minBirthDate: Date = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 130);
    return date;
  })();

  // Nights
  howManyNights: number = 20;
  nights: number[] = new Array(this.howManyNights).fill(0).map((_, idx) => idx + 1);

  // Countries
  countries: Array<ICountry & { countryCode: CountriesCodes }> = [];

  // Occupations
  occupationAreas = Object.keys(OCCUPATIONS_BY_AREA);
  occupations: string[] = [];

  // Gifts
  addOnBlur: boolean = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  gifts: { name: string }[] = [];

  // Autocomplete Countries
  filteredCountries: typeof this.countries = [];
  filteredLiving: typeof this.countries = [];
  filteredCountryWeMet: typeof this.countries = [];

  // Autocomplete Prefix
  filteredPrefixCountries: typeof this.countries = [];
  selectedPrefixCountry?: ICountry & { countryCode: CountriesCodes };

  // States
  hometownStates: IState[] = [];
  livingInStates: IState[] = [];
  weMetStates: IState[] = [];

  // Cities
  hometownCities: ICity[] = [];
  livingInCities: ICity[] = [];
  weMetCities: ICity[] = [];

  // Location loading states
  loadingHometownStates = false;
  loadingHometownCities = false;

  loadingLivingStates = false;
  loadingLivingCities = false;

  loadingWeMetStates = false;
  loadingWeMetCities = false;

  private isInitializingWeMetEdit = false;

  readonly maxLengths = {
    fullName: 100,
    instagram: 30,
    urlProfileCs: 50,
    locationWeMet: 100,
    whatsapp: 16,
    comments: 2000,
    theirReference: 1500,
    myReference: 1500,
  } as const;

  // Injects
  private readonly destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private _alerts = inject(AlertsService);
  private announcer = inject(LiveAnnouncer);
  private readonly _city = inject(CityService);
  private _translate = inject(TranslateService);
  private readonly _format = inject(FormatService);

  // Getters
  get f() {
    return this.formCreateGuest.controls;
  }

  private get hometownCodeCtrl() {
    return this.formCreateGuest.get('hometownCode');
  }

  private get hometownStateCtrl() {
    return this.formCreateGuest.get('hometownState');
  }

  private get livingInCodeCtrl() {
    return this.formCreateGuest.get('livingInCode');
  }

  private get livingInStateCtrl() {
    return this.formCreateGuest.get('livingInState');
  }

  private get prefixCodeCtrl() {
    return this.formCreateGuest.get('prefixCode');
  }

  private get weMetCountryCtrl() {
    return this.formCreateGuest.get('countryCodeWeMet');
  }

  private get weMetStateCtrl() {
    return this.formCreateGuest.get('stateWeMet');
  }

  ngOnInit(): void {
    this.initForm();

    this.loadDataCountries();

    this.listenLocationCountry('hometown');
    this.listenLocationState('hometown');

    this.listenLocationCountry('livingIn');
    this.listenLocationState('livingIn');

    this.listenLocationCountry('weMet');
    this.listenLocationState('weMet');

    if (this.guest) {
      this.patchGuestForm();
    }

    this.initializeLocationEdit();
    this.initializeWeMetEdit();

    this.onOccupation();

    this._translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.sortCountriesByLanguage();
      this.refreshCountryAutocompleteDisplays();
    });
  }

  private listenLocationCountry(type: 'hometown' | 'livingIn' | 'weMet'): void {
    const config = this.getLocationConfig(type);
    const countryControl = this.formCreateGuest.get(config.countryControl);

    const resetFields: Record<'hometown' | 'livingIn' | 'weMet', Record<string, string>> = {
      hometown: {
        hometownState: '',
        hometownCity: '',
        continent: '',
        region: '',
      },
      livingIn: {
        livingInState: '',
        livingInCity: '',
      },
      weMet: {
        stateWeMet: '',
        cityWeMet: '',
        locationWeMet: '',
      },
    };

    countryControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((countryCode: string | null) => {
      config.setStates([]);
      config.setCities([]);
      config.setLoadingStates(false);
      config.setLoadingCities(false);

      // Durante la edición, conservar los valores guardados de weMet
      // mientras se inicializan sus estados y ciudades.
      if (type === 'weMet' && this.isInitializingWeMetEdit) {
        if (countryCode) this.loadLocationStates(config);
        return;
      }

      // Limpiar los campos asociados al país seleccionado.
      this.formCreateGuest.patchValue(resetFields[type], { emitEvent: false });

      if (!countryCode) return;

      // Actualizar continente, región y prefijo únicamente para hometown.
      if (type === 'hometown') {
        const country = this.findCountry(countryCode);
        if (!country) return;

        this.updateCountryInfo(country);
        this.setDefaultPrefix(country.prefix);
      }

      this.loadLocationStates(config);
    });
  }

  private listenLocationState(type: 'hometown' | 'livingIn' | 'weMet'): void {
    const config = this.getLocationConfig(type);
    const stateControl = this.formCreateGuest.get(config.stateControl);

    stateControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state: IState | string | null) => {
      config.setCities([]);
      config.setLoadingCities(false);

      this.formCreateGuest.patchValue({ [config.cityControl]: '' }, { emitEvent: false });
      if (!state || typeof state === 'string' || !state.iso2) return;

      this.loadLocationCities(config, state);
    });
  }

  private findLocationByName<T extends { name: string }>(locations: T[], savedName: string): T | undefined {
    const normalizedName = this._city.normalizeLocation(savedName);
    return locations.find(item => this._city.normalizeLocation(item.name) === normalizedName);
  }

  private filterCountries(value: string): typeof this.countries {
    const normalizedValue = value.toLowerCase().trim();

    return this.countries.filter(
      country =>
        this.getCountryName(country.countryCode).toLowerCase().includes(normalizedValue) ||
        country.name.en.toLowerCase().includes(normalizedValue) ||
        country.countryCode.toLowerCase().includes(normalizedValue)
    );
  }

  private initializeLocationEdit(): void {
    if (!this.guest) return;
    this.initializeHometownEdit();
    this.initializeLivingEdit();
  }

  private initializeLocationFields(config: {
    countryCode: string | null | undefined;
    savedState: string;
    savedCity: string;
    states: IState[];
    setStates: (states: IState[]) => void;
    setCities: (cities: ICity[]) => void;
    setLoadingStates: (loading: boolean) => void;
    setLoadingCities: (loading: boolean) => void;
    stateControl: string;
    cityControl: string;
    preserveCountryListener?: boolean;
  }): void {
    const { countryCode, savedState, savedCity, setStates, setCities, setLoadingStates, setLoadingCities, stateControl, cityControl, preserveCountryListener = false } = config;

    if (!countryCode) return;

    const apiCountryCode = this._city.getApiCountryCode(countryCode);

    if (!apiCountryCode) {
      this.formCreateGuest.patchValue(
        {
          [stateControl]: savedState,
          [cityControl]: savedCity,
        },
        { emitEvent: false }
      );
      return;
    }

    if (preserveCountryListener) {
      this.isInitializingWeMetEdit = true;
    }

    setLoadingStates(true);

    this._city
      .getStates(apiCountryCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: states => {
          const availableStates = states ?? [];
          setStates(availableStates);
          setLoadingStates(false);

          const state = this.findLocationByName(availableStates, savedState);

          if (!state) {
            setCities([]);
            setLoadingCities(false);

            this.formCreateGuest.patchValue(
              {
                [stateControl]: savedState,
                [cityControl]: savedCity,
              },
              { emitEvent: false }
            );

            if (preserveCountryListener) {
              this.isInitializingWeMetEdit = false;
            }

            return;
          }

          this.formCreateGuest.patchValue({ [stateControl]: state }, { emitEvent: false });

          setLoadingCities(true);

          this._city
            .getCities(apiCountryCode, state.iso2)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: cities => {
                const availableCities = cities ?? [];
                setCities(availableCities);
                setLoadingCities(false);

                const city = this.findLocationByName(availableCities, savedCity);

                this.formCreateGuest.patchValue({ [cityControl]: city ?? savedCity }, { emitEvent: false });

                if (preserveCountryListener) {
                  this.isInitializingWeMetEdit = false;
                }
              },
              error: () => {
                setCities([]);
                setLoadingCities(false);

                this.formCreateGuest.patchValue({ [cityControl]: savedCity }, { emitEvent: false });

                if (preserveCountryListener) {
                  this.isInitializingWeMetEdit = false;
                }
              },
            });
        },
        error: () => {
          setStates([]);
          setCities([]);
          setLoadingStates(false);
          setLoadingCities(false);

          this.formCreateGuest.patchValue(
            {
              [stateControl]: savedState,
              [cityControl]: savedCity,
            },
            { emitEvent: false }
          );

          if (preserveCountryListener) {
            this.isInitializingWeMetEdit = false;
          }
        },
      });
  }

  private initializeWeMetEdit(): void {
    this.initializeLocationFields({
      countryCode: this.guest?.countryCodeWeMet,
      savedState: this.getLocationName(this.guest?.stateWeMet),
      savedCity: this.getLocationName(this.guest?.cityWeMet),
      states: this.weMetStates,
      setStates: states => (this.weMetStates = states),
      setCities: cities => (this.weMetCities = cities),
      setLoadingStates: loading => (this.loadingWeMetStates = loading),
      setLoadingCities: loading => (this.loadingWeMetCities = loading),
      stateControl: 'stateWeMet',
      cityControl: 'cityWeMet',
      preserveCountryListener: true,
    });
  }

  private initializeHometownEdit(): void {
    this.initializeLocationFields({
      countryCode: this.guest?.hometownCode,
      savedState: this.getLocationName(this.guest?.hometownState),
      savedCity: this.getLocationName(this.guest?.hometownCity),
      states: this.hometownStates,
      setStates: states => (this.hometownStates = states),
      setCities: cities => (this.hometownCities = cities),
      setLoadingStates: loading => (this.loadingHometownStates = loading),
      setLoadingCities: loading => (this.loadingHometownCities = loading),
      stateControl: 'hometownState',
      cityControl: 'hometownCity',
    });
  }

  private initializeLivingEdit(): void {
    this.initializeLocationFields({
      countryCode: this.guest?.livingInCode,
      savedState: this.getLocationName(this.guest?.livingInState),
      savedCity: this.getLocationName(this.guest?.livingInCity),
      states: this.livingInStates,
      setStates: states => (this.livingInStates = states),
      setCities: cities => (this.livingInCities = cities),
      setLoadingStates: loading => (this.loadingLivingStates = loading),
      setLoadingCities: loading => (this.loadingLivingCities = loading),
      stateControl: 'livingInState',
      cityControl: 'livingInCity',
    });
  }

  private patchGuestForm(): void {
    if (!this.guest) return;

    this.formCreateGuest.patchValue(
      {
        fullName: this.guest.fullName,
        instagram: this.guest.instagram,
        urlProfileCs: this.guest.urlProfileCs,
        birthDate: this.guest.birthDate,
        gender: this.guest.gender,
        continent: this.guest.continent,
        region: this.guest.region,

        hometownCode: this.guest.hometownCode,
        hometownState: this.guest.hometownState,
        hometownCity: this.guest.hometownCity,

        livingInCode: this.guest.livingInCode,
        livingInState: this.guest.livingInState,
        livingInCity: this.guest.livingInCity,

        countryCodeWeMet: this.guest.countryCodeWeMet,
        locationWeMet: this.guest.locationWeMet,
        stateWeMet: this.guest.stateWeMet,
        cityWeMet: this.guest.cityWeMet,

        prefixCode: this.guest.prefixCode,
        whatsapp: this.guest.whatsapp,
        occupationArea: this.guest.occupationArea,
        occupation: this.guest.occupation,
        rating: this.guest.rating,
        comments: this.guest.comments,
        groupType: this.guest.groupType,
        gift: this.guest.gift,

        isFirstTime: this.guest.isFirstTime,
        didTheyReq: this.guest.didTheyReq,
        hangOut: this.guest.hangOut,
        isGay: this.guest.isGay,
        ambassador: this.guest.ambassador ?? false,

        theirReference: this.guest.theirReference,
        myReference: this.guest.myReference,
      },
      { emitEvent: false }
    );

    this.gifts = (this.guest.gift ?? []).map(name => ({ name }));
  }

  initForm(): void {
    this.formCreateGuest = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(this.maxLengths.fullName)]],
      instagram: ['', [Validators.maxLength(this.maxLengths.instagram)]],
      urlProfileCs: ['', [Validators.maxLength(this.maxLengths.urlProfileCs)]],

      birthDate: [''],
      gender: ['', [Validators.required]],
      continent: [''],
      region: [''],

      hometownCode: ['', [Validators.required]],
      hometownState: [''],
      hometownCity: [''],

      livingInCode: [''],
      livingInState: [''],
      livingInCity: [''],

      countryCodeWeMet: ['', [Validators.required]],
      stateWeMet: [''],
      cityWeMet: [''],
      locationWeMet: ['', [Validators.maxLength(this.maxLengths.locationWeMet)]],

      prefixCode: [''],
      whatsapp: ['', [Validators.maxLength(this.maxLengths.whatsapp), Validators.pattern(/^\+?[1-9]\d{7,14}$/)]],

      occupationArea: [[]],
      occupation: [[]],
      otherOccupation: [''],

      rating: [''],
      comments: ['', [Validators.maxLength(this.maxLengths.comments)]],
      gift: [[]],
      groupType: [this.selectedGroupType, [Validators.required]],

      isFirstTime: [false],
      didTheyReq: [false],
      isGay: [false],
      hangOut: [false],
      ambassador: [false],

      theirReference: ['', [Validators.maxLength(this.maxLengths.theirReference)]],
      myReference: ['', [Validators.maxLength(this.maxLengths.myReference)]],
    });
  }

  scrollToFirstInvalidControl(): void {
    this.formCreateGuest.markAllAsTouched();
    this.formCreateGuest.updateValueAndValidity();

    setTimeout(() => {
      const firstInvalidControl = this.guestForm.nativeElement.querySelector(
        'input.ng-invalid, textarea.ng-invalid, mat-select.ng-invalid, mat-radio-group.ng-invalid'
      ) as HTMLElement;

      if (!firstInvalidControl) return;

      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private formatDate(dateValue: string | Date | null): string {
    if (!dateValue) return '';

    if (typeof dateValue === 'string') {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
      if (match) return dateValue;
    }

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildGuestPayload(): IBodyGuest {
    const { otherOccupation, hometownState, hometownCity, livingInState, livingInCity, stateWeMet, cityWeMet, ...guest } = this.formCreateGuest.getRawValue();

    // Normalizar ocupaciones y eliminar duplicados.
    const occupation = this.normalizeOccupations(guest.occupation, otherOccupation);

    const occupationArea = this.normalizeOccupations(guest.occupationArea, otherOccupation);

    // Normalizar ubicaciones: pueden ser objetos de la API
    // o valores introducidos manualmente.
    const hometownStateName = this.getLocationName(hometownState);
    const hometownCityName = this.getLocationName(hometownCity);
    const livingInStateName = this.getLocationName(livingInState);
    const livingInCityName = this.getLocationName(livingInCity);
    const cityWeMetName = this.getLocationName(cityWeMet);
    const stateWeMetName = this.getLocationName(stateWeMet);

    const payload: IBodyGuest = {
      ...guest,
      occupation,
      occupationArea,
      birthDate: this.formatDate(guest.birthDate),
      hometownCity: hometownCityName,
      hometownState: hometownStateName,
      livingInCity: livingInCityName,
      livingInState: livingInStateName,
      cityWeMet: cityWeMetName,
      stateWeMet: stateWeMetName,
    };

    // Omitir campos opcionales cuando no tienen valor.
    if (!guest.rating) delete payload.rating;
    if (!guest.birthDate) delete payload.birthDate;

    return payload;
  }

  getMaxLength(controlName: string): number {
    const control = this.formCreateGuest?.get(controlName);
    if (!control) return 0;

    const validator = control.validator;
    if (!validator) return 0;

    const errors = validator(new FormControl('x'.repeat(100000)));
    return errors?.['maxlength']?.['requiredLength'] ?? 0;
  }

  // Display the selected country in the current language
  displayCountryCode = (countryCode: string | null): string => {
    if (!countryCode) return '';
    const normalizedCode = countryCode.toLowerCase();
    const country = this.countries.find(country => country.countryCode.toLowerCase() === normalizedCode);
    return country ? this.getCountryName(country.countryCode) : '';
  };

  displayPrefix = (value: string | (ICountry & { countryCode: CountriesCodes }) | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.prefix;
  };

  // Refresh selected country labels without triggering value change listeners
  private refreshCountryAutocompleteDisplays(): void {
    const countryControls = ['hometownCode', 'livingInCode', 'countryCodeWeMet'];

    countryControls.forEach(controlName => {
      const control = this.formCreateGuest.get(controlName);
      const countryCode = control?.value;

      // Only refresh values that match a valid country code
      if (typeof countryCode !== 'string' || !this.countries.some(country => country.countryCode.toLowerCase() === countryCode.toLowerCase())) return;

      // Keep the selected code and refresh its displayed label
      control?.setValue(countryCode, { emitEvent: false });
    });

    // Refresh the selected prefix country reference.
    const prefix = this.prefixCodeCtrl?.value;

    this.selectedPrefixCountry = this.countries.find(country => country.prefix === prefix);
  }

  starsRating(rating: number): void {
    this.formCreateGuest.patchValue({ rating });
  }

  getRatingMsg(): string {
    const rating = this.hoverRating || this.formCreateGuest.get('rating')?.value;
    if (!rating) return '';
    return this._translate.instant(this.ratingMsgs[rating]);
  }

  showAllLivingCountries(): void {
    this.filteredLiving = [...this.countries];
  }

  showAllHometownCountries(): void {
    this.filteredCountries = [...this.countries];
  }

  showAllCountryWeMet(): void {
    this.filteredCountryWeMet = [...this.countries];
  }

  isLivingCountrySelected(countryCode: string): boolean {
    const selectedCode = this.formCreateGuest.get('livingInCode')?.value;
    return !!selectedCode && String(selectedCode).trim().toUpperCase() === countryCode.trim().toUpperCase();
  }

  isHometownCountrySelected(countryCode: string): boolean {
    const selectedCode = this.formCreateGuest.get('hometownCode')?.value;
    return !!selectedCode && String(selectedCode).trim().toUpperCase() === countryCode.trim().toUpperCase();
  }

  loadDataCountries(): void {
    this.countries = (Object.entries(WORLD) as [CountriesCodes, ICountry][]).map(([countryCode, country]) => ({
      countryCode,
      ...country,
    }));

    this.filteredLiving = [...this.countries];
    this.filteredCountries = [...this.countries];
    this.filteredCountryWeMet = [...this.countries];

    this.sortCountriesByLanguage();
  }

  private sortCountriesByLanguage(): void {
    const currentLang = this._translate.currentLang || 'en';
    const lang: Language = LANG.includes(currentLang as Language) ? (currentLang as Language) : 'en';

    const sortByCountryName = (countries: Array<ICountry & { countryCode: CountriesCodes }>) => {
      return [...countries].sort((a, b) => this.getCountryName(a.countryCode).localeCompare(this.getCountryName(b.countryCode), lang));
    };

    this.countries = sortByCountryName(this.countries);
    this.filteredCountries = sortByCountryName(this.filteredCountries);
    this.filteredLiving = sortByCountryName(this.filteredLiving);
    this.filteredCountryWeMet = sortByCountryName(this.filteredCountryWeMet);
    this.filteredPrefixCountries = sortByCountryName(this.filteredPrefixCountries);
  }

  private findCountry(countryCode: string): (ICountry & { countryCode: CountriesCodes }) | undefined {
    return this.countries.find(country => country.countryCode.toLowerCase() === countryCode.toLowerCase());
  }

  private updateCountryInfo(country: ICountry): void {
    this.formCreateGuest.patchValue({
      continent: country.continent,
      region: country.region,
    });
  }

  // PREFIX
  private setDefaultPrefix(prefix: string): void {
    if (this.prefixCodeCtrl?.value) return;
    this.formCreateGuest.patchValue({ prefixCode: prefix });
    this.selectedPrefixCountry = this.countries.find(country => country.prefix === prefix);
  }

  filterPrefixes(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase().trim();

    this.filteredPrefixCountries = this.countries.filter(
      country =>
        this.getCountryName(country.countryCode).toLowerCase().includes(value) ||
        country.name.en.toLowerCase().includes(value) ||
        country.countryCode.toLowerCase().includes(value) ||
        country.prefix.includes(value)
    );
  }

  selectPrefix(event: MatAutocompleteSelectedEvent): void {
    const country = event.option.value as ICountry & {
      countryCode: CountriesCodes;
    };

    this.selectedPrefixCountry = country;
    this.formCreateGuest.patchValue({
      prefixCode: country.prefix,
    });
  }

  private resetHometownLocation(): void {
    this.hometownStates = [];
    this.hometownCities = [];
    this.formCreateGuest.patchValue({ continent: '', region: '', hometownState: '', hometownCity: '' });
  }

  getCountryName(code: string): string {
    return this._format.formatCountry(code);
  }

  filterHometowns(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredCountries = this.filterCountries(value);
  }

  filterLiving(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredLiving = this.filterCountries(value);
  }

  filterCountryWeMet(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredCountryWeMet = this.filterCountries(value);
  }

  // GIFTS
  addGift(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Clear the input value
    event.chipInput!.clear();
    if (!value) return;

    if (this.gifts.length >= 15) {
      this._alerts.showToast({ icon: 'warning', title: this._translate.instant('GUEST_FORM.TOASTS.MAX_GIFTS') });
      return;
    }

    const isRepeat = this.gifts.some(gift => gift.name.toLowerCase() === value.toLowerCase());

    if (isRepeat) {
      this._alerts.showToast({ icon: 'warning', title: this._translate.instant('GUEST_FORM.TOASTS.DUPLICATE_GIFT') });
      return;
    }

    // Add our gift
    this.gifts.push({ name: value });
    this.updatedGiftsForm();
  }

  removeGift(gift: { name: string }): void {
    const index = this.gifts.indexOf(gift);

    if (index >= 0) {
      this.gifts.splice(index, 1);
      this.updatedGiftsForm();
      this.announcer.announce(this._translate.instant('GUEST_FORM.ANNOUNCEMENTS.GIFT_REMOVED'));
    }
  }

  editGift(gift: { name: string }, event: MatChipEditedEvent): void {
    const value = event.value.trim();

    // Remove gift if it no longer has a name
    if (!value) {
      this.removeGift(gift);
      return;
    }

    const isRepeat = this.gifts.some(item => item !== gift && item.name.toLowerCase() === value.toLowerCase());

    if (isRepeat) {
      this._alerts.showToast({
        icon: 'warning',
        title: this._translate.instant('GUEST_FORM.TOASTS.GIFT_EXISTS'),
      });
      return;
    }

    // Edit existing gift
    const index = this.gifts.indexOf(gift);
    if (index >= 0) {
      this.gifts[index].name = value;
      this.updatedGiftsForm();
    }
  }

  updatedGiftsForm(): void {
    this.formCreateGuest.patchValue({ gift: this.gifts.map(gift => gift.name) });
  }

  clearGiftInput(): void {
    if (!this.gifts.length) {
      this._alerts.showToast({ icon: 'info', title: this._translate.instant('GUEST_FORM.TOASTS.NO_GIFTS') });
      return;
    }

    this.gifts.length = 0;
    this.updatedGiftsForm();

    this._alerts.showToast({ icon: 'success', title: this._translate.instant('GUEST_FORM.TOASTS.GIFTS_CLEARED') });
  }

  btnSetToday(): void {
    this.formCreateGuest.patchValue({ visitedDate: new Date() });
  }

  getFormValue(): IBodyGuest {
    return this.buildGuestPayload();
  }

  isValid(controlName: string): boolean {
    const control = this.formCreateGuest.get(controlName);

    if (!control || control.invalid) return false;
    if (!(control.dirty || control.touched)) return false;
    const value = control.value;

    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.formCreateGuest.get(controlName);
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  // Normalizes location values API selectors return objects with a name property, while manual inputs return strings
  private getLocationName(value: { name: string } | string | null | undefined): string {
    // Handle manually entered values
    if (typeof value === 'string') return value.trim();
    // Handle values selected from the API
    if (value && typeof value === 'object') return value.name?.trim() ?? '';
    // Return an empty string when no value is provided
    return '';
  }

  private loadLocationStates(config: LocationConfig): void {
    const countryCode = this.formCreateGuest.get(config.countryControl)?.value;
    const apiCountryCode = this._city.getApiCountryCode(countryCode);

    config.setStates([]);
    config.setCities([]);
    config.setLoadingStates(false);
    config.setLoadingCities(false);

    if (!apiCountryCode) return;

    config.setLoadingStates(true);

    this._city
      .getStates(apiCountryCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: states => {
          config.setStates(states ?? []);
          config.setLoadingStates(false);
        },
        error: () => {
          config.setStates([]);
          config.setCities([]);
          config.setLoadingStates(false);
          config.setLoadingCities(false);
        },
      });
  }

  private loadLocationCities(config: LocationConfig, state: IState | string | null): void {
    config.setCities([]);
    config.setLoadingCities(false);

    if (!state || typeof state === 'string' || !state.iso2) {
      return;
    }

    const countryCode = this.formCreateGuest.get(config.countryControl)?.value;
    const apiCountryCode = this._city.getApiCountryCode(countryCode);

    if (!apiCountryCode) return;

    config.setLoadingCities(true);

    this._city
      .getCities(apiCountryCode, state.iso2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cities => {
          config.setCities(cities ?? []);
          config.setLoadingCities(false);
        },
        error: () => {
          config.setCities([]);
          config.setLoadingCities(false);
        },
      });
  }

  private getLocationConfig(type: 'hometown' | 'livingIn' | 'weMet'): LocationConfig {
    const configs: Record<'hometown' | 'livingIn' | 'weMet', LocationConfig> = {
      hometown: {
        countryControl: 'hometownCode',
        stateControl: 'hometownState',
        cityControl: 'hometownCity',
        getStates: () => this.hometownStates,
        setStates: states => (this.hometownStates = states),
        setCities: cities => (this.hometownCities = cities),
        setLoadingStates: loading => (this.loadingHometownStates = loading),
        setLoadingCities: loading => (this.loadingHometownCities = loading),
      },

      livingIn: {
        countryControl: 'livingInCode',
        stateControl: 'livingInState',
        cityControl: 'livingInCity',
        getStates: () => this.livingInStates,
        setStates: states => (this.livingInStates = states),
        setCities: cities => (this.livingInCities = cities),
        setLoadingStates: loading => (this.loadingLivingStates = loading),
        setLoadingCities: loading => (this.loadingLivingCities = loading),
      },

      weMet: {
        countryControl: 'countryCodeWeMet',
        stateControl: 'stateWeMet',
        cityControl: 'cityWeMet',
        getStates: () => this.weMetStates,
        setStates: states => (this.weMetStates = states),
        setCities: cities => (this.weMetCities = cities),
        setLoadingStates: loading => (this.loadingWeMetStates = loading),
        setLoadingCities: loading => (this.loadingWeMetCities = loading),
      },
    };

    return configs[type];
  }

  private onOccupation(): void {
    const areaControl = this.formCreateGuest.get('occupationArea');
    const occupationControl = this.formCreateGuest.get('occupation');

    if (!areaControl || !occupationControl) return;

    const getAvailableOccupations = (areas: string[] = []): string[] => [...new Set(areas.flatMap(area => OCCUPATIONS_BY_AREA[area] ?? []))];

    const updateOccupations = (areas: string[] = []): void => {
      const savedOccupations: string[] = occupationControl.value ?? [];
      const availableOccupations = getAvailableOccupations(areas);

      // Mantener las opciones del catálogo y las ocupaciones
      // personalizadas que ya estaban guardadas.
      this.occupations = [...new Set([...availableOccupations, ...savedOccupations])];
    };

    // Inicializar las opciones sin perder las selecciones existentes.
    updateOccupations(areaControl.value ?? []);

    // Actualizar las ocupaciones cuando cambien las áreas.
    areaControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((areas: string[] | null) => {
      const selectedAreas = areas ?? [];
      const previousOccupations: string[] = occupationControl.value ?? [];
      const availableOccupations = getAvailableOccupations(selectedAreas);

      // Conservar las ocupaciones que pertenecen a las áreas elegidas
      // y las personalizadas que no existen en el catálogo.
      const retainedOccupations = previousOccupations.filter(
        occupation => availableOccupations.includes(occupation) || !Object.values(OCCUPATIONS_BY_AREA).some(list => list.includes(occupation))
      );

      this.occupations = [...new Set([...availableOccupations, ...retainedOccupations])];

      occupationControl.setValue(retainedOccupations, {
        emitEvent: false,
      });
    });
  }

  private normalizeOccupations(occupations: string[] | null, otherOccupation: string | null): string[] {
    const result = [...new Set(occupations ?? [])];
    const otherIndex = result.indexOf('Write another occupation');

    if (otherIndex !== -1) {
      result.splice(otherIndex, 1);
      const customOccupation = otherOccupation?.trim();
      if (customOccupation && !result.some(occupation => occupation.toLowerCase() === customOccupation.toLowerCase())) result.push(customOccupation);
    }

    return result;
  }

  getOccupationAreaLabel(area: string): string {
    const lang = this._translate.currentLang || 'en';
    return OCCUPATION_AREA_TRANSLATIONS[area]?.[lang as 'en' | 'es'] ?? OCCUPATION_AREA_TRANSLATIONS[area]?.en ?? area;
  }

  getOccupationLabel(occupation: string): string {
    const lang = this._translate.currentLang || 'en';
    return OCCUPATION_TRANSLATIONS[occupation]?.[lang as 'en' | 'es'] ?? OCCUPATION_TRANSLATIONS[occupation]?.en ?? occupation;
  }
}
