import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { IRankingGenderView, IRankingGroupView, IRankingItem, IRankingView, IRankingsDistribution } from '@interfaces/stats-interface';
import { TChartTooltipContent } from '@type/chart.types';
import { IRankingChartVm } from '@interfaces/charts/chart-rankings.interface';

// Helpers
import { getCyclicRankingColors } from '@utils';

// Services
import { FormatService } from '@services/format.service';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-rankings-chart',
  templateUrl: './guest-rankings-chart.component.html',
  styleUrls: ['./guest-rankings-chart.component.css'],
})
export class GuestRankingsChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  @Input() rankings!: IRankingsDistribution;

  chartVm: IRankingChartVm | null = null;

  // Controls the currently selected ranking view.
  selectedView: IRankingView = 'people';

  // Available ranking views.
  readonly rankingViews: IRankingView[] = ['people', 'women', 'men', 'groups'];

  // Controls the selected People ranking view.
  selectedPeopleView: IRankingGenderView = 'overall';

  // Available People ranking views.
  readonly peopleRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Women ranking view.
  selectedWomenView: IRankingGenderView = 'overall';

  // Available Women ranking views.
  readonly womenRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Men ranking view.
  selectedMenView: IRankingGenderView = 'overall';

  // Available Men ranking views.
  readonly menRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Group ranking view.
  selectedGroupView: IRankingGroupView = 'overall';

  // Available Group ranking views.
  readonly groupRankingViews: IRankingGroupView[] = ['overall', 'couple', 'family', 'friends'];

  // Title for each ranking view.
  private readonly titleKeys: Record<IRankingView, string> = {
    people: 'STATS.RANKINGS.TITLES.PEOPLE',
    women: 'STATS.RANKINGS.TITLES.WOMEN',
    men: 'STATS.RANKINGS.TITLES.MEN',
    groups: 'STATS.RANKINGS.TITLES.GROUPS',
  };

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  ngOnInit(): void {
    // Rebuild the chart data when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildVm());
  }

  // Rebuild the chart data when ranking data changes.
  ngOnChanges(): void {
    this.buildVm();
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // ─────────────────────────────────────────────
  // Template actions
  // ─────────────────────────────────────────────

  // Changes the main ranking view.
  selectView(view: IRankingView): void {
    this.selectedView = view;

    // Reset the selected subview when changing the main view.
    if (view === 'people') this.selectedPeopleView = 'overall';
    if (view === 'women') this.selectedWomenView = 'overall';
    if (view === 'men') this.selectedMenView = 'overall';
    if (view === 'groups') this.selectedGroupView = 'overall';

    this.buildVm();
  }

  selectPeopleView(view: IRankingGenderView): void {
    this.selectedPeopleView = view;
    this.buildVm();
  }

  selectWomenView(view: IRankingGenderView): void {
    this.selectedWomenView = view;
    this.buildVm();
  }

  selectMenView(view: IRankingGenderView): void {
    this.selectedMenView = view;
    this.buildVm();
  }

  selectGroupView(view: IRankingGroupView): void {
    this.selectedGroupView = view;
    this.buildVm();
  }

  // Click on a bar.
  onChartClick(index: number): void {
    const guest = this.chartVm?.items[index]?.guest;

    if (!guest?.guestId) return;

    this.navigateToGuest(guest.guestId, guest.groupType, guest.groupId);
  }

  // Tooltip content for a bar.
  rankingTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.chartVm?.items[index];

    if (!item?.guest) return null;

    const guest = item.guest;

    return {
      title: guest.fullName,
      rows: [
        {
          label: this._translate.instant('STATS.RANKINGS.LABELS.OVERALL_RANKING'),
          value: String(item.position),
        },
        {
          label: this._translate.instant('STATS.RANKINGS.LABELS.VISIT'),
          value: this._format.formatDate(guest.visitedDate),
        },
      ],
      country: {
        name: this._format.formatCountry(guest.hometownCode),
        flagClass: this._flag.transform(guest.hometownCode),
      },
    };
  };

  // ─────────────────────────────────────────────
  // View model
  // ─────────────────────────────────────────────

  private buildVm(): void {
    this.chartVm = this.buildChartVm();
  }

  private buildChartVm(): IRankingChartVm | null {
    if (!this.rankings) return null;

    const items = this.getRankingData();

    // Do not create a chart when there is no ranking data.
    if (!items.length) return null;

    const positions = items.map(item => item.position);

    // Keep the chart maximum aligned with the ranking scale.
    const maxPosition = Math.max(...positions);
    const max = maxPosition <= 100 ? 100 : Math.ceil(maxPosition / 50) * 50;

    // Ranking scale: 1, 10, 25, 50, 75, 100, then every 50.
    const ticks = [1, 10, 25, 50, 75, 100];

    for (let position = 150; position <= max; position += 50) {
      ticks.push(position);
    }

    const rankColors = getCyclicRankingColors(items.length);

    const title = this._translate.instant(this.titleKeys[this.selectedView]);

    return {
      title,
      datasetLabel: this._translate.instant('STATS.RANKINGS.LABELS.DATASET', {
        title,
        subview: this.getSelectedSubviewLabel(),
      }),
      // Use the translated guest display name in chart labels.
      labels: items.map(item => this.getGuestDisplayName(item)),
      values: positions,
      colors: rankColors,
      max,
      tickFormatter: value => (ticks.includes(Number(value)) ? Number(value) : ''),
      items,
    };
  }

  // Gets the data for the selected main view and subview.
  private getRankingData(): IRankingItem[] {
    switch (this.selectedView) {
      case 'people':
        return this.rankings.people[this.selectedPeopleView] ?? [];
      case 'women':
        return this.rankings.women[this.selectedWomenView] ?? [];
      case 'men':
        return this.rankings.men[this.selectedMenView] ?? [];
      case 'groups':
        return this.rankings.groups[this.selectedGroupView] ?? [];
    }
  }

  // Gets the translated label for the selected subview.
  private getSelectedSubviewLabel(): string {
    let key: string;

    if (this.selectedView === 'people') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedPeopleView.toUpperCase()}`;
    } else if (this.selectedView === 'women') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedWomenView.toUpperCase()}`;
    } else if (this.selectedView === 'men') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedMenView.toUpperCase()}`;
    } else {
      key = `STATS.RANKINGS.GROUP_TYPES.${this.selectedGroupView.toUpperCase()}`;
    }

    return this._translate.instant(key);
  }

  // Formats the guest name according to the selected ranking view.
  private getGuestDisplayName(item: IRankingItem): string {
    const country = this._format.formatCountry(item.guest.hometownCode);
    return `${item.guest.fullName} (${country})`;
  }

  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────

  // Navigates to the group or individual guest details.
  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }
}
