import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Cdk
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// Material
import { ErrorStateMatcher } from '@angular/material/core';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';

// Services
import { AlertsService } from '@services/alerts.service';
import { CityService, ICity, IState } from '@services/city.service';

// Interfaces
import { IBodyGuest, IGuestDetail } from '@interfaces/guests.interface';

//Types
import { ICountry } from '@type/word.types';
import { CountriesCodes } from '@type/word.types';

// Const
import { WORLD } from '@config/world';
import { OCCUPATIONS_BY_AREA } from '@config/occupations/occupations';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.component.html',
  styleUrls: ['./guest-form.component.css'],
})
export class GuestFormComponent implements OnInit {
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
    1: 'Super Bad',
    2: 'Bad',
    3: 'Normal',
    4: 'Good',
    5: 'Excelent',
  };

  // BirthDate Limit
  maxBirthDate: Date = new Date();
  minBirthDate: Date = new Date(new Date().getFullYear() - 130, new Date().getMonth(), new Date().getDay());

  // Nights
  howManyNights: number = 20;
  nights: number[] = new Array(this.howManyNights).fill(0).map((_, idx) => idx + 1);

  // Countries
  countries: Array<ICountry & { countryCode: CountriesCodes }> = [];

  // Occupations
  occupationAreas = Object.keys(OCCUPATIONS_BY_AREA);
  occupations: string[] = [];

  // Gifts
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  gifts: { name: string }[] = [];

  // Autocomplete Countries
  filteredCountries: typeof this.countries = [];
  filteredLiving: typeof this.countries = [];

  // States
  hometownStates: IState[] = [];
  livingInStates: IState[] = [];

  // Cities
  hometownCities: ICity[] = [];
  livingInCities: ICity[] = [];

  private readonly destroyRef = inject(DestroyRef);

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

  constructor(
    private fb: FormBuilder,
    private _alerts: AlertsService,
    private announcer: LiveAnnouncer,
    private _city: CityService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDataCountries();

    setTimeout(() => {
      this.filteredCountries = this.countries;
      this.filteredLiving = this.countries;
    });

    this.formCreateGuest.patchValue({ groupType: this.selectedGroupType });

    this.onOccupation();

    this.listenHometownCountry();
    this.listenHometownState();

    this.listenLivingCountry();
    this.listenLivingState();
  }

  initForm(): void {
    this.formCreateGuest = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      instagram: ['', [Validators.maxLength(30)]],
      urlProfileCs: ['', [Validators.required, Validators.maxLength(50)]],
      birthDate: [''],
      gender: ['', [Validators.required]],
      continent: [''],
      region: [''],
      hometownCode: ['', Validators.required],
      hometownState: [''],
      hometownCity: [''],
      livingInCode: ['', Validators.required],
      livingInState: [''],
      livingInCity: [''],
      prefixCode: ['', Validators.required],
      whatsapp: ['', [Validators.required, Validators.maxLength(16), Validators.pattern(/^\+?[1-9]\d{7,14}$/)]],
      occupationArea: [[], Validators.required],
      occupation: [[]],
      rating: [''],
      comments: ['', [Validators.maxLength(500)]],
      gift: [[]],
      // Type Form
      groupType: [this.selectedGroupType, Validators.required],
      isFirstTime: [false],
      isGay: [false],
      hangOut: [false],
      theirReference: ['', [Validators.maxLength(500)]],
      myReference: ['', [Validators.maxLength(500)]],
    });

    if (!this.guest) {
      return;
    }

    this.formCreateGuest.patchValue({
      fullName: this.guest.fullName,
      instagram: this.guest.instagram,
      urlProfileCs: this.guest.urlProfileCs,
      birthDate: this.guest.birthDate,
      gender: this.guest.gender,
      continent: this.guest.continent,
      region: this.guest.region,
      hometownCode: this.guest.hometownCode,
      // hometownState: this.guest.hometownState,
      // hometownCity: this.guest.hometownCity,
      livingInCode: this.guest.livingInCode,
      // livingInState: this.guest.livingInState,
      // livingInCity: this.guest.livingInCity,
      prefixCode: this.guest.prefixCode,
      whatsapp: this.guest.whatsapp,
      // occupationArea: this.guest.occupationArea,
      occupation: this.guest.occupation,
      rating: this.guest.rating,
      comments: this.guest.comments,
      groupType: this.guest.groupType,
      gift: this.guest.gift,
      isFirstTime: this.guest.isFirstTime,
      hangOut: this.guest.hangOut,
      isGay: this.guest.isGay,
      theirReference: this.guest.theirReference,
      myReference: this.guest.myReference,
    });
    this.gifts = this.guest.gift.map(name => ({ name }));
  }

  onSubmit(): void {
    if (this.formCreateGuest.invalid) {
      this.formCreateGuest.markAllAsTouched();
      return;
    }
  }

  private formatDate(dateValue: string | Date | null): string {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  private buildGuestPayload(): IBodyGuest {
    const { occupationArea, hometownState, hometownCity, livingInState, livingInCity, ...guest } = this.formCreateGuest.getRawValue();

    return {
      ...guest,
      birthDate: this.formatDate(guest.birthDate),
      hometown: [hometownCity?.name, hometownState?.name].filter(Boolean).join(', '),
      livingIn: [livingInCity?.name, livingInState?.name].filter(Boolean).join(', '),
    };
  }

  getMaxLength(controlName: string): number {
    const control = this.formCreateGuest?.get(controlName);
    if (!control || !control.validator) return 0;

    // Run the validator against an artificially long mock control to grab the limit number
    const errors = control.validator({ value: 'x'.repeat(100000) } as any);
    return errors?.['maxlength']?.['requiredLength'] || 0;
  }

  displayCountryCode = (countryCode: string | null): string => {
    if (!countryCode) return '';
    const country = this.countries.find(country => country.countryCode === countryCode);
    return country?.name ?? '';
  };

  private onOccupation(): void {
    this.formCreateGuest
      .get('occupationArea')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((areas: string[]) => {
        if (!areas?.length) {
          this.occupations = [];
          this.formCreateGuest.patchValue({ occupation: [] });
          return;
        }

        const occupations = areas.flatMap(area => OCCUPATIONS_BY_AREA[area] || []);
        this.occupations = [...new Set(occupations)];
        this.formCreateGuest.patchValue({ occupation: [] });
      });
  }

  starsRating(rating: number): void {
    this.formCreateGuest.patchValue({ rating });
  }

  getRatingMsg() {
    const rating = this.hoverRating || this.formCreateGuest.get('rating')?.value;
    return this.ratingMsgs[rating];
  }

  loadDataCountries(): void {
    this.countries = (Object.entries(WORLD) as [CountriesCodes, ICountry][])
      .map(([countryCode, country]) => ({ countryCode, ...country }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private listenHometownCountry(): void {
    this.hometownCodeCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(countryCode => {
      if (!countryCode) {
        this.resetHometownLocation();
        return;
      }

      const country = this.findCountry(countryCode);
      if (!country) return;

      this.updateCountryInfo(country);
      this.loadHometownStates(countryCode);
      this.setDefaultPrefix(country.prefix);
    });
  }

  private listenHometownState(): void {
    this.hometownStateCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state: IState) => {
      if (!state?.iso2) {
        this.hometownCities = [];
        return;
      }

      const apiCountryCode = this.getCountryApiCode();
      if (!apiCountryCode) return;
      this.loadHometownCities(apiCountryCode, state.iso2);
    });
  }

  private listenLivingCountry(): void {
    this.livingInCodeCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(countryCode => {
      if (!countryCode) {
        this.livingInStates = [];
        this.livingInCities = [];
        return;
      }

      const apiCountryCode = WORLD[countryCode as keyof typeof WORLD]?.flag;
      if (!apiCountryCode) return;

      this._city
        .getStates(apiCountryCode)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((states: IState[]) => {
          this.livingInStates = states;
          this.livingInCities = [];
          this.formCreateGuest.patchValue({ livingInState: '', livingInCity: '' });
        });
    });
  }

  private listenLivingState(): void {
    this.livingInStateCtrl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state: IState) => {
      if (!state?.iso2) {
        this.livingInCities = [];
        return;
      }

      const countryCode = this.livingInCodeCtrl?.value;
      if (!countryCode) return;
      const apiCountryCode = WORLD[countryCode as keyof typeof WORLD]?.flag;
      if (!apiCountryCode) return;

      this._city
        .getCities(apiCountryCode, state.iso2)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((cities: ICity[]) => {
          this.livingInCities = cities;
          this.formCreateGuest.patchValue({ livingInCity: '' });
        });
    });
  }

  private findCountry(countryCode: string): (ICountry & { countryCode: CountriesCodes }) | undefined {
    return this.countries.find(country => country.countryCode === countryCode);
  }

  private updateCountryInfo(country: ICountry): void {
    this.formCreateGuest.patchValue({
      continent: country.continent,
      region: country.region,
    });
  }

  private getCountryApiCode(): string | null {
    const hometownCode = this.hometownCodeCtrl?.value;
    if (!hometownCode) return null;
    return WORLD[hometownCode as keyof typeof WORLD]?.flag ?? null;
  }

  private loadHometownStates(countryCode: string): void {
    const apiCountryCode = WORLD[countryCode as keyof typeof WORLD]?.flag;

    if (!apiCountryCode) return;

    this._city
      .getStates(apiCountryCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((states: IState[]) => {
        this.hometownStates = states;
        this.hometownCities = [];

        this.formCreateGuest.patchValue({ hometownState: '', hometownCity: '' });
      });
  }

  private loadHometownCities(countryCode: string, stateCode: string): void {
    this._city
      .getCities(countryCode, stateCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cities => {
        this.hometownCities = cities;
        this.formCreateGuest.patchValue({ hometownCity: '' });
      });
  }

  private setDefaultPrefix(prefix: string): void {
    if (this.prefixCodeCtrl?.value) return;
    this.formCreateGuest.patchValue({ prefixCode: prefix });
  }

  private resetHometownLocation(): void {
    this.hometownStates = [];
    this.hometownCities = [];
    this.formCreateGuest.patchValue({ continent: '', region: '', hometownState: '', hometownCity: '' });
  }

  filterHometowns(event: any): void {
    const value = event.target.value?.toLowerCase() || '';
    this.filteredCountries = this.countries.filter(country => country.name.toLowerCase().includes(value));
  }

  filterLiving(event: any): void {
    const value = event.target.value?.toLowerCase() || '';
    this.filteredLiving = this.countries.filter(country => country.name.toLowerCase().includes(value));
  }

  // GIFTS
  addGift(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Clear the input value
    event.chipInput!.clear();
    if (!value) return;

    if (this.gifts.length >= 15) {
      this._alerts.showToast({ icon: 'warning', title: 'maximum 15 gifts allowed' });
      return;
    }

    const isRepeat = this.gifts.some(gift => gift.name.toLowerCase() === value.toLowerCase());

    if (isRepeat) {
      this._alerts.showToast({ icon: 'warning', title: 'This gift has already been added' });
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
      this.announcer.announce(`Removed ${gift}`);
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
        title: 'This gift already exists',
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
      this._alerts.showToast({ icon: 'info', title: 'There are no gifts to clear' });
      return;
    }

    this.gifts.length = 0;
    this.updatedGiftsForm();

    this._alerts.showToast({ icon: 'success', title: 'Gift list cleared' });
  }

  btnSetToday(): void {
    this.formCreateGuest.patchValue({ visitedDate: new Date() });
  }

  getFormValue(): IBodyGuest {
    return this.buildGuestPayload();
  }

  isValid(controlName: string): boolean {
    const control = this.f[controlName];

    if (!(control.dirty || control.touched) || !control.valid) return false;
    const value = control.value;

    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.f[controlName];
    return !!(control.invalid && (control.dirty || control.touched));
  }
}
