import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { IGiftGuest, IGiftsDistribution, IGiftsView } from '@interfaces/stats-interface';
import { TChartTooltipContent } from '@type/chart.types';
import { IGiftsChartVm } from '@interfaces/charts/chart-gifts.interface';

// Helpers
import { getColorWithOpacity, GIFTS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-gifts-chart',
  templateUrl: './guest-gifts-chart.component.html',
  styleUrls: ['./guest-gifts-chart.component.css'],
})
export class GuestGiftsChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  @Input() gifts!: IGiftsDistribution;

  // Controls the currently selected gifts view.
  selectedView: IGiftsView = 'groups';

  // Available gifts views.
  readonly giftsViews: IGiftsView[] = ['groups', 'solo'];

  // Labels displayed in the view buttons.
  readonly giftsViewLabels: Record<IGiftsView, string> = {
    groups: 'STATS.GIFTS.VIEWS.GROUPS',
    solo: 'STATS.GIFTS.VIEWS.SOLO',
  };

  // Data of the chart. Undefined when there is nothing to display.
  vm?: IGiftsChartVm;

  // Configuration for each gifts view.
  private readonly chartConfig: Record<IGiftsView, { titleKey: string; getData: (gifts: IGiftsDistribution) => IGiftGuest[] }> = {
    groups: { titleKey: 'STATS.GIFTS.TITLES.GROUPS', getData: gifts => gifts.groups },
    solo: { titleKey: 'STATS.GIFTS.TITLES.SOLO', getData: gifts => gifts.solo },
  };

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildVm());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gifts']) {
      this.buildVm();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  selectView(view: IGiftsView): void {
    if (this.selectedView === view) {
      return;
    }

    this.selectedView = view;
    this.buildVm();
  }

  onItemClick(index: number): void {
    const guest = this.vm?.items[index];

    if (!guest?.guestId) {
      return;
    }

    this._router.navigate(['/guests', guest.guestId]);
  }

  // Arrow function: it keeps `this` and has a stable reference.
  getTooltip = (index: number): TChartTooltipContent | null => {
    const guest = this.vm?.items[index];

    if (!guest) {
      return null;
    }

    return {
      title: guest.fullName,
      rows: [
        { label: this._translate.instant('STATS.GIFTS.LABELS.GROUP'), value: this.formatGroupType(guest.groupType) },
        { label: this._translate.instant('STATS.GIFTS.LABELS.VISIT'), value: this._format.formatDate(guest.visitedDate) },
        { label: this._translate.instant('STATS.GIFTS.LABELS.GIFTS_RECEIVED'), value: '' },
        ...guest.gifts.map(gift => ({ value: `• ${gift}` })),
      ],
      country: {
        name: this._format.formatCountry(guest.hometownCode),
        flagClass: this._flag.transform(guest.hometownCode),
      },
    };
  };

  private buildVm(): void {
    this.vm = undefined;

    if (!this.gifts) {
      return;
    }

    const config = this.chartConfig[this.selectedView];
    const items = config.getData(this.gifts);

    if (!items.length) {
      return;
    }

    const palette = items.map((_, index) => GIFTS_COLORS[index % GIFTS_COLORS.length]);

    this.vm = {
      title: this._translate.instant(config.titleKey),
      labels: items.map(guest => guest.fullName),
      values: items.map(guest => guest.total),
      colors: {
        background: palette.map(color => getColorWithOpacity(color)),
        border: palette.map(color => color.border),
      },
      height: Math.max(400, items.length * 50),
      items,
    };
  }

  // Translates the group type received from the API.
  private formatGroupType(groupType: string): string {
    if (!groupType) {
      return this._translate.instant('STATS.GIFTS.LABELS.UNKNOWN');
    }

    const key = `STATS.GIFTS.LABELS.GROUP_TYPES.${groupType.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? groupType.charAt(0).toUpperCase() + groupType.slice(1) : translated;
  }
}
