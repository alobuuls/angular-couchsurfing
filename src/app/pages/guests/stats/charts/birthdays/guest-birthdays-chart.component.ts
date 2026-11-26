import { Component, inject, Input } from '@angular/core';

// Interfaces
import { IBirthdaysDistribution, IBirthdaysView } from '@interfaces/stats-interface';
import { IChartPadding, TChartTooltipContent } from '@type/chart.types';
import { IBirthdaysBubbleVm, IBirthdaysHeatmapVm, IBirthdaysLineVm } from '@interfaces/charts/chart-birthdate.interface';

// Services
import { FormatService } from '@shared/services/format.service';
import { GuestsNavigationService } from '@pages/guests/services/guests-navigation.service';
import { StatsLabelsService } from '@pages/guests/services/stats-labels.service';
import { StatsChartContainer } from '@pages/guests/directives/stats-chart-container.directive';

// Helpers
import { BIRTHDAYS_COLORS } from '@utils';

const MONTH_KEYS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

@Component({
  selector: 'guest-birthdays-chart',
  templateUrl: './guest-birthdays-chart.component.html',
  styleUrls: ['./guest-birthdays-chart.component.css'],
})
export class GuestBirthdaysChartComponent extends StatsChartContainer {
  private readonly _format = inject(FormatService);
  private readonly _nav = inject(GuestsNavigationService);
  private readonly _labels = inject(StatsLabelsService);

  @Input() birthdays!: IBirthdaysDistribution;

  selectedView: IBirthdaysView = 'calendar';
  readonly birthdaysViews: IBirthdaysView[] = ['calendar', 'repeated', 'unusual'];

  // Only one of them is defined at a time.
  heatmapVm?: IBirthdaysHeatmapVm;
  bubbleVm?: IBirthdaysBubbleVm;
  lineVm?: IBirthdaysLineVm;

  // Shared axis titles.
  monthAxisTitle = '';
  dayAxisTitle = '';

  // Translated month names (rebuilt when the language changes).
  private months: string[] = [];

  // Space around the heatmap / line charts.
  readonly chartPadding: IChartPadding = { top: 30, right: 40, bottom: 30, left: 40 };
  readonly cellBorderColor = BIRTHDAYS_COLORS.calendar.border;

  selectView(view: IBirthdaysView): void {
    this.selectedView = view;
    this.buildView();
  }

  // FORMATTERS
  monthTickFormatter = (value: number | string): string => this.months[Number(value) - 1] ?? '';

  // Hides the ticks 0 and 32 of the line chart.
  dayTickFormatter = (value: number | string): string | number => (value === 0 || value === 32 ? '' : value);

  calendarCellColor = (total: number): string => {
    if (total === 0) return BIRTHDAYS_COLORS.calendar.empty;
    if (total === 1) return BIRTHDAYS_COLORS.calendar.one;
    if (total === 2) return BIRTHDAYS_COLORS.calendar.two;
    return BIRTHDAYS_COLORS.calendar.many;
  };

  // CLICKS
  onCalendarClick(index: number): void {
    const cell = this.heatmapVm?.cells[index];

    if (cell && cell.v > 0) {
      const { month, day } = this.getCalendarPosition(index);
      this.navigateToBirthday(month, day);
    }
  }

  onRepeatedClick(index: number): void {
    const item = this.bubbleVm?.items[index];

    if (item) this.navigateToBirthday(item.month, item.day);
  }

  onUnusualClick(index: number): void {
    const item = this.lineVm?.items[index];

    if (item) this.navigateToBirthday(item.month, item.day);
  }

  // TOOLTIPS
  getCalendarTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.heatmapVm;
    const cell = vm?.cells[index];

    if (!vm || !cell) return null;

    const { month, day } = this.getCalendarPosition(index);
    const item = vm.birthdayMap.get(`${month}-${day}`);

