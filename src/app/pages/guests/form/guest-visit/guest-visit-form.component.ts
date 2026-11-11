import { Component, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren, OnChanges, inject, SimpleChanges, ElementRef } from '@angular/core';

// Interfaces
import { IGroupEdit, IGuestDetail } from '@interfaces/guests.interface';

// Components
import { TripFormComponent } from '@pages/guests/form/trip-form/trip-form.component';
import { GuestFormComponent } from '@pages/guests/form/guest-form/guest-form.component';

// Services
import { AlertsService } from '@core/services/alerts.service';
import { TranslateService } from '@ngx-translate/core';
import { IGuestFormItem, IGuestsFormSubmit } from '../../../../interfaces/guest-form.interface';
import Swal from 'sweetalert2';
import { MatRadioGroup } from '@angular/material/radio';

@Component({
  selector: 'guest-visit-form',
  templateUrl: './guest-visit-form.component.html',
  styleUrls: ['./guest-visit-form.component.css'],
})
export class GuestsFormComponent implements OnChanges {
  @ViewChild(TripFormComponent) tripFormComponent!: TripFormComponent;
  @ViewChild(MatRadioGroup) groupTypeRadio!: MatRadioGroup;

  @ViewChild('guestSlider') guestSlider?: ElementRef<HTMLDivElement>;

  @ViewChildren(GuestFormComponent)
  guestForms!: QueryList<GuestFormComponent>;

  // Guest slider controls
  canScrollPrev = false;
  canScrollNext = false;

  @Output() submitForm = new EventEmitter<IGuestsFormSubmit>();

  @Input() guest?: IGuestDetail;
  @Input() group?: IGroupEdit;

  @Input() mode: 'create' | 'edit' = 'create';

  // Group Type
  public selectedGroupType: 'solo' | 'couple' | 'friends' | 'family' | null = null;

  formsToShow = 0;

  // Form
  wasFormSubmitted = false;

  // Guest Forms
  guestFormItems: IGuestFormItem[] = [];
  private nextGuestFormId = 0;

  // Add Form
  limitGroupMembers = 5;

  private _alerts = inject(AlertsService);
  private _translate = inject(TranslateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mode !== 'edit') return;

