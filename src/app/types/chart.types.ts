import { createExternalTooltip } from '@utils';

export interface IChartColors {
  background: string[];
  border: string[];
}

export interface IChartLegendItem {
  text: string;
  background: string;
  border: string;
}

export interface IChartPoint {
  x: number;
  y: number | string;
}

export interface IChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IChartXYPoint {
  x: number;
  y: number;
}

export interface IChartBubblePoint extends IChartXYPoint {
  r: number;
}

export interface IChartHeatmapCell {
  x: string;
  y: string;
  v: number;
}

export interface IChartEdge {
  source: number;
  target: number;
}

export interface IChartNetworkColors {
  background: string | string[];
  border: string | string[];
  edges: string;
}

export interface IChartBarSeries {
  label: string;
  values: number[];
  colors?: IChartColors;
}

// Emitted when a chart element is clicked.
export interface IChartElementClick {
  datasetIndex: number;
  index: number;
}

// One scatter dataset. With `lineColor`, its points are joined by a line.
export interface IChartScatterSeries {
  label: string;
  points: IChartPoint[];
  colors?: IChartColors;
  lineColor?: string;
}

// Same shape that createExternalTooltip expects as its third argument.
export type TChartTooltipContent = Parameters<typeof createExternalTooltip>[2];
