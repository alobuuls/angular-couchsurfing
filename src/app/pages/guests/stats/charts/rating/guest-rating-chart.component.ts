import { Component, inject, Input } from '@angular/core';

// Interfaces
import { IChartType, IRatingGuest, IRatingMainView, IRatingView, IRatingsData } from '@interfaces/stats-interface';
import { IRatingDistributionVm, IRatingDotPlotVm } from '@interfaces/charts/chart.rating.interface';
import { TChartTooltipContent } from '@type/chart.types';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { paletteToColors, RATING_DOT_COLORS, RATINGS_COLORS } from '@utils';

const STARS = ['1', '2', '3', '4', '5'] as const;

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  readonly chartTypes: { type: IChartType; icon: string }[] = [
    { type: 'bar', icon: 'bar_chart' },
    { type: 'doughnut', icon: 'pie_chart' },
  ];

  @Input() ratings!: IRatingsData;

  // Only one of these two is defined at a time.
  distributionVm: IRatingDistributionVm | null = null;
  dotPlotVm: IRatingDotPlotVm | null = null;

  selectedMainView: IRatingMainView = 'distribution';
  selectedView: IRatingView = 'overall';
  selectedChart: IChartType = 'bar';

  readonly ratingMainViews: IRatingMainView[] = ['distribution', 'lowest', 'highest'];
  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  selectMainView(view: IRatingMainView): void {
    this.selectedMainView = view;

    // Distribution starts with Overall by default.
    if (view === 'distribution') {
      this.selectedView = 'overall';
    }

    this.buildView();
  }

  selectView(view: IRatingView): void {
    this.selectedView = view;
    this.buildView();
  }

  selectChartType(type: IChartType): void {
    this.selectedChart = type;
  }

  // The last item represents the unrated guests.
  onDistributionClick(index: number): void {
    if (index < STARS.length) {
      this.navigateToRating(index + 1);
    }
  }

  onDotClick(index: number): void {
    const guest = this.dotPlotVm?.guests[index];

    if (guest) {
      this.navigateToRating(guest.rating);
    }
  }

  dotTooltip = (index: number): TChartTooltipContent | null => {
    const guest = this.dotPlotVm?.guests[index];

    if (!guest) return null;

    return {
      title: guest.fullName,
      rows: [
        { label: this.t('STATS.RATINGS.LABELS.RATING'), value: `${guest.rating} ⭐` },
        { label: this.t('GENDER.TXT'), value: this._format.formatGender(guest.gender) },
        { label: this.t('STATS.RATINGS.LABELS.VISIT'), value: this._format.formatDate(guest.visitedDate) },
      ],
      country: this._labels.country(guest.hometownCode),
    };
  };

  starTickFormatter = (value: number | string): string => `${value} ⭐`;

  protected buildView(): void {
    this.distributionVm = null;
    this.dotPlotVm = null;

    if (!this.ratings) return;

    if (this.selectedMainView === 'distribution') {
      this.distributionVm = this.buildDistributionVm();
    } else {
      this.dotPlotVm = this.buildDotPlotVm();
    }
  }

  private buildDistributionVm(): IRatingDistributionVm | null {
    const ratings = this.ratings.distribution[this.selectedView];

    if (!ratings) return null;

    return {
      datasetLabel: this.t('STATS.RATINGS.LABELS.GUESTS'),
      labels: [...STARS.map(star => `${star} ⭐`), this.t('STATS.RATINGS.LABELS.UNRATED')],
      values: [...STARS.map(star => ratings[star]), ratings.unrated],
      colors: paletteToColors(RATINGS_COLORS),
    };
  }

  private buildDotPlotVm(): IRatingDotPlotVm | null {
    const isHighest = this.selectedMainView === 'highest';
    const rankingData = isHighest ? this.ratings.highest : this.ratings.lowest;
    const guests: IRatingGuest[] = [...(rankingData[this.selectedView] ?? [])];

    if (!guests.length) return null;

    const dotColors = isHighest ? RATING_DOT_COLORS.highest : RATING_DOT_COLORS.lowest;

    return {
      datasetLabel: this.t(isHighest ? 'STATS.RATINGS.VIEWS.HIGHEST' : 'STATS.RATINGS.VIEWS.LOWEST'),
      guests,
      labels: guests.map(guest => guest.fullName),
      values: guests.map(guest => guest.rating),
      colors: paletteToColors(guests.map(() => dotColors)),
    };
  }

  private navigateToRating(rating: number): void {
    this._nav.toList({ rating, groupType: this.selectedView === 'overall' ? undefined : this.selectedView });
  }
}
