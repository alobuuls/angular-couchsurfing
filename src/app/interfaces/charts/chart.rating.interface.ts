import { IRatingGuest } from '@interfaces/stats-interface';
import { IChartColors } from '@type/chart.types';

// Data for the Distribution chart (bar / doughnut).
export interface IRatingDistributionVm {
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
}

// Data for the Lowest / Highest dot plot.
export interface IRatingDotPlotVm {
  datasetLabel: string;
  guests: IRatingGuest[];
  labels: string[];
  values: number[];
  colors: IChartColors;
}
