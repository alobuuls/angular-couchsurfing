import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { IChartType, IRatingGuest, IRatingGroupType, IRatingMainView, IRatingView, IRatingsData, IRatingsDistribution } from '@interfaces/stats-interface';
import { IRatingDistributionVm, IRatingDotPlotVm } from '@interfaces/charts/chart.rating.interface';
import { TChartTooltipContent } from '@type/chart.types';

// Helpers
import { RATING_DOT_COLORS, RATINGS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-rating-chart',
  templateUrl: './guest-rating-chart.component.html',
  styleUrls: ['./guest-rating-chart.component.css'],
})
export class GuestRatingChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  @Input() ratings!: IRatingsData;

  // Only one of these two is defined at a time.
  distributionVm: IRatingDistributionVm | null = null;
  dotPlotVm: IRatingDotPlotVm | null = null;

  // Main Rating view.
  selectedMainView: IRatingMainView = 'distribution';

  // Distribution group view.
  selectedView: IRatingView = 'overall';

  // Chart type used by Distribution.
  selectedChart: IChartType = 'bar';

  // Main Rating views.
  readonly ratingMainViews: IRatingMainView[] = ['distribution', 'lowest', 'highest'];

  // Rating group views.
  readonly ratingViews: IRatingView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    // Rebuild the chart data when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildVm());
  }

  // Rebuild the chart data when the ratings change.
  ngOnChanges(): void {
    this.buildVm();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // ─────────────────────────────────────────────
  // Template actions
  // ─────────────────────────────────────────────

  // Select the main Rating view.
  selectMainView(view: IRatingMainView): void {
    this.selectedMainView = view;

    // Distribution starts with Overall by default.
    if (view === 'distribution') {
      this.selectedView = 'overall';
    }

    this.buildVm();
  }

  // Select a Rating group.
  selectView(view: IRatingView): void {
    this.selectedView = view;
    this.buildVm();
  }

  // Change the Distribution chart type.
  selectChartType(type: IChartType): void {
    this.selectedChart = type;
  }

  // Click on a Distribution item.
  onDistributionClick(index: number): void {
    // The last item represents unrated guests.
    if (index > 4) return;

    this.navigateToRating(index + 1);
  }

  // Click on a Lowest / Highest dot.
  onDotClick(index: number): void {
    const guest = this.dotPlotVm?.guests[index];

    if (guest) this.navigateToRating(guest.rating);
  }

  // Tooltip content for a dot.
  dotTooltip = (index: number): TChartTooltipContent | null => {
    const guest = this.dotPlotVm?.guests[index];

    if (!guest) return null;

    return {
      title: guest.fullName,
      rows: [
        {
          label: this._translate.instant('STATS.RATINGS.LABELS.RATING'),
          value: `${guest.rating} ⭐`,
        },
        {
          label: this._translate.instant('GENDER.TXT'),
          value: this._format.formatGender(guest.gender),
        },
        {
          label: this._translate.instant('STATS.RATINGS.LABELS.VISIT'),
          value: this._format.formatDate(guest.visitedDate),
        },
      ],
      country: {
        name: this._format.formatCountry(guest.hometownCode),
        flagClass: this._flag.transform(guest.hometownCode),
      },
    };
  };

  starTickFormatter = (value: number | string): string => `${value} ⭐`;

  // ─────────────────────────────────────────────
  // View model
  // ─────────────────────────────────────────────

  private buildVm(): void {
    this.distributionVm = null;
    this.dotPlotVm = null;

    if (!this.ratings) return;

    if (this.selectedMainView === 'distribution') {
      this.distributionVm = this.buildDistributionVm();
      return;
    }

    this.dotPlotVm = this.buildDotPlotVm();
  }

  private buildDistributionVm(): IRatingDistributionVm | null {
    const distributions: Record<IRatingView, IRatingsDistribution> = this.ratings.distribution;
    const ratings = distributions[this.selectedView];

    if (!ratings) return null;

    return {
      datasetLabel: this._translate.instant('STATS.RATINGS.LABELS.GUESTS'),
      labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐', this._translate.instant('STATS.RATINGS.LABELS.UNRATED')],
      values: [ratings['1'], ratings['2'], ratings['3'], ratings['4'], ratings['5'], ratings.unrated],
      colors: {
        background: RATINGS_COLORS.map(color => color.background),
        border: RATINGS_COLORS.map(color => color.border),
      },
    };
  }

  private buildDotPlotVm(): IRatingDotPlotVm | null {
    const isHighest = this.selectedMainView === 'highest';
    const rankingData = isHighest ? this.ratings.highest : this.ratings.lowest;

    const guests: IRatingGuest[] = [...(rankingData[this.selectedView] ?? [])];

    if (!guests.length) return null;

    const dotColors = isHighest ? RATING_DOT_COLORS.highest : RATING_DOT_COLORS.lowest;

    return {
      datasetLabel: this._translate.instant(isHighest ? 'STATS.RATINGS.VIEWS.HIGHEST' : 'STATS.RATINGS.VIEWS.LOWEST'),
      guests,
      labels: guests.map(guest => guest.fullName),
      values: guests.map(guest => guest.rating),
      colors: {
        background: guests.map(() => dotColors.background),
        border: guests.map(() => dotColors.border),
      },
    };
  }

  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────

  // Navigate to the guests filtered by rating.
  private navigateToRating(rating: number): void {
    const queryParams: {
      view: 'cards';
      rating: number;
      groupType?: IRatingGroupType;
    } = {
      view: 'cards',
      rating,
    };

    if (this.selectedView !== 'overall') {
      queryParams.groupType = this.selectedView;
    }

    this._router.navigate(['/guests'], { queryParams });
  }
}
