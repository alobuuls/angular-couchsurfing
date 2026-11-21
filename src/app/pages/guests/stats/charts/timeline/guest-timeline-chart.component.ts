import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { ISameArrivalDay, ISameStay, ITimelineDistribution, ITimelineItem, ITimelineView } from '@interfaces/stats-interface';
import { IChartColors, IChartEdge, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import { INetworkNode, ITimelineBarVm, ITimelineNetworkVm, TBarItem } from '@interfaces/charts/chart-timeline.interface';

// Helpers
import { RANKING_COLORS, TIMELINE_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-timeline-chart',
  templateUrl: './guest-timeline-chart.component.html',
  styleUrls: ['./guest-timeline-chart.component.css'],
})
export class GuestTimelineChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  @Input() timeline!: ITimelineDistribution;

  // Controls the selected timeline view.
  selectedView: ITimelineView = 'years';

  // Available timeline views.
  readonly timelineViews: ITimelineView[] = ['years', 'months', 'days', 'sameArrivalDay', 'sameStay'];

  // Only one of them is defined at a time.
  barVm?: ITimelineBarVm;
  networkVm?: ITimelineNetworkVm;

  // Configuration for each timeline view.
  private readonly chartConfig: Record<
    ITimelineView,
    {
      titleKey: string;
      type: 'bar' | 'network';
      getData: (timeline: ITimelineDistribution) => ITimelineItem[] | ISameArrivalDay[] | ISameStay[];
    }
  > = {
    years: { titleKey: 'STATS.TIMELINE.TITLES.YEARS', type: 'bar', getData: timeline => timeline.years },
    months: { titleKey: 'STATS.TIMELINE.TITLES.MONTHS', type: 'bar', getData: timeline => timeline.months },
    days: { titleKey: 'STATS.TIMELINE.TITLES.DAYS', type: 'bar', getData: timeline => timeline.days },
    sameArrivalDay: { titleKey: 'STATS.TIMELINE.TITLES.SAMEARRIVALDAY', type: 'bar', getData: timeline => timeline.sameArrivalDay },
    sameStay: { titleKey: 'STATS.TIMELINE.TITLES.SAMESTAY', type: 'network', getData: timeline => timeline.sameStay },
  };

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildView());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeline']) {
      this.buildView();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  selectView(view: ITimelineView): void {
    if (this.selectedView === view) {
      return;
    }

    this.selectedView = view;
    this.buildView();
  }

  private getTimelineRankingColors(items: TBarItem[]): IChartColors {
    const rankingColors = [RANKING_COLORS.gold, RANKING_COLORS.silver, RANKING_COLORS.bronze];

    const getDateValue = (item: TBarItem): number => {
      const period = 'date' in item ? item.date : item.period;

      if (this.selectedView === 'months') {
        return new Date(`${period}-01`).getTime();
      }

      if (this.selectedView === 'years') {
        return new Date(`${period}-01-01`).getTime();
      }

      return new Date(period).getTime();
    };

    const rankingIndexes = items
      .map((item, index) => ({ index, total: item.total, date: getDateValue(item) }))
      .sort((a, b) => b.total - a.total || a.date - b.date)
      .slice(0, 3);

    const colors = items.map(() => RANKING_COLORS.neutral);

    rankingIndexes.forEach((item, index) => {
      colors[item.index] = rankingColors[index];
    });

    return {
      background: colors.map(color => color.background),
      border: colors.map(color => color.border),
    };
  }

  // CLICKS
  onBarClick(index: number): void {
    const item = this.barVm?.items[index];

    if (!item) {
      return;
    }

    switch (this.selectedView) {
      case 'years':
        this.navigateToYear((item as ITimelineItem).period);
        break;
      case 'months':
        this.navigateToMonth((item as ITimelineItem).period);
        break;
      case 'days':
        this.navigateToDay((item as ITimelineItem).period);
        break;
      case 'sameArrivalDay':
        this.navigateToSameArrivalDay((item as ISameArrivalDay).date);
        break;
    }
  }

  onNetworkClick(index: number): void {
    const node = this.networkVm?.nodes[index];

    if (!node?.guestId) {
      return;
    }

    this.navigateToGuest(node.guestId, node.groupType, node.groupId);
  }

  // TOOLTIP
  // Arrow function: it keeps `this` and has a stable reference.
  getNetworkTooltip = (index: number): TChartTooltipContent | null => {
    const node = this.networkVm?.nodes[index];

    if (!node) {
      return null;
    }

    return {
      title: node.label,
      rows: [
        { label: this._translate.instant('STATS.TIMELINE.LABELS.GENDER'), value: this._format.formatGender(node.gender) },
        { label: this._translate.instant('STATS.TIMELINE.LABELS.VISIT'), value: this._format.formatDate(node.visitedDate) },
      ],
      country: {
        name: this._format.formatCountry(node.country),
        flagClass: this._flag.transform(node.country),
      },
    };
  };

  // VIEW MODELS
  private buildView(): void {
    this.barVm = undefined;
    this.networkVm = undefined;

    if (!this.timeline) {
      return;
    }

    const config = this.chartConfig[this.selectedView];
    const data = config.getData(this.timeline);

    if (!data.length) {
      return;
    }

    const title = this._translate.instant(config.titleKey);

    if (config.type === 'network') {
      this.networkVm = this.buildNetworkVm(data as ISameStay[], title);
      return;
    }

    this.barVm = this.buildBarVm(data as TBarItem[], title);
  }

  private buildBarVm(items: TBarItem[], title: string): ITimelineBarVm {
    const totals = items.map(item => item.total);

    return {
      title,
      valueAxisTitle: this._translate.instant('STATS.TIMELINE.LABELS.NUMBER_OF_GUESTS'),
      labels: items.map(item => this.formatTimelineLabel(item)),
      values: totals,

      // Assign unique ranking colors, using chronological order to break ties.
      colors: this.getTimelineRankingColors(items),

      legend: this.getRankingLegend(),

      // Give the chart more space when needed.
      height: items.length > 5 ? Math.max(500, items.length * 35) : undefined,
      items,
    };
  }

  private buildNetworkVm(data: ISameStay[], title: string): ITimelineNetworkVm {
    const nodes = this.getNetworkNodes(data);
    const nodeIndexes = new Map(nodes.map((node, index) => [node.id, index]));

    return {
      title,
      labels: nodes.map(node => node.label),
      edges: this.getNetworkEdges(data, nodeIndexes),
      colors: TIMELINE_COLORS.sameStay,
      nodes,
    };
  }

  private getRankingLegend(): IChartLegendItem[] {
    const entries = [
      ['FIRST', RANKING_COLORS.gold],
      ['SECOND', RANKING_COLORS.silver],
      ['THIRD', RANKING_COLORS.bronze],
      ['OTHER', RANKING_COLORS.neutral],
    ] as const;

    return entries.map(([key, color]) => ({
      text: this._translate.instant(`STATS.TIMELINE.LABELS.${key}`),
      background: color.background,
      border: color.border,
    }));
  }

  private getNetworkNodes(data: ISameStay[]): INetworkNode[] {
    const nodes = new Map<string, INetworkNode>();

    const addNode = (guest: ISameStay['guest']): void => {
      nodes.set(guest.guestId, {
        id: guest.guestId,
        label: this.getGuestDisplayName(guest.fullName, guest.groupType),
        country: guest.hometownCode,
        visitedDate: guest.visitedDate,
        guestId: guest.guestId,
        gender: guest.gender,
        groupType: guest.groupType,
        groupId: guest.groupId,
      });
    };

    data.forEach(item => {
      // Add the main guest and every overlapping guest as nodes.
      addNode(item.guest);
      item.guests.forEach(guest => addNode(guest));
    });

    return Array.from(nodes.values());
  }

  private getNetworkEdges(data: ISameStay[], nodeIndexes: Map<string, number>): IChartEdge[] {
    const edges: IChartEdge[] = [];

    data.forEach(item => {
      const source = nodeIndexes.get(item.guest.guestId);

      if (source === undefined) {
        return;
      }

      item.guests.forEach(guest => {
        const target = nodeIndexes.get(guest.guestId);

        if (target !== undefined) {
          edges.push({ source, target });
        }
      });
    });

    return edges;
  }

  private getGuestDisplayName(fullName: string, groupType: string | null): string {
    if (!groupType || groupType === 'solo') {
      return fullName;
    }

    const groupLabelKeys: Record<string, string> = {
      couple: 'STATS.TIMELINE.GROUP_LABELS.COUPLE',
      friends: 'STATS.TIMELINE.GROUP_LABELS.FRIENDS',
      family: 'STATS.TIMELINE.GROUP_LABELS.FAMILY',
    };

    const groupLabelKey = groupLabelKeys[groupType];

    if (!groupLabelKey) {
      return fullName;
    }

    return this._translate.instant('STATS.TIMELINE.LABELS.GROUP_NAME', {
      name: fullName,
      group: this._translate.instant(groupLabelKey),
    });
  }

  private formatTimelineLabel(item: TBarItem): string {
    if ('date' in item) {
      return this._format.formatDate(item.date);
    }

    if (this.selectedView === 'months') {
      return this._format.formatMonth(item.period);
    }

    if (this.selectedView === 'days') {
      return this._format.formatDay(item.period);
    }

    return item.period;
  }

  // NAVIGATION
  private navigateToYear(year: string): void {
    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', from: `${year}-01-01`, to: `${year}-12-31` },
    });
  }

  private navigateToMonth(month: string): void {
    const [year, monthNumber] = month.split('-');
    const lastDay = new Date(Number(year), Number(monthNumber), 0).getDate();

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` },
    });
  }

  private navigateToDay(period: string): void {
    this._router.navigate(['/guests'], { queryParams: { view: 'cards', day: period } });
  }

  private navigateToSameArrivalDay(date: string): void {
    this._router.navigate(['/guests'], { queryParams: { view: 'cards', from: date, to: date } });
  }

  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }
}
