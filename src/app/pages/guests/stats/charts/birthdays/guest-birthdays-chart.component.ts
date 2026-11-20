import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Interfaces
import { IBirthdaysDistribution, IBirthdaysView } from '@interfaces/stats-interface';
import { IChartPadding, TChartTooltipContent } from '@type/chart.types';
import { IBirthdaysBubbleVm, IBirthdaysHeatmapVm, IBirthdaysLineVm } from '@interfaces/charts/chart-birthdate.interface';

// Helpers
import { BIRTHDAYS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';

@Component({
  selector: 'guest-birthdays-chart',
  templateUrl: './guest-birthdays-chart.component.html',
  styleUrls: ['./guest-birthdays-chart.component.css'],
})
export class GuestBirthdaysChartComponent implements OnInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private readonly _flag = inject(FlagPipe);

  private langChangeSubscription?: Subscription;

  // Birthdays data received from parent.
  @Input() birthdays!: IBirthdaysDistribution;

  // Stores the main selected Birthdays view.
  selectedView: IBirthdaysView = 'calendar';

  // Main Birthdays views.
  readonly birthdaysViews: IBirthdaysView[] = ['calendar', 'repeated', 'unusual'];

  // Only one of them is defined at a time.
  heatmapVm?: IBirthdaysHeatmapVm;
  bubbleVm?: IBirthdaysBubbleVm;
  lineVm?: IBirthdaysLineVm;

  // Shared axis titles.
  monthAxisTitle = '';
  dayAxisTitle = '';

  // Space around the heatmap / line charts.
  readonly chartPadding: IChartPadding = { top: 30, right: 40, bottom: 30, left: 40 };

  ngOnInit(): void {
    // Rebuild the texts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => this.buildView());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['birthdays']) {
      this.buildView();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  selectView(view: IBirthdaysView): void {
    if (this.selectedView === view) {
      return;
    }

    this.selectedView = view;
    this.buildView();
  }

  // FORMATTERS (arrow functions: stable references that keep `this`)
  monthTickFormatter = (value: number | string): string => this.getMonthName(Number(value));

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

    if (!cell || cell.v === 0) {
      return;
    }

    const { month, day } = this.getCalendarPosition(index);
    this.navigateToBirthday(month, day);
  }

  onRepeatedClick(index: number): void {
    const item = this.bubbleVm?.items[index];

    if (item) {
      this.navigateToBirthday(item.month, item.day);
    }
  }

  onUnusualClick(index: number): void {
    const item = this.lineVm?.items[index];

    if (item) {
      this.navigateToBirthday(item.month, item.day);
    }
  }

  // TOOLTIPS
  getCalendarTooltip = (index: number): TChartTooltipContent | null => {
    const vm = this.heatmapVm;
    const cell = vm?.cells[index];

    if (!vm || !cell) {
      return null;
    }

    const { month, day } = this.getCalendarPosition(index);
    const item = vm.birthdayMap.get(`${month}-${day}`);

    return {
      title: this._format.formatBirthday(month, day),
      rows: [{ value: this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: cell.v }) }, ...(item ? this.getGuestRows(item.guests) : [])],
    };
  };

  getRepeatedTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.bubbleVm?.items[index];

    if (!item) {
      return null;
    }

    return {
      title: this._format.formatBirthday(item.month, item.day),
      rows: [{ value: this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: item.total }) }, ...this.getGuestRows(item.guests)],
    };
  };

  getUnusualTooltip = (index: number): TChartTooltipContent | null => {
    const item = this.lineVm?.items[index];

    if (!item) {
      return null;
    }

    return {
      title: this._format.formatBirthday(item.month, item.day),
      rows: [
        { value: this.translate('STATS.BIRTHDAYS.TOOLTIPS.REASON', { reason: item.reason }) },
        { value: this.translate('STATS.BIRTHDAYS.TOOLTIPS.GUESTS', { count: item.total }) },
        ...this.getGuestRows(item.guests),
      ],
    };
  };

  // VIEW MODELS
  private buildView(): void {
    this.heatmapVm = undefined;
    this.bubbleVm = undefined;
    this.lineVm = undefined;

    if (!this.birthdays) {
      return;
    }

    this.monthAxisTitle = this.translate('STATS.BIRTHDAYS.AXES.MONTH');
    this.dayAxisTitle = this.translate('STATS.BIRTHDAYS.AXES.DAY');

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

    if (!calendar?.length) {
      return undefined;
    }

    const months = this.getMonths();
    const days = Array.from({ length: 31 }, (_, index) => String(index + 1));

    // Store birthday information by month and day.
    const birthdayMap = new Map(calendar.map(item => [`${item.month}-${item.day}`, item]));

    // All 12 × 31 cells. The order matters: see getCalendarPosition.
    const cells = months.flatMap((month, monthIndex) =>
      days.map(day => ({
        x: month,
        y: day,
        v: birthdayMap.get(`${monthIndex + 1}-${Number(day)}`)?.total ?? 0,
      }))
    );

    const title = this.translate('STATS.BIRTHDAYS.TITLES.CALENDAR');

    return { title, datasetLabel: this.translate('STATS.BIRTHDAYS.LABELS.CALENDAR'), xLabels: months, yLabels: days, cells, birthdayMap };
  }

  private buildRepeatedVm(): IBirthdaysBubbleVm | undefined {
    const repeated = this.birthdays.repeated;

    if (!repeated?.length) {
      return undefined;
    }

    return {
      title: this.translate('STATS.BIRTHDAYS.TITLES.REPEATED'),
      datasetLabel: this.translate('STATS.BIRTHDAYS.LABELS.REPEATED_BIRTHDAYS'),
      // More guests means a larger bubble.
      points: repeated.map(item => ({ x: item.month, y: item.day, r: Math.max(10, item.total * 6) })),
      colors: { background: [BIRTHDAYS_COLORS.repeated.background], border: [BIRTHDAYS_COLORS.repeated.border] },
      items: repeated,
    };
  }

  private buildUnusualVm(): IBirthdaysLineVm | undefined {
    const unusual = this.birthdays.unusual;

    if (!unusual?.length) {
      return undefined;
    }

    return {
      title: this.translate('STATS.BIRTHDAYS.TITLES.UNUSUAL'),
      datasetLabel: this.translate('STATS.BIRTHDAYS.LABELS.UNUSUAL_BIRTHDAYS'),
      points: unusual.map(item => ({ x: item.month, y: item.day })),
      colors: { background: [BIRTHDAYS_COLORS.unusual.background], border: [BIRTHDAYS_COLORS.unusual.border] },
      items: unusual,
    };
  }

  // HELPERS
  private translate(key: string, params?: Record<string, unknown>): string {
    return this._translate.instant(key, params);
  }

  private getMonths(): string[] {
    return ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].map(month =>
      this.translate(`STATS.BIRTHDAYS.MONTHS.${month}`)
    );
  }

  private getMonthName(month: number): string {
    return this.getMonths()[month - 1] ?? '';
  }

  // Cells are created month by month with 31 days each.
  private getCalendarPosition(index: number): { month: number; day: number } {
    return { month: Math.floor(index / 31) + 1, day: (index % 31) + 1 };
  }

  private getGuestRows(guests: { fullName: string; hometownCode?: string | null }[]): TChartTooltipContent['rows'] {
    return guests.map(guest => ({
      value: `• ${guest.fullName}`,
      ...(guest.hometownCode
        ? {
            country: {
              name: this._format.formatCountry(guest.hometownCode),
              flagClass: this._flag.transform(guest.hometownCode),
            },
          }
        : {}),
    }));
  }

  private navigateToBirthday(month: number, day: number): void {
    const birthDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    this._router.navigate(['/guests'], {
      queryParams: { view: 'cards', birthDate },
    });
  }
}
