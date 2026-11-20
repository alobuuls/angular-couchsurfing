import { IDemographicGender } from '@interfaces/stats-interface';
import { IChartBarSeries, IChartColors, IChartLegendItem, IChartScatterSeries } from '@type/chart.types';

export type TDemographicKey = 'male' | 'female' | 'trans' | 'isGay';
export type TGroupKey = 'couple' | 'friends' | 'family';
export type TAgeMode = 'oldest' | 'youngest';
export type TColor = { background: string; border: string };
export type TGroupRow = 'solo' | TGroupKey;

// Minimal shape of a person in the stats payload (replace with your real interface).
export interface IDemographicsPerson {
  guestId: string;
  fullName: string;
  birthDate?: string | null;
  gender: IDemographicGender;
  visitedDate: string;
  hometownCode: string;
  groupType?: string;
  groupId?: string | null;
}

export interface IDemographicsPersonItem {
  name: string;
  guestId: string;
  age: number;
  gender: IDemographicGender;
  demographic: TDemographicKey;
  visitedDate: string;
  country: string;
  group?: TGroupKey;
}

export interface IDemographicsFirstLastItem {
  type: 'first' | 'last';
  person: IDemographicsPerson;
}

export interface IDemographicsPieVm {
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
}

export interface IDemographicsGroupsBarVm {
  labels: string[];
  series: IChartBarSeries[];
}

export interface IDemographicsRankingBarVm {
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  items: IDemographicsPersonItem[];
}

export interface IDemographicsScatterVm {
  datasetLabel: string;
  points: { x: number; y: number }[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  items: IDemographicsPersonItem[];
}

export interface IDemographicsBubbleVm {
  datasetLabel: string;
  points: { x: number; y: number; r: number }[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  items: IDemographicsPersonItem[];
}

export interface IDemographicsFirstLastVm {
  yLabels: string[];
  yTitle: string;
  showGender: boolean;
  // One series per row; its points are [first, last] joined by a line.
  series: IChartScatterSeries[];
  legend: IChartLegendItem[];
  // items[row][point]: same order as series[row].points.
  items: IDemographicsFirstLastItem[][];
}

export interface IFirstLastRow {
  label: string;
  entries: (IDemographicsFirstLastItem & { color: TColor })[];
  lineColor: string;
}
