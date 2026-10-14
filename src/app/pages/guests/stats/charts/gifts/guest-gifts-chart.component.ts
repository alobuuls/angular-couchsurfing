import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';

// Interfaces
import { IGiftGuest, IGiftsDistribution, IGiftsView } from '@interfaces/stats-interface';

// Helpers
import { getColorWithOpacity, GIFTS_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-gifts-chart',
  templateUrl: './guest-gifts-chart.component.html',
  styleUrls: ['./guest-gifts-chart.component.css'],
})
export class GuestGiftsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  @Input() gifts!: IGiftsDistribution;

  @ViewChild('giftsChart')
  giftsChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected gifts view.
  selectedView: IGiftsView = 'groups';

  // Available gifts views.
  readonly giftsViews: IGiftsView[] = ['groups', 'solo'];

  // Labels displayed in the view buttons.
  readonly giftsViewLabels: Record<IGiftsView, string> = {
    groups: 'STATS.GIFTS.VIEWS.GROUPS',
    solo: 'STATS.GIFTS.VIEWS.SOLO',
  };

  private chart?: Chart;

  // Configuration for each gifts view.
  private readonly chartConfig: Record<
    IGiftsView,
    {
      titleKey: string;
      getData: (gifts: IGiftsDistribution) => IGiftGuest[];
    }
  > = {
    groups: {
      titleKey: 'STATS.GIFTS.TITLES.GROUPS',
      getData: gifts => gifts.groups,
    },

    solo: {
      titleKey: 'STATS.GIFTS.TITLES.SOLO',
      getData: gifts => gifts.solo,
    },
  };

  ngAfterViewInit(): void {
    if (this.gifts) {
      this.createChart();
    }

    // Recreate the chart when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.createChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gifts'] && this.giftsChart) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.destroyChart();
  }

  selectView(view: IGiftsView): void {
    if (this.selectedView === view) {
      return;
    }

    this.selectedView = view;
    this.createChart();
  }

  // Creates the Polar Area chart for the selected gifts view.
  private createChart(): void {
    if (!this.giftsChart || !this.gifts) {
      return;
    }

    this.destroyChart();

    const config = this.chartConfig[this.selectedView];
    const giftsData = config.getData(this.gifts);

    if (!giftsData.length) {
      return;
    }

    const title = this._translate.instant(config.titleKey);

    this.giftsChart.nativeElement.style.height = `${Math.max(400, giftsData.length * 50)}px`;

    this.chart = new Chart(this.giftsChart.nativeElement, {
      type: 'polarArea',
      data: {
        labels: giftsData.map(guest => guest.fullName),
        datasets: [
          {
            label: title,
            data: giftsData.map(guest => guest.total),
            backgroundColor: giftsData.map((_, index) => getColorWithOpacity(GIFTS_COLORS[index % GIFTS_COLORS.length])),
            borderColor: giftsData.map((_, index) => GIFTS_COLORS[index % GIFTS_COLORS.length].border),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }
          const index = elements[0].index;
          const guest = giftsData[index];

          if (!guest?.guestId) {
            return;
          }
          this.navigateToGuest(guest.guestId);
        },
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label: context => {
                const guest = giftsData[context.dataIndex];

                return this._translate.instant('STATS.GIFTS.LABELS.GIFTS_COUNT', { count: guest.total });
              },
              afterBody: context => {
                const guest = giftsData[context[0].dataIndex];
                return this.getTooltipLines(guest);
              },
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Builds the common tooltip information for both charts.
  private getTooltipLines(guest: IGiftGuest): string[] {
    return [
      `${this._translate.instant('STATS.GIFTS.LABELS.GROUP')}: ${this.formatGroupType(guest.groupType)}`,

      `${this._translate.instant('STATS.GIFTS.LABELS.COUNTRY')}: ${this._format.formatCountry(guest.hometownCode)}`,

      `${this._translate.instant('STATS.GIFTS.LABELS.VISIT')}: ${this._format.formatDate(guest.visitedDate)}`,

      this._translate.instant('STATS.GIFTS.LABELS.GIFTS_RECEIVED'),

      ...guest.gifts.map(gift => `• ${gift}`),
    ];
  }

  // Translates the group type received from the API.
  private formatGroupType(groupType: string): string {
    if (!groupType) {
      return this._translate.instant('STATS.GIFTS.LABELS.UNKNOWN');
    }

    const key = `STATS.GIFTS.LABELS.GROUP_TYPES.${groupType.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? groupType.charAt(0).toUpperCase() + groupType.slice(1) : translated;
  }

  // Destroys the current Chart.js instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  private navigateToGuest(guestId: string): void {
    this._router.navigate(['/guests', guestId]);
  }
}
