// Interfaces
import { IChartColors, IChartLegendItem, IChartPoint } from '@type/chart.types';
import { IGeographyContinent, IGeographyCountry, IGeographyDistribution, IGeographyLocation, IGeographyRegion } from '@interfaces/stats-interface';

export type GeographyItem = IGeographyContinent | IGeographyRegion | IGeographyCountry | IGeographyLocation;
export type MostConsecutive = NonNullable<IGeographyDistribution['countries']['mostConsecutive']>;
export type ConsecutiveGuest = MostConsecutive['guests'][number];

// Data for the pie / bar charts.
export interface IGeographyChartVm {
  type: 'pie' | 'bar';
  title: string;
  datasetLabel: string;
  labels: string[];
  values: number[];
  colors: IChartColors;
  legend: IChartLegendItem[] | null;
  height?: number;
  items: GeographyItem[];
}

// Data for the most consecutive scatter chart.
export interface IConsecutiveChartVm {
  title: string;
  countryName: string;
  countryCode: string;
  guests: ConsecutiveGuest[];
  points: IChartPoint[];
  colors: IChartColors;
  legend: IChartLegendItem[];
  xMin: number;
  xMax: number;
  height: number;
}
