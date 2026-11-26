import { Component, inject, Input } from '@angular/core';

// Interfaces
import { IGiftsDistribution, IGiftsView } from '@interfaces/stats-interface';
import { TChartTooltipContent } from '@type/chart.types';
import { IGiftsChartVm } from '@interfaces/charts/chart-gifts.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { GIFTS_COLORS, paletteToColors } from '@utils';

@Component({
  selector: 'guest-gifts-chart',
  templateUrl: './guest-gifts-chart.component.html',
  styleUrls: ['./guest-gifts-chart.component.css'],
})
export class GuestGiftsChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() gifts!: IGiftsDistribution;

  selectedView: IGiftsView = 'groups';
  readonly giftsViews: IGiftsView[] = ['groups', 'solo'];

  // Undefined when there is nothing to display.
  vm?: IGiftsChartVm;

  selectView(view: IGiftsView): void {
    this.selectedView = view;
    this.buildView();
  }

  onItemClick(index: number): void {
    const guest = this.vm?.items[index];

    if (guest?.guestId) {
      this._nav.toGuest(guest.guestId);
    }
  }

  getTooltip = (index: number): TChartTooltipContent | null => {
    const guest = this.vm?.items[index];

    if (!guest) return null;

    return {
      title: guest.fullName,
      rows: [
        {
          label: this.t('STATS.GIFTS.LABELS.GROUP'),
          value: guest.groupType ? this._labels.groupType(guest.groupType) : this.t('STATS.GIFTS.LABELS.UNKNOWN'),
        },
        { label: this.t('STATS.GIFTS.LABELS.VISIT'), value: this._format.formatDate(guest.visitedDate) },
        { label: this.t('STATS.GIFTS.LABELS.GIFTS_RECEIVED'), value: '' },
        ...guest.gifts.map(gift => ({ value: `• ${gift}` })),
      ],
      country: this._labels.country(guest.hometownCode),
    };
  };

  protected buildView(): void {
    this.vm = this.gifts ? this.buildVm() : undefined;
  }

  private buildVm(): IGiftsChartVm | undefined {
    const items = this.gifts[this.selectedView];

    if (!items.length) return undefined;

    const palette = items.map((_, index) => GIFTS_COLORS[index % GIFTS_COLORS.length]);

    return {
      title: this.t(`STATS.GIFTS.TITLES.${this.selectedView.toUpperCase()}`),
      labels: items.map(guest => guest.fullName),
      values: items.map(guest => guest.total),
      colors: paletteToColors(palette),
      height: Math.max(400, items.length * 50),
      items,
    };
  }
}
