// View Chart
export type ICurrentChart = 'summary' | 'ranking' | 'demographics' | 'oldest' | 'youngest' | 'mostVisitedGender' | 'firstLast' | 'rating';

// Rating
export interface IRatingsDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  unrated: number;
}

export type IRatingView = 'overall' | 'solo' | 'couple' | 'friends' | 'family';
export type IRatingGroupType = Exclude<IRatingView, 'overall'>;
export type IChartType = 'bar' | 'doughnut';
