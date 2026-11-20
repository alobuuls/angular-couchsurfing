import { IGiftGuest } from '@interfaces/stats-interface';
import { IChartColors } from '@type/chart.types';

export interface IGiftsChartVm {
  title: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  height: number;
  items: IGiftGuest[];
}
