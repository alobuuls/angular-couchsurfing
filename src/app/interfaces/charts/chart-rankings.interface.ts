import { IRankingItem } from '@interfaces/stats-interface';
import { IChartColors } from '@type/chart.types';

// Data for the ranking bar chart.
export interface IRankingChartVm {
  title: string;
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  max: number;
  tickFormatter: (value: number | string) => string | number;
  items: IRankingItem[];
}
