import type { IChartColor } from '@utils';
import type {
  IChartBarSeries,
  IChartBubblePoint,
  IChartColors,
  IChartEdge,
  IChartHeatmapCell,
  IChartLegendItem,
  IChartNetworkColors,
  IChartPoint,
  IChartScatterSeries,
  IChartXYPoint,
} from '@type/chart.types';
import type { IQueryParamsGuests, TGroupType, TGuestGroupType } from '@interfaces/guests.interface';
import type {
  IBirthdayItem,
  IDemographicGender,
  IDemographicPerson,
  IDemographicsView,
  IGeographyConsecutiveGuest,
  IGeographyContinent,
  IGeographyCountry,
  IGeographyDistribution,
  IGeographyLocation,
  IGeographyRegion,
  IGiftGuest,
  ILongestItem,
  IMaxPeopleTogetherItem,
  IRankingItem,
  IRatingGuest,
  ISameArrivalDay,
  ISameArrivalItem,
  IStayGuest,
  ISummaryDistribution,
  ITimelineItem,
  IUnusualBirthday,
} from '@interfaces/stats-interface';

// ─────────────────────────────────────────────
// Building blocks
// Every view model is a composition of these pieces.
// ─────────────────────────────────────────────

export type TTickFormatter = (value: number | string) => string | number;

export interface IWithTitle {
  title: string;
}

export interface IWithDatasetLabel {
  datasetLabel: string;
}

export interface IWithLegend {
  legend: IChartLegendItem[];
}

// Source items behind each point, in the same order.
// They are used to resolve clicks and tooltips from the index of a point.
export interface IWithItems<TItem> {
  items: TItem[];
}

export interface IWithValueAxis {
  valueAxisTitle: string;
}

export interface IWithCategoryAxis {
  categoryAxisTitle: string;
}

// One value per label (pie, doughnut, bar, polar area and radar charts).
export interface ICategoryData {
  labels: string[];
  values: number[];
  colors: IChartColors;
}

export type ICategoryVm = IWithDatasetLabel & ICategoryData;

// Chart made of points (scatter, bubble, line and dot plot charts).
export interface IPointsData<TPoint> extends IWithDatasetLabel {
  points: TPoint[];
  colors: IChartColors;
}

// Network chart: one node per label; the edges reference the nodes by index.
export interface INetworkVm extends IWithTitle {
  labels: string[];
  edges: IChartEdge[];
  colors: IChartNetworkColors;
}

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────

export interface ISummaryRadarVm extends ICategoryVm {
  max: number;
  pointColors: IChartColors;
}

export type ISummaryDoughnutVm = ICategoryVm;

// Static definition of a summary card.
export interface ISummaryCardConfig {
  // i18n key: STATS.SUMMARY.CARDS.<key>
  key: string;
  icon: string;
  value: (summary: ISummaryDistribution) => number;
  // Guests filter opened by the card.
  groupType?: IQueryParamsGuests['groupType'];
}

// Card ready to be rendered.
export interface ISummaryCardVm extends Omit<ISummaryCardConfig, 'value'> {
  value: number;
}

// ─────────────────────────────────────────────
// Rankings
// ─────────────────────────────────────────────

export interface IRankingChartVm extends IWithTitle, ICategoryVm, IWithItems<IRankingItem> {
  // Highest value of the axis.
  max: number;
  tickFormatter: TTickFormatter;
}

// ─────────────────────────────────────────────
// Rating
// ─────────────────────────────────────────────

// Distribution chart (bar / doughnut).
export type IRatingDistributionVm = ICategoryVm;

// Lowest / highest dot plot.
export interface IRatingDotPlotVm extends ICategoryVm {
  guests: IRatingGuest[];
}

// ─────────────────────────────────────────────
// Gifts
// ─────────────────────────────────────────────

export interface IGiftsChartVm extends IWithTitle, ICategoryData, IWithItems<IGiftGuest> {
  height: number;
}

// ─────────────────────────────────────────────
// Geography
// ─────────────────────────────────────────────

export type GeographyItem = IGeographyContinent | IGeographyRegion | IGeographyCountry | IGeographyLocation;
export type ConsecutiveGuest = IGeographyConsecutiveGuest;

// Pie / bar charts.
export interface IGeographyChartVm extends IWithTitle, ICategoryVm, IWithItems<GeographyItem> {
  type: 'pie' | 'bar';
  // Null: the chart uses the default legend.
  legend: IChartLegendItem[] | null;
  height?: number;
}