    if (changes['guest'] || changes['group']) {
      this.loadData();
    }
  }

  private loadData(): void {
    // Reset form collection
    this.guestFormItems = [];
    this.nextGuestFormId = 0;

    // Solo
    if (this.guest) {
      this.selectedGroupType = 'solo';
      this.formsToShow = 1;

      this.guestFormItems = [
        {
          id: this.nextGuestFormId++,
          guest: this.guest,
        },
      ];

      return;
    }

    // Group
    if (this.group?.length) {
      this.selectedGroupType = this.group[0].groupType;
      this.formsToShow = this.group.length;

      this.guestFormItems = this.group.map(member => ({
        id: this.nextGuestFormId++,
        guest: member,
      }));
    }
  }

  trackByGuestForm(index: number, item: IGuestFormItem): number {
    return item.id;
  }

  selectGroupType(type: 'solo' | 'couple' | 'friends' | 'family'): void {
    // Ignore the current selection
    if (this.selectedGroupType === type) return;

    // Friends and family can have between 2 and 5 members
    const requiredForms = type === 'solo' ? 1 : type === 'couple' ? 2 : Math.max(2, this.guestFormItems.length);

    // Check if the new type requires removing members
    if (this.guestFormItems.length > requiredForms) {
      // Check only the forms that will be removed

      const formsToRemove = this.guestForms?.toArray().slice(requiredForms);

      const hasDataToRemove = formsToRemove?.some(form => form.hasFormData()) ?? false;

      if (hasDataToRemove) {
        this.reduceGroup(type, requiredForms);
        return;
      }

      this.guestFormItems = this.guestFormItems.slice(0, requiredForms);
    }

    // Add missing forms without recreating existing ones
    while (this.guestFormItems.length < requiredForms) {
      this.guestFormItems.push({
        id: this.nextGuestFormId++,
      });
    }

    this.selectedGroupType = type;
    this.formsToShow = this.guestFormItems.length;

    setTimeout(() => this.updateSliderControls());
  }

  submit(): void {
    if (!this.selectedGroupType) return;

    this.tripFormComponent.formTrip.markAllAsTouched();
    this.tripFormComponent.formTrip.updateValueAndValidity();

    const guestForms = this.guestForms.toArray();

    guestForms.forEach(form => {
      form.formCreateGuest.markAllAsTouched();
      form.formCreateGuest.updateValueAndValidity();
    });

    if (this.tripFormComponent.formTrip.invalid) {
      this.tripFormComponent.scrollToFirstInvalidControl();
      return;
    }

    const firstInvalidForm = guestForms.find(form => form.formCreateGuest.invalid);

    if (firstInvalidForm) {
      firstInvalidForm.scrollToFirstInvalidControl();
      return;
    }

    const trip = this.tripFormComponent.getFormValue();
    const guests = guestForms.map(form => form.getFormValue());

    this.submitForm.emit({
      groupType: this.selectedGroupType,
      trip,
      guests,
    });
  }

  addGuestForm(): void {
    // Check the maximum number of group members
    if (this.guestFormItems.length >= this.limitGroupMembers) {
      this._alerts.showToast({
        icon: 'warning',
        title: this._translate.instant('GUESTS_FORM.MAX_MEMBERS'),
      });
      return;
    }
    this.guestFormItems.push({
      id: this.nextGuestFormId++,
    });

    this.formsToShow = this.guestFormItems.length;

    this._alerts.showToast({
      icon: 'success',
      title: this._translate.instant('GUESTS_FORM.ADD_GUEST.SUCCESS'),
    });

    // Wait until Angular renders the new guest form.
    setTimeout(() => {
      const slider = this.guestSlider?.nativeElement;

      if (!slider) return;

      slider.scrollTo({
        left: slider.scrollWidth - slider.clientWidth,
        behavior: 'smooth',
      });

      this.updateSliderControls();
    });
  }

  async removeGuestForm(id: number): Promise<void> {
    // Prevent removing the only remaining guest form
    if (this.guestFormItems.length <= 1) return;

    // Show confirmation before removing the guest
    const result = await this._alerts.showAlert({
      title: this._translate.instant('GUESTS_FORM.REMOVE_GUEST.TITLE'),
      html: this._translate.instant('GUESTS_FORM.REMOVE_GUEST.DESCRIPTION'),
      icon: 'warning',
      confirmText: this._translate.instant('GUESTS_FORM.REMOVE_GUEST.CONFIRM'),
      cancelText: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CANCEL'),
    });

    // Keep the form if the action is cancelled
    if (!result.isConfirmed) return;

    // Remove the selected guest form
    this.guestFormItems = this.guestFormItems.filter(item => item.id !== id);

    // Switch to solo when only one member remains
    if (this.guestFormItems.length === 1) {
      this.selectedGroupType = 'solo';
    }
    this.formsToShow = this.guestFormItems.length;
    setTimeout(() => this.updateSliderControls());
  }

  private async reduceGroup(type: 'solo' | 'couple' | 'friends' | 'family', requiredForms: number): Promise<void> {
    const isSolo = type === 'solo';
    const inputType = isSolo ? 'radio' : 'checkbox';
    const inputName = isSolo ? 'guest-selection-solo' : 'guest-selection';

    const minSelections = 1;
    const maxSelections = isSolo ? 1 : requiredForms;

    // Build the member selection list
    const html = this.guestFormItems
      .map(
        (item, index) => `
      <label class="guest-selection-item">
        <input
          type="${inputType}"
          name="${inputName}"
          value="${item.id}"
        />
        ${this._translate.instant('GUESTS_FORM.GUEST_NUMBER', {
          number: index + 1,
        })}
      </label>
    `
      )
      .join('');

    // First confirmation: Select members to keep
    const selection = await this._alerts.showAlert({
      title: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.SELECT_TITLE'),
      html: `
      <p>${this._translate.instant('GUESTS_FORM.CHANGE_TYPE.SELECT_DESCRIPTION', { count: isSolo ? 1 : '1 o 2' })}</p>
      <div class="guest-selection-list">${html}</div>
    `,
      icon: 'question',
      confirmText: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.APPLY'),
      cancelText: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CANCEL'),
      opts: {
        didOpen: () => {
          const confirmButton = Swal.getConfirmButton();

          const inputs = Swal.getHtmlContainer()?.querySelectorAll<HTMLInputElement>(`input[name="${inputName}"]`);

          if (confirmButton) confirmButton.disabled = true;

          inputs?.forEach(input => {
            input.addEventListener('change', () => {
              const selected = Swal.getHtmlContainer()?.querySelectorAll<HTMLInputElement>(`input[name="${inputName}"]:checked`);

              const selectedCount = selected?.length ?? 0;

              if (confirmButton) {
                confirmButton.disabled = selectedCount < minSelections || selectedCount > maxSelections;
              }
            });
          });
        },
        preConfirm: () => {
          const selected = Swal.getHtmlContainer()?.querySelectorAll<HTMLInputElement>(`input[name="${inputName}"]:checked`);

          return Array.from(selected ?? []).map(input => Number(input.value));
        },
      },
    });

    // Keep current state if selection is cancelled
    if (!selection.isConfirmed || !Array.isArray(selection.value)) {
      this.restoreGroupTypeSelection();
      return;
    }

    const selectedIds = selection.value as number[];

    if (selectedIds.length < minSelections || selectedIds.length > maxSelections) {
      this.restoreGroupTypeSelection();
      return;
    }

    // Second confirmation: Confirm member removal
    const confirmation = await this._alerts.showAlert({
      title: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CONFIRM_TITLE'),
      html: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CONFIRM_DESCRIPTION'),
      icon: 'warning',
      confirmText: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CONFIRM'),
      cancelText: this._translate.instant('GUESTS_FORM.CHANGE_TYPE.CANCEL'),
    });

    // Keep current state if confirmation is cancelled
    if (!confirmation.isConfirmed) {
      this.restoreGroupTypeSelection();
      return;
    }

    // Keep only selected members
    this.guestFormItems = this.guestFormItems.filter(item => selectedIds.includes(item.id));

    // If only one member was selected for Couple,
    // create a second empty guest form
    if (type === 'couple' && this.guestFormItems.length === 1) {
      this.guestFormItems.push({
        id: this.nextGuestFormId++,
      });
    }

    this.selectedGroupType = type;
    this.formsToShow = this.guestFormItems.length;

    setTimeout(() => {
      const slider = this.guestSlider?.nativeElement;

      if (slider) {
        slider.scrollTo({
          left: 0,
          behavior: 'smooth',
        });
      }

      this.updateSliderControls();
    });
  }

  // Restore the previous radio selection when the type change is cancelled
  private restoreGroupTypeSelection(): void {
    if (this.groupTypeRadio) {
      this.groupTypeRadio.value = this.selectedGroupType;
    }
  }

  // Navigate between guest forms in the slider
  scrollGuestSlider(direction: 'prev' | 'next'): void {
    const slider = this.guestSlider?.nativeElement;
    if (!slider) return;

    slider.scrollBy({
      left: direction === 'next' ? slider.clientWidth : -slider.clientWidth,
      behavior: 'smooth',
    });
  }

  updateSliderControls(): void {
    const slider = this.guestSlider?.nativeElement;

    if (!slider) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      return;
    }

    this.canScrollPrev = slider.scrollLeft > 1;

    this.canScrollNext = slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 1;
  }
}