    return {
      title: this._format.formatBirthday(month, day),
      rows: [{ value: this.t('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: cell.v }) }, ...(item ? this._labels.guestRows(item.guests) : [])],
    };
  };

  getRepeatedTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.bubbleVm?.items[index];

    if (!item) return null;

    return {
      title: this._format.formatBirthday(item.month, item.day),
      rows: [{ value: this.t('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: item.total }) }, ...this._labels.guestRows(item.guests)],
    };
  };

  getUnusualTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.lineVm?.items[index];

    if (!item) return null;

    return {
      title: this._format.formatBirthday(item.month, item.day),
      rows: [
        { value: this.t('STATS.BIRTHDAYS.TOOLTIPS.REASON', { reason: item.reason }) },
        { value: this.t('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: item.total }) },
        ...this._labels.guestRows(item.guests),
      ],
    };
  };

  // VIEW MODELS
  protected buildView(): void {
    this.heatmapVm = undefined;
    this.bubbleVm = undefined;
    this.lineVm = undefined;

    if (!this.birthdays) return;

    this.months = MONTH_KEYS.map(month => this.t(`STATS.BIRTHDAYS.MONTHS.${month}`));
    this.monthAxisTitle = this.t('STATS.BIRTHDAYS.AXES.MONTH');
    this.dayAxisTitle = this.t('STATS.BIRTHDAYS.AXES.DAY');

    switch (this.selectedView) {
      case 'calendar':
        this.heatmapVm = this.buildCalendarVm();
        break;
      case 'repeated':
        this.bubbleVm = this.buildRepeatedVm();
        break;
      case 'unusual':
        this.lineVm = this.buildUnusualVm();
        break;
    }
  }

  private buildCalendarVm(): IBirthdaysHeatmapVm | undefined {
    const calendar = this.birthdays.calendar;

    if (!calendar?.length) return undefined;

    const days = Array.from({ length: 31 }, (_, index) => String(index + 1));

    // Birthday information by month and day.
    const birthdayMap = new Map(calendar.map(item => [`${item.month}-${item.day}`, item]));

    // All 12 × 31 cells. The order matters: see getCalendarPosition.
    const cells = this.months.flatMap((month, monthIndex) =>
      days.map(day => ({
        x: month,
        y: day,
        v: birthdayMap.get(`${monthIndex + 1}-${Number(day)}`)?.total ?? 0,
      }))
    );

    return {
      title: this.t('STATS.BIRTHDAYS.TITLES.CALENDAR'),
      datasetLabel: this.t('STATS.BIRTHDAYS.LABELS.CALENDAR'),
      xLabels: this.months,
      yLabels: days,
      cells,
      birthdayMap,
    };
  }

  private buildRepeatedVm(): IBirthdaysBubbleVm | undefined {
    const repeated = this.birthdays.repeated;

    if (!repeated?.length) return undefined;

    return {
      title: this.t('STATS.BIRTHDAYS.TITLES.REPEATED'),
      datasetLabel: this.t('STATS.BIRTHDAYS.LABELS.REPEATED_BIRTHDAYS'),
      // More guests means a larger bubble.
      points: repeated.map(item => ({ x: item.month, y: item.day, r: Math.max(10, item.total * 6) })),
      colors: { background: [BIRTHDAYS_COLORS.repeated.background], border: [BIRTHDAYS_COLORS.repeated.border] },
      items: repeated,
    };
  }

  private buildUnusualVm(): IBirthdaysLineVm | undefined {
    const unusual = this.birthdays.unusual;

    if (!unusual?.length) return undefined;

    return {
      title: this.t('STATS.BIRTHDAYS.TITLES.UNUSUAL'),
      datasetLabel: this.t('STATS.BIRTHDAYS.LABELS.UNUSUAL_BIRTHDAYS'),
      points: unusual.map(item => ({ x: item.month, y: item.day })),
      colors: { background: [BIRTHDAYS_COLORS.unusual.background], border: [BIRTHDAYS_COLORS.unusual.border] },
      items: unusual,
    };
  }

  // Cells are created month by month with 31 days each.
  private getCalendarPosition(index: number): { month: number; day: number } {
    return { month: Math.floor(index / 31) + 1, day: (index % 31) + 1 };
  }

  private navigateToBirthday(month: number, day: number): void {
    const pad = (value: number) => String(value).padStart(2, '0');
    this._nav.toList({ birthDate: `${pad(month)}-${pad(day)}` });
  }
}
