import { ICurrentChart } from '@interfaces/stats-interface';

export interface IStatsNavItem {
  chart: ICurrentChart;
  icon: string;
  btnClass: string;
}

// Single source of truth: it generates the nav buttons and the child routes.
export const STATS_NAV: IStatsNavItem[] = [
  { chart: 'summary', icon: 'bar_chart', btnClass: 'btn-summary' },
  { chart: 'demographics', icon: 'groups', btnClass: 'btn-demographics' },
  { chart: 'geography', icon: 'globe_location_pin', btnClass: 'btn-geography' },
  { chart: 'gifts', icon: 'featured_seasonal_and_gifts', btnClass: 'btn-gifts' },
  { chart: 'rankings', icon: 'leaderboard', btnClass: 'btn-ranking' },
  { chart: 'ratings', icon: 'star', btnClass: 'btn-rating' },
  { chart: 'timeline', icon: 'timeline', btnClass: 'btn-timeline' },
  { chart: 'stays', icon: 'hotel', btnClass: 'btn-stays' },
  { chart: 'birthdays', icon: 'cake', btnClass: 'btn-birthdays' },
];
