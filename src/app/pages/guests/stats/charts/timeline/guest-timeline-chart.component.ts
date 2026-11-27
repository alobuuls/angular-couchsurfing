import { Component, inject, Input } from '@angular/core';

// Interfaces
import { ISameStay, ITimelineDistribution, ITimelineItem, ITimelineView } from '@interfaces/stats-interface';
import { IChartEdge, TChartTooltipContent } from '@type/chart.types';
import { INetworkNode, ITimelineBarVm, ITimelineNetworkVm, TBarItem } from '@interfaces/charts/stats-chart-vm.interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { getPodiumColors, getTopIndexes, TIMELINE_COLORS } from '@utils';

@Component({
  selector: 'guest-timeline-chart',
  templateUrl: './guest-timeline-chart.component.html',
  styleUrls: ['./guest-timeline-chart.component.css'],
})
export class GuestTimelineChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() timeline!: ITimelineDistribution;

  selectedView: ITimelineView = 'years';
  readonly timelineViews: ITimelineView[] = ['years', 'months', 'days', 'sameArrivalDay', 'sameStay'];

  // Only one of them is defined at a time.
  barVm?: ITimelineBarVm;
  networkVm?: ITimelineNetworkVm;

  selectView(view: ITimelineView): void {
    this.selectedView = view;
    this.buildView();
  }

  // CLICKS
  onBarClick(index: number): void {
    const item = this.barVm?.items[index];
    if (item) this._nav.toList(this.getFilters(item));
  }

  onNetworkClick(index: number): void {
    const node = this.networkVm?.nodes[index];
    if (node?.guestId) this._nav.toGuest(node.guestId, node.groupType, node.groupId);
  }

  // TOOLTIP
  getNetworkTooltip = (index: number): TChartTooltipContent | null => {
    const node = this.networkVm?.nodes[index];
    if (!node) return null;

    return {
      title: node.label,
      rows: [
        { label: this.t('STATS.TIMELINE.LABELS.GENDER'), value: this._format.formatGender(node.gender) },
        { label: this.t('STATS.TIMELINE.LABELS.VISIT'), value: this._format.formatDate(node.visitedDate) },
      ],
      country: this._labels.country(node.country),
    };
  };

  // VIEW MODELS
  protected buildView(): void {
    this.barVm = undefined;
    this.networkVm = undefined;
    if (!this.timeline) return;

    const data = this.timeline[this.selectedView];
    if (!data.length) return;

    const title = this.t(`STATS.TIMELINE.TITLES.${this.selectedView.toUpperCase()}`);

    this.selectedView === 'sameStay' ? (this.networkVm = this.buildNetworkVm(data as ISameStay[], title)) : (this.barVm = this.buildBarVm(data as TBarItem[], title));
  }

  private buildBarVm(items: TBarItem[], title: string): ITimelineBarVm {
    return {
      title,
      valueAxisTitle: this.t('STATS.TIMELINE.LABELS.NUMBER_OF_GUESTS'),
      labels: items.map(item => this.formatTimelineLabel(item)),
      values: items.map(item => item.total),
      // Unique podium colors; the earliest date breaks ties.
      colors: getPodiumColors(
        items.length,
        getTopIndexes(
          items,
          item => item.total,
          item => this.getItemTime(item)
        )
      ),
      legend: this._labels.rankingLegend(),
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

  private getNetworkNodes(data: ISameStay[]): INetworkNode[] {
    const nodes = new Map<string, INetworkNode>();
    const addNode = (guest: ISameStay['guest']): void => {
      nodes.set(guest.guestId, {
        id: guest.guestId,
        label: this._labels.guestName(guest.fullName, guest.groupType),
        country: guest.hometownCode,
        visitedDate: guest.visitedDate,
        guestId: guest.guestId,
        gender: guest.gender,
        groupType: guest.groupType,
        groupId: guest.groupId,
      });
    };

    // The main guest and every overlapping guest are nodes.
    data.forEach(item => {
      addNode(item.guest);
      item.guests.forEach(addNode);
    });

    return Array.from(nodes.values());
  }

  private getNetworkEdges(data: ISameStay[], nodeIndexes: Map<string, number>): IChartEdge[] {
    const edges: IChartEdge[] = [];

    data.forEach(item => {
      const source = nodeIndexes.get(item.guest.guestId);
      if (source === undefined) return;

      item.guests.forEach(guest => {
        const target = nodeIndexes.get(guest.guestId);
        if (target !== undefined) edges.push({ source, target });
      });
    });

    return edges;
  }

  // HELPERS
  private formatTimelineLabel(item: TBarItem): string {
    if ('date' in item) return this._format.formatDate(item.date);
    if (this.selectedView === 'months') return this._format.formatMonth(item.period);
    if (this.selectedView === 'days') return this._format.formatDay(item.period);
    return item.period;
  }

  private getItemTime(item: TBarItem): number {
    const period = 'date' in item ? item.date : item.period;

    if (this.selectedView === 'months') return new Date(`${period}-01`).getTime();
    if (this.selectedView === 'years') return new Date(`${period}-01-01`).getTime();

    return new Date(period).getTime();
  }

  // Guests filter opened by a bar.
  private getFilters(item: TBarItem): Partial<IQueryParamsGuests> {
    if ('date' in item) return { from: item.date, to: item.date };
    const period = (item as ITimelineItem).period;

    switch (this.selectedView) {
      case 'years':
        return { from: `${period}-01-01`, to: `${period}-12-31` };
      case 'months': {
        const [year, month] = period.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();

        return { from: `${period}-01`, to: `${period}-${String(lastDay).padStart(2, '0')}` };
      }
      default:
        return { day: period };
    }
  }
}
