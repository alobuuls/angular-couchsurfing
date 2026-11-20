import { ISameArrivalDay, ITimelineItem } from '@interfaces/stats-interface';
import { IChartColors, IChartEdge, IChartLegendItem, IChartNetworkColors } from '@type/chart.types';

export type TBarItem = ITimelineItem | ISameArrivalDay;

export interface INetworkNode {
  id: string;
  label: string;
  country: string;
  visitedDate: string;
  guestId: string;
  gender: string;
  groupType: string | null;
  groupId: string | null;
}

// Data for the bar chart.
export interface ITimelineBarVm {
  title: string;
  valueAxisTitle: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  height?: number;
  items: TBarItem[];
}

// Data for the network chart.
export interface ITimelineNetworkVm {
  title: string;
  labels: string[];
  edges: IChartEdge[];
  colors: IChartNetworkColors;
  nodes: INetworkNode[];
}
