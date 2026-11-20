import { IStaysDistribution } from '@interfaces/stats-interface';
import { IChartColors, IChartEdge, IChartLegendItem, IChartNetworkColors } from '@type/chart.types';

export type TStayItem = IStaysDistribution['longest']['overall'][number];
export type TMaxPeople = IStaysDistribution['maxPeopleTogether']['overall'];
export type TSameArrivalItem = IStaysDistribution['sameArrival'][number];
export type TSameDatesGuest = IStaysDistribution['sameDates'][number]['guests'][number];

// Data for the Longest / Shortest polar area chart.
export interface IStaysPolarVm {
  title: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  items: TStayItem[];
}

// Data for the Max People Together bar chart.
export interface IStaysMaxPeopleVm {
  title: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  valueAxisTitle: string;
  categoryAxisTitle: string;
  entries: { label: string; data: TMaxPeople }[];
}

// Data for the Same Arrival bar chart.
export interface IStaysArrivalVm {
  title: string;
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  valueAxisTitle: string;
  categoryAxisTitle: string;
  items: TSameArrivalItem[];
}

// Data for the Same Dates network chart.
export interface IStaysNetworkVm {
  title: string;
  labels: string[];
  edges: IChartEdge[];
  colors: IChartNetworkColors;
  legend: IChartLegendItem[];
  guests: TSameDatesGuest[];
}
