import { IChartColors } from '@type/chart.types';

export interface ISummaryRadarVm {
  datasetLabel: string;
  labels: string[];
  values: number[];
  max: number;
  colors: IChartColors;
  pointColors: IChartColors;
}

export interface ISummaryDoughnutVm {
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
}
