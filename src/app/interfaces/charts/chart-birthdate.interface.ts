import { IBirthdaysDistribution } from '@interfaces/stats-interface';
import { IChartBubblePoint, IChartColors, IChartHeatmapCell, IChartXYPoint } from '@type/chart.types';

export type TCalendarItem = IBirthdaysDistribution['calendar'][number];
export type TRepeatedItem = IBirthdaysDistribution['repeated'][number];
export type TUnusualItem = IBirthdaysDistribution['unusual'][number];

export interface IBirthdaysHeatmapVm {
  title: string;
  datasetLabel: string;
  xLabels: string[];
  yLabels: string[];
  cells: IBirthdaysHeatmapCell[];
  birthdayMap: Map<string, TCalendarItem>;
}

export interface IBirthdaysBubbleVm {
  title: string;
  datasetLabel: string;
  points: IChartBubblePoint[];
  colors: IChartColors;
  items: TRepeatedItem[];
}

export interface IBirthdaysLineVm {
  title: string;
  datasetLabel: string;
  points: IChartXYPoint[];
  colors: IChartColors;
  items: TUnusualItem[];
}

export interface IBirthdaysHeatmapCell extends IChartHeatmapCell {
  month: number;
  day: number;
}
