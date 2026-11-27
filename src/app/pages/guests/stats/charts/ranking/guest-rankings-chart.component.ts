import { Component, inject, Input } from '@angular/core';

// Interfaces
import { IRankingCategory, IRankingItem, IRankingView, IRankingsDistribution } from '@interfaces/stats-interface';
import { TChartTooltipContent } from '@type/chart.types';
import { IRankingChartVm } from '@interfaces/charts/stats-chart-vm.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { getCyclicRankingColors } from '@utils';

type TRankingSubview = keyof IRankingCategory;

const GENDER_SUBVIEWS: TRankingSubview[] = ['overall', 'solo'];

@Component({
  selector: 'guest-rankings-chart',
  templateUrl: './guest-rankings-chart.component.html',
  styleUrls: ['./guest-rankings-chart.component.css'],
})
export class GuestRankingsChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() rankings!: IRankingsDistribution;

  chartVm: IRankingChartVm | null = null;

  selectedView: IRankingView = 'people';
  selectedSubview: TRankingSubview = 'overall';

  readonly rankingViews: IRankingView[] = ['people', 'women', 'men', 'groups'];

  // Title, subviews and subview i18n keys of each ranking view.
  readonly viewConfig: Record<IRankingView, { titleKey: string; subviews: TRankingSubview[]; subviewKeyPrefix: string }> = {
    people: { titleKey: 'STATS.RANKINGS.TITLES.PEOPLE', subviews: GENDER_SUBVIEWS, subviewKeyPrefix: 'STATS.RANKINGS.SUBVIEWS.' },
    women: { titleKey: 'STATS.RANKINGS.TITLES.WOMEN', subviews: GENDER_SUBVIEWS, subviewKeyPrefix: 'STATS.RANKINGS.SUBVIEWS.' },
    men: { titleKey: 'STATS.RANKINGS.TITLES.MEN', subviews: GENDER_SUBVIEWS, subviewKeyPrefix: 'STATS.RANKINGS.SUBVIEWS.' },
    groups: {
      titleKey: 'STATS.RANKINGS.TITLES.GROUPS',
      subviews: ['overall', 'couple', 'family', 'friends'],
      subviewKeyPrefix: 'STATS.RANKINGS.GROUP_TYPES.',
    },
  };

  selectView(view: IRankingView): void {
    this.selectedView = view;
    this.selectedSubview = 'overall';
    this.buildView();
  }

  selectSubview(subview: TRankingSubview): void {
    this.selectedSubview = subview;
    this.buildView();
  }

  onChartClick(index: number): void {
    const guest = this.chartVm?.items[index]?.guest;

    if (guest?.guestId) {
      this._nav.toGuest(guest.guestId, guest.groupType, guest.groupId);
    }
  }

  rankingTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.chartVm?.items[index];

    if (!item) return null;

    return {
      title: item.guest.fullName,
      rows: [
        { label: this.t('STATS.RANKINGS.LABELS.OVERALL_RANKING'), value: String(item.position) },
        { label: this.t('STATS.RANKINGS.LABELS.VISIT'), value: this._format.formatDate(item.guest.visitedDate) },
      ],
      country: this._labels.country(item.guest.hometownCode),
    };
  };

  protected buildView(): void {
    this.chartVm = this.rankings ? this.buildChartVm() : null;
  }

  private buildChartVm(): IRankingChartVm | null {
    const items: IRankingItem[] = this.rankings[this.selectedView][this.selectedSubview] ?? [];

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

    const config = this.viewConfig[this.selectedView];
    const title = this.t(config.titleKey);

    return {
      title,
      datasetLabel: this.t('STATS.RANKINGS.LABELS.DATASET', {
        title,
        subview: this.t(config.subviewKeyPrefix + this.selectedSubview.toUpperCase()),
      }),
      labels: items.map(item => `${item.guest.fullName} (${this._format.formatCountry(item.guest.hometownCode)})`),
      values: positions,
      colors: getCyclicRankingColors(items.length),
      max,
      tickFormatter: value => (ticks.includes(Number(value)) ? Number(value) : ''),
      items,
    };
  }
}
