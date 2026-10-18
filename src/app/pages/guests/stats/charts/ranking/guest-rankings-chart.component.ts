import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';

// Interfaces
import { IRankingGenderView, IRankingGroupView, IRankingItem, IRankingView, IRankingsDistribution } from '@interfaces/stats-interface';

// Helpers
import { getColorWithOpacity, getRankingColors, RANKING_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-rankings-chart',
  templateUrl: './guest-rankings-chart.component.html',
  styleUrls: ['./guest-rankings-chart.component.css'],
})
export class GuestRankingsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  @Input() rankings!: IRankingsDistribution;

  @ViewChild('rankingChart')
  rankingChart!: ElementRef<HTMLCanvasElement>;

  // Controls the currently selected ranking view.
  selectedView: IRankingView = 'people';

  // Available ranking views.
  readonly rankingViews: IRankingView[] = ['people', 'women', 'men', 'groups'];

  // Controls the selected People ranking view.
  selectedPeopleView: IRankingGenderView = 'overall';

  // Available People ranking views.
  readonly peopleRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Women ranking view.
  selectedWomenView: IRankingGenderView = 'overall';

  // Available Women ranking views.
  readonly womenRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Men ranking view.
  selectedMenView: IRankingGenderView = 'overall';

  // Available Men ranking views.
  readonly menRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Group ranking view.
  selectedGroupView: IRankingGroupView = 'overall';

  // Available Group ranking views.
  readonly groupRankingViews: IRankingGroupView[] = ['overall', 'couple', 'family', 'friends'];

  // Stores the current Chart.js instance.
  private chart?: Chart;

  // Configuration for each ranking view.
  private readonly chartConfig: Record<
    IRankingView,
    {
      titleKey: string;
      getData: (rankings: IRankingsDistribution) => IRankingItem[];
    }
  > = {
    people: {
      titleKey: 'STATS.RANKINGS.TITLES.PEOPLE',
      getData: rankings => rankings.people.overall,
    },

    women: {
      titleKey: 'STATS.RANKINGS.TITLES.WOMEN',
      getData: rankings => rankings.women.overall,
    },

    men: {
      titleKey: 'STATS.RANKINGS.TITLES.MEN',
      getData: rankings => rankings.men.overall,
    },

    groups: {
      titleKey: 'STATS.RANKINGS.TITLES.GROUPS',
      getData: rankings => rankings.groups.overall,
    },
  };

  // Create the initial ranking chart after the canvas is rendered.
  ngAfterViewInit(): void {
    if (this.rankings) {
      this.createChart();
    }

    // Recreate the chart when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.createChart();
    });
  }

  // Recreate the chart when ranking data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rankings'] && this.rankingChart) {
      this.createChart();
    }
  }

  // Clean up subscriptions and the chart instance.
  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.destroyChart();
  }

  // Changes the main ranking view.
  selectView(view: IRankingView): void {
    this.selectedView = view;

    // Reset the selected subview when changing the main view.
    if (view === 'people') {
      this.selectedPeopleView = 'overall';
    }

    if (view === 'women') {
      this.selectedWomenView = 'overall';
    }

    if (view === 'men') {
      this.selectedMenView = 'overall';
    }

    if (view === 'groups') {
      this.selectedGroupView = 'overall';
    }

    this.createChart();
  }

  // Changes the selected People ranking view.
  selectPeopleView(view: IRankingGenderView): void {
    this.selectedPeopleView = view;
    this.createChart();
  }

  // Changes the selected Women ranking view.
  selectWomenView(view: IRankingGenderView): void {
    this.selectedWomenView = view;
    this.createChart();
  }

  // Changes the selected Men ranking view.
  selectMenView(view: IRankingGenderView): void {
    this.selectedMenView = view;
    this.createChart();
  }

  // Changes the selected Group ranking view.
  selectGroupView(view: IRankingGroupView): void {
    this.selectedGroupView = view;
    this.createChart();
  }

  // Creates the ranking chart according to the selected view.
  private createChart(): void {
    if (!this.rankingChart || !this.rankings) {
      return;
    }

    // Destroy the previous chart before creating another one.
    this.destroyChart();

    const config = this.chartConfig[this.selectedView];

    // Get the data for the selected main view and subview.
    const rankingData =
      this.selectedView === 'people'
        ? (this.rankings.people[this.selectedPeopleView] ?? [])
        : this.selectedView === 'women'
          ? (this.rankings.women[this.selectedWomenView] ?? [])
          : this.selectedView === 'men'
            ? (this.rankings.men[this.selectedMenView] ?? [])
            : this.selectedView === 'groups'
              ? (this.rankings.groups[this.selectedGroupView] ?? [])
              : config.getData(this.rankings);

    // Do not create a chart when there is no ranking data.
    if (!rankingData.length) {
      return;
    }

    // Get the highest ranking position from the current data.
    const maxPosition = Math.max(...rankingData.map(item => item.position));

    // Keep the chart maximum aligned with the ranking scale.
    const chartMax = maxPosition <= 100 ? 100 : Math.ceil(maxPosition / 50) * 50;

    // Ranking scale: 1, 10, 25, 50, 75, 100, then every 50.
    const rankingTicks = [1, 10, 25, 50, 75, 100];

    if (chartMax > 100) {
      for (let position = 150; position <= chartMax; position += 50) {
        rankingTicks.push(position);
      }
    }

    const rankColors = getRankingColors(rankingData.map(item => item.position));

    const title = this._translate.instant(config.titleKey);
    const subviewLabel = this.getSelectedSubviewLabel();

    const datasetLabel = this._translate.instant('STATS.RANKINGS.LABELS.DATASET', {
      title,
      subview: subviewLabel,
    });

    this.chart = new Chart(this.rankingChart.nativeElement, {
      type: 'bar',

      data: {
        // Use the translated guest display name in chart labels.
        labels: rankingData.map(item => this.getGuestDisplayName(item)),

        datasets: [
          {
            label: datasetLabel,
            data: rankingData.map(item => item.position),

            backgroundColor: rankColors.background.map(color => {
              const rankingColor = Object.values(RANKING_COLORS).find(ranking => ranking.background === color);

              return rankingColor ? getColorWithOpacity(rankingColor) : color;
            }),

            borderColor: rankColors.border,
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
          const item = rankingData[index];

          if (!item?.guest?.guestId) {
            return;
          }

          this.navigateToGuest(item.guest.guestId, item.guest.groupType, item.guest.groupId);
        },

        indexAxis: 'y',

        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                const item = rankingData[context.dataIndex];

                return [
                  this._translate.instant('STATS.RANKINGS.LABELS.OVERALL_RANKING', { position: item.position }),

                  this._translate.instant('STATS.RANKINGS.LABELS.VISIT', {
                    date: this._format.formatDate(item.guest.visitedDate),
                  }),
                ];
              },
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,
            min: 0,
            max: chartMax,

            ticks: {
              callback: (value: string | number) => {
                const numericValue = Number(value);

                return rankingTicks.includes(numericValue) ? numericValue : '';
              },
            },

            title: {
              display: true,
              text: this._translate.instant('STATS.RANKINGS.LABELS.RANKING_POSITION'),
            },
          },

          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Gets the translated label for the selected subview.
  private getSelectedSubviewLabel(): string {
    let key: string;

    if (this.selectedView === 'people') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedPeopleView.toUpperCase()}`;
    } else if (this.selectedView === 'women') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedWomenView.toUpperCase()}`;
    } else if (this.selectedView === 'men') {
      key = `STATS.RANKINGS.SUBVIEWS.${this.selectedMenView.toUpperCase()}`;
    } else {
      key = `STATS.RANKINGS.GROUP_TYPES.${this.selectedGroupView.toUpperCase()}`;
    }

    return this._translate.instant(key);
  }

  // Formats the guest name according to the selected ranking view.
  private getGuestDisplayName(item: IRankingItem): string {
    const country = this._format.formatCountry(item.guest.hometownCode);
    return `${item.guest.fullName} (${country})`;
  }

  // Destroys the current Chart.js instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  // Navigates to the group or individual guest details.
  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }
}