// Most consecutive scatter chart.
export interface IConsecutiveChartVm extends IWithTitle, IWithLegend {
  countryName: string;
  countryCode: string;
  guests: ConsecutiveGuest[];
  points: IChartPoint[];
  colors: IChartColors;
  xMin: number;
  xMax: number;
  height: number;
}

// Gets the items of a geography view from the API data.
export type TGeographyLoader = (geography: IGeographyDistribution) => GeographyItem[];

export interface IGeographyViewConfig {
  // i18n key of the chart title.
  titleKey: string;
  type: IGeographyChartVm['type'];
  getAllData: TGeographyLoader;
  getTopData?: TGeographyLoader;
  getBottomData?: TGeographyLoader;
}

// ─────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────

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

export interface ITimelineBarVm extends IWithTitle, ICategoryData, IWithValueAxis, IWithLegend, IWithItems<TBarItem> {
  height?: number;
}

export interface ITimelineNetworkVm extends INetworkVm {
  nodes: INetworkNode[];
}

// ─────────────────────────────────────────────
// Stays
// ─────────────────────────────────────────────

// Longest / shortest polar area chart.
export interface IStaysPolarVm extends IWithTitle, ICategoryData, IWithItems<ILongestItem> {}

// Max people together bar chart.
export interface IStaysMaxPeopleVm extends IWithTitle, ICategoryData, IWithValueAxis, IWithCategoryAxis {
  entries: { label: string; data: IMaxPeopleTogetherItem }[];
}

// Same arrival bar chart.
export interface IStaysArrivalVm extends IWithTitle, IWithDatasetLabel, ICategoryData, IWithLegend, IWithValueAxis, IWithCategoryAxis, IWithItems<ISameArrivalItem> {}

// Same dates network chart.
export interface IStaysNetworkVm extends INetworkVm, IWithLegend {
  guests: IStayGuest[];
}

// ─────────────────────────────────────────────
// Birthdays
// ─────────────────────────────────────────────

export interface IBirthdaysHeatmapCell extends IChartHeatmapCell {
  month: number;
  day: number;
}

export interface IBirthdaysHeatmapVm extends IWithTitle, IWithDatasetLabel {
  xLabels: string[];
  yLabels: string[];
  cells: IBirthdaysHeatmapCell[];
  // Birthday by "month-day".
  birthdayMap: Map<string, IBirthdayItem>;
}

export interface IBirthdaysBubbleVm extends IWithTitle, IPointsData<IChartBubblePoint>, IWithItems<IBirthdayItem> {}

export interface IBirthdaysLineVm extends IWithTitle, IPointsData<IChartXYPoint>, IWithItems<IUnusualBirthday> {}

// ─────────────────────────────────────────────
// Demographics
// ─────────────────────────────────────────────

export type TDemographicKey = IDemographicGender;
export type TGroupKey = TGroupType;
export type TGroupRow = TGuestGroupType;
export type TAgeMode = Extract<IDemographicsView, 'oldest' | 'youngest'>;

// The person of the API stats payload.
export type IDemographicsPerson = IDemographicPerson;

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

// Overall totals pie chart.
export type IDemographicsPieVm = ICategoryVm;

// Totals by group: one series per demographic.
export interface IDemographicsGroupsBarVm {
  labels: string[];
  series: IChartBarSeries[];
}

// Oldest / youngest: overall ranking.
export interface IDemographicsRankingBarVm extends ICategoryVm, IWithLegend, IWithItems<IDemographicsPersonItem> {}

// Oldest / youngest: solo guests.
export interface IDemographicsScatterVm extends IPointsData<IChartXYPoint>, IWithLegend, IWithItems<IDemographicsPersonItem> {}

// Oldest / youngest: groups.
export interface IDemographicsBubbleVm extends IPointsData<IChartBubblePoint>, IWithLegend, IWithItems<IDemographicsPersonItem> {}

// First / last guests.
export interface IDemographicsFirstLastVm extends IWithLegend {
  yLabels: string[];
  yTitle: string;
  showGender: boolean;
  // One series per row; its points are [first, last] joined by a line.
  series: IChartScatterSeries[];
  // items[row][point]: same order as series[row].points.
  items: IDemographicsFirstLastItem[][];
}

export interface IFirstLastRow {
  label: string;
  entries: (IDemographicsFirstLastItem & { color: IChartColor })[];
  lineColor: string;
}

/** @deprecated Use IChartColor from the colors file. */
export type TColor = IChartColor;
