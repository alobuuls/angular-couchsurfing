import { ThemeMode } from '@core/services/theme.service';

export interface IChartTheme {
  text: string;
  grid: string;
  border: string;
}

export const getChartTheme = (theme: ThemeMode): IChartTheme => {
  const isDark = theme === 'dark';

  return {
    text: isDark ? '#e2e8f0' : '#666666',
    grid: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
    border: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)',
  };
};
