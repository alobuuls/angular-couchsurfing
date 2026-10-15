import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';
import { LinearScale, PointElement } from 'chart.js';
import { EdgeLine, ForceDirectedGraphController } from 'chartjs-chart-graph';

// Register the network graph.
Chart.register(ForceDirectedGraphController, EdgeLine, LinearScale, PointElement);

// Interfaces
import { ILongestView, IStaysDistribution, IStaysView } from '@interfaces/stats-interface';

// Services
import { FormatService } from '@services/format.service';

// Helpers
import { CHART_NEUTRAL_COLOR, CHART_UNKNOWN_COLOR, GENDER_COLORS, getGenderColor, getRankingColors, STAYS_COLORS } from '@utils';

@Component({
  selector: 'guest-stays-chart',
  templateUrl: './guest-stays-chart.component.html',
  styleUrls: ['./guest-stays-chart.component.css'],
})
export class GuestStaysChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);

  private langChangeSubscription?: Subscription;

  // Stays data received from parent.
  @Input() stays!: IStaysDistribution;

  // Chart canvas.
  @ViewChild('staysChart')
  staysChart!: ElementRef<HTMLCanvasElement>;

  // Stores the main selected Stays view.
  selectedView: IStaysView = 'longest';

  // Main Stays views.
  readonly staysViews: IStaysView[] = ['longest', 'shortest', 'maxPeopleTogether', 'sameArrival', 'sameDates'];

  // Stores the selected Longest/Shortest subview.
  selectedStayView: ILongestView = 'overall';

  // Longest and Shortest subviews.
  readonly stayViews: ILongestView[] = ['overall', 'solo', 'couple', 'friends', 'family'];

  // Stores the selected Same Dates group.
  selectedSameDatesGroup = 0;

  // Stores current Chart.js instance.
  private chart?: Chart;

  // Configuration for Longest and Shortest views.
  private readonly chartConfig: Record<
    'longest' | 'shortest',
    {
      labelKey: string;
      getData: (stays: IStaysDistribution) => IStaysDistribution['longest'];
    }
  > = {
    longest: {
      labelKey: 'STATS.STAYS.TITLES.LONGEST',
      getData: stays => stays.longest,
    },
    shortest: {
      labelKey: 'STATS.STAYS.TITLES.SHORTEST',
      getData: stays => stays.shortest,
    },
  };

  // Group type translation keys for tooltips and guest labels.
  private readonly groupTypeKeys: Record<string, string> = {
    solo: 'STATS.STAYS.GROUP_LABELS.SOLO',
    couple: 'STATS.STAYS.GROUP_LABELS.COUPLE',
    friends: 'STATS.STAYS.GROUP_LABELS.FRIENDS',
    family: 'STATS.STAYS.GROUP_LABELS.FAMILY',
  };

  // Creates the chart after the view is initialized.
  ngAfterViewInit(): void {
    // Recreate charts when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.destroyChart();
      this.createChart();
    });

    if (this.stays) {
      this.createChart();
    }
  }

  // Recreates the chart when the input data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stays'] && this.staysChart && this.stays) {
      // Reset the selected group when new data arrives.
      this.selectedSameDatesGroup = 0;
      setTimeout(() => this.createChart());
    }
  }

  // Clean up when the component is destroyed.
  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
    this.destroyChart();
  }

  // Changes the main Stays view.
  selectView(view: IStaysView): void {
    this.selectedView = view;

    // Reset Same Dates group when entering this view.
    if (view === 'sameDates') {
      this.selectedSameDatesGroup = 0;
    }

    this.destroyChart();

    // Wait for Angular to update the template.
    setTimeout(() => this.createChart());
  }

  // Changes the selected Longest/Shortest subview.
  selectStayView(view: ILongestView): void {
    this.selectedStayView = view;
    this.destroyChart();

    // Wait for Angular to update the template.
    setTimeout(() => this.createChart());
  }

  // Changes the selected Same Dates group.
  selectSameDatesGroup(index: number): void {
    this.selectedSameDatesGroup = index;
    this.destroyChart();

    // Wait for Angular to update the canvas.
    setTimeout(() => this.createChart());
  }

  // Creates the corresponding chart according to the selected view.
  private createChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }

    // Longest and Shortest use the same Polar Area chart.
    if (this.selectedView === 'longest' || this.selectedView === 'shortest') {
      const config = this.chartConfig[this.selectedView];
      const stayData = config.getData(this.stays);
      const chartLabel = this.translate(config.labelKey);

      this.createStayPolarChart(stayData, this.selectedStayView, chartLabel);
      return;
    }

    if (this.selectedView === 'maxPeopleTogether') {
      this.createMaxPeopleTogetherBarChart();
      return;
    }

    // Same Arrival uses a Horizontal Bar chart.
    if (this.selectedView === 'sameArrival') {
      this.createSameArrivalBarChart();
      return;
    }

    // Same Dates uses one Network chart per group.
    if (this.selectedView === 'sameDates') {
      this.createSameDatesNetworkChart();
    }
  }

  // LONGEST / SHORTEST
  // Creates the Polar Area chart for Longest and Shortest stays.
  private createStayPolarChart(stayData: IStaysDistribution['longest'], selectedView: ILongestView, chartLabel: string): void {
    if (!this.staysChart || !stayData) {
      return;
    }

    // Get the selected stay data.
    const people = stayData[selectedView];

    if (!people || people.length === 0) {
      return;
    }

    this.destroyChart();

    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'polarArea',
      data: {
        labels: people.map(item => this.getGuestDisplayName(item.guest.fullName, item.guest.groupType)),
        datasets: [
          {
            label: chartLabel,

            // Number of nights determines the section size.
            data: people.map(item => item.nights),

            // Use guest gender for section colors.
            backgroundColor: people.map(item => {
              const gender = GENDER_COLORS[item.guest.gender.toLowerCase() as keyof typeof GENDER_COLORS];
              return gender?.background ?? CHART_NEUTRAL_COLOR;
            }),
            borderColor: people.map(item => getGenderColor(item.guest.gender)),
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
          const guest = people[index]?.guest;

          if (!guest?.guestId) {
            return;
          }

          this.navigateToGuest(guest.guestId, guest.groupType, guest.groupId);
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: chartLabel,
          },
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              title: context => {
                const guest = people[context[0].dataIndex];
                return this.getGuestDisplayName(guest.guest.fullName, guest.guest.groupType);
              },
              label: () => '',
              afterBody: context => {
                const guest = people[context[0].dataIndex];
                return this.getTooltipLines(guest, selectedView);
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

  // MAX PEOPLE TOGETHER
  // Creates a bar chart comparing Overall and Solo.
  private createMaxPeopleTogetherBarChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }

    const chartData = this.stays.maxPeopleTogether;

    if (!chartData) {
      return;
    }

    const overall = chartData.overall;
    const solo = chartData.solo;

    if (!overall || !solo) {
      return;
    }

    this.destroyChart();

    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'bar',
      data: {
        labels: [this.translate('STATS.STAYS.LABELS.OVERALL'), this.translate('STATS.STAYS.LABELS.SOLO')],
        datasets: [
          {
            label: this.translate('STATS.STAYS.TITLES.MAXIMUM_GUESTS_TOGETHER'),
            data: [overall.total, solo.total],
            backgroundColor: STAYS_COLORS.maxPeopleTogether.map(color => color.background),
            borderColor: STAYS_COLORS.maxPeopleTogether.map(color => color.border),
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
          const selectedData = index === 0 ? overall : solo;

          this.navigateToPeopleTogether(selectedData.guests);
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translate('STATS.STAYS.TITLES.MAXIMUM_GUESTS_TOGETHER'),
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: context => {
                const index = context[0].dataIndex;
                const selectedData = index === 0 ? overall : solo;
                const guest = selectedData.guests[0];

                return guest ? this._format.formatDate(guest.visitedDate) : '';
              },
              label: context =>
                this.translate('STATS.STAYS.LABELS.GUESTS_COUNT', {
                  count: context.parsed.y ?? 0,
                }),
              afterBody: context => {
                const index = context[0].dataIndex;
                const selectedData = index === 0 ? overall : solo;

                return ['', this.translate('STATS.STAYS.LABELS.GUESTS'), ...selectedData.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            title: {
              display: true,
              text: this.translate('STATS.STAYS.LABELS.GUESTS'),
            },
          },
          x: {
            title: {
              display: true,
              text: this.translate('STATS.STAYS.LABELS.STAY_TYPE'),
            },
          },
        },
      },
    });
  }

  // Creates a horizontal bar chart for guests with the same arrival date.
  private createSameArrivalBarChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }

    const chartData = this.stays.sameArrival;

    if (!chartData || chartData.length === 0) {
      return;
    }

    // Get ranking colors based on the number of guests.
    const rankingColors = getRankingColors(chartData.map(item => item.total));

    this.destroyChart();

    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'bar',
      data: {
        labels: chartData.map(item => this._format.formatDate(item.date)),
        datasets: [
          {
            label: this.translate('STATS.STAYS.VIEWS.SAMEARRIVAL'),

            // Number of guests determines bar length.
            data: chartData.map(item => item.total),

            // Color bars according to their ranking.
            backgroundColor: rankingColors.background,
            borderColor: rankingColors.border,
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const index = elements[0].index;
          const item = chartData[index];

          if (!item?.date) {
            return;
          }

          this._router.navigate(['/guests'], {
            queryParams: {
              view: 'cards',
              from: item.date,
              to: item.date,
            },
          });
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translate('STATS.STAYS.TITLES.GUESTS_WITH_SAME_ARRIVAL_DATE'),
          },
          legend: {
            display: true,
            labels: {
              generateLabels: () => [
                {
                  text: this.translate('STATS.STAYS.LABELS.FIRST'),
                  fillStyle: getRankingColors([1]).background[0],
                  strokeStyle: getRankingColors([1]).border[0],
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this.translate('STATS.STAYS.LABELS.SECOND'),
                  fillStyle: getRankingColors([1, 2]).background[1],
                  strokeStyle: getRankingColors([1, 2]).border[1],
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this.translate('STATS.STAYS.LABELS.THIRD'),
                  fillStyle: getRankingColors([1, 2, 3]).background[2],
                  strokeStyle: getRankingColors([1, 2, 3]).border[2],
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this.translate('STATS.STAYS.LABELS.OTHERS'),
                  fillStyle: getRankingColors([1, 2, 3, 4]).background[3],
                  strokeStyle: getRankingColors([1, 2, 3, 4]).border[3],
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
              ],
            },
          },
          tooltip: {
            callbacks: {
              label: context =>
                this.translate('STATS.STAYS.LABELS.GUESTS_COUNT', {
                  count: context.parsed.x ?? 0,
                }),
              afterBody: context => {
                const item = chartData[context[0].dataIndex];

                return ['', this.translate('STATS.STAYS.LABELS.GUESTS'), ...item.guests.map(guest => `• ${guest.fullName}`)];
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            title: {
              display: true,
              text: this.translate('STATS.STAYS.LABELS.OVERLAPPING_GUESTS'),
            },
          },
          y: {
            title: {
              display: true,
              text: this.translate('STATS.STAYS.LABELS.ARRIVAL_DATE'),
            },
          },
        },
      },
    });
  }

  // Creates a network chart for guests with the same dates.
  private createSameDatesNetworkChart(): void {
    if (!this.staysChart || !this.stays) {
      return;
    }

    const groups = this.stays.sameDates;

    if (!groups || groups.length === 0) {
      return;
    }

    const group = groups[this.selectedSameDatesGroup];

    if (!group || !group.guests || group.guests.length === 0) {
      return;
    }

    this.destroyChart();

    // Create one node for every guest in the group.
    const nodes = group.guests.map(guest => ({
      id: guest.guestId,
      label: this.getGuestDisplayName(guest.fullName, guest.groupType),
      gender: guest.gender,
      guestId: guest.guestId,
      groupType: guest.groupType,
      groupId: guest.groupId,
    }));

    // Connect every guest with the other guests in the same group.
    const edges = this.getSameDatesEdges(nodes);

    this.chart = new Chart(this.staysChart.nativeElement, {
      type: 'forceDirectedGraph',
      data: {
        labels: nodes.map(node => node.label),
        datasets: [
          {
            data: nodes.map(() => ({})),
            edges,
            pointRadius: 10,
            pointHoverRadius: 13,

            // Use guest gender for node colors.
            pointBackgroundColor: nodes.map(node => {
              const gender = GENDER_COLORS[node.gender.toLowerCase() as keyof typeof GENDER_COLORS];
              return gender?.background ?? CHART_NEUTRAL_COLOR;
            }),
            pointBorderColor: nodes.map(node => getGenderColor(node.gender)),
            borderColor: STAYS_COLORS.networkEdges,
            borderWidth: 2,
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
          const node = nodes[index];

          if (!node?.guestId) {
            return;
          }

          this.navigateToGuest(node.guestId, node.groupType, node.groupId);
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.translate('STATS.STAYS.TITLES.SAME_DATES_GROUP', {
              group: this.selectedSameDatesGroup + 1,
            }),
          },
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const genders = [...new Set(nodes.map(node => node.gender.toLowerCase()))];

                return genders
                  .filter(gender => gender in GENDER_COLORS)
                  .map(gender => {
                    const color = GENDER_COLORS[gender as keyof typeof GENDER_COLORS];

                    return {
                      text: this.translateGender(gender),
                      fillStyle: color.background,
                      strokeStyle: color.border,
                      lineWidth: 1,
                      fontColor: CHART_UNKNOWN_COLOR,
                    };
                  });
              },
            },
          },
          tooltip: {
            callbacks: {
              title: context => {
                const guest = nodes[context[0].dataIndex];
                return guest.label;
              },
              label: () => '',
              afterBody: context => {
                const guest = group.guests[context[0].dataIndex];
                return this.getNetworkTooltipLines(guest, nodes.length - 1);
              },
            },
          },
        },
      },
    });
  }

  // Creates connections between every guest in the same dates group.
  private getSameDatesEdges(
    nodes: {
      id: string;
      label: string;
      gender: string;
      groupType: string | null;
      groupId: string | null;
    }[]
  ): {
    source: number;
    target: number;
  }[] {
    const edges: {
      source: number;
      target: number;
    }[] = [];

    for (let source = 0; source < nodes.length; source++) {
      for (let target = source + 1; target < nodes.length; target++) {
        edges.push({
          source,
          target,
        });
      }
    }

    return edges;
  }

  private getGuestDisplayName(fullName: string, groupType: string | null): string {
    if (!groupType || groupType === 'solo') {
      return fullName;
    }

    const groupLabelKey = this.groupTypeKeys[groupType];

    if (!groupLabelKey) {
      return fullName;
    }

    return this.translate('STATS.STAYS.LABELS.GROUP_NAME', {
      name: fullName,
      group: this.translate(groupLabelKey),
    });
  }

  // Build tooltip information for stay charts.
  private getTooltipLines(item: IStaysDistribution['longest']['overall'][number], selectedView: ILongestView): string[] {
    const guest = item.guest;

    const lines = [
      this.translate('STATS.STAYS.LABELS.TOTAL_NIGHTS', {
        count: item.nights,
      }),
      this.translate('STATS.STAYS.LABELS.COUNTRY', {
        country: this._format.formatCountry(guest.hometownCode),
      }),
      this.translate('STATS.STAYS.LABELS.VISIT', {
        date: this._format.formatDate(guest.visitedDate),
      }),
    ];

    if (selectedView === 'overall') {
      lines.splice(
        1,
        0,
        this.translate('STATS.STAYS.LABELS.GROUP', {
          group: this.translateGroupType(guest.groupType),
        })
      );
    }

    return lines;
  }

  // Build tooltip information for network nodes.
  private getNetworkTooltipLines(guest: IStaysDistribution['sameDates'][number]['guests'][number], connections: number): string[] {
    return [
      this.translate('STATS.STAYS.LABELS.CONNECTIONS', {
        count: connections,
      }),
      this.translate('STATS.STAYS.LABELS.GROUP', {
        group: this.translateGroupType(guest.groupType),
      }),
      this.translate('STATS.STAYS.LABELS.COUNTRY', {
        country: this._format.formatCountry(guest.hometownCode),
      }),
      this.translate('STATS.STAYS.LABELS.VISIT', {
        date: this._format.formatDate(guest.visitedDate),
      }),
    ];
  }

  // Translate a group type, keeping the original value as fallback.
  private translateGroupType(groupType: string | null): string {
    if (!groupType) {
      return '';
    }

    const key = this.groupTypeKeys[groupType];

    return key ? this.translate(key) : groupType;
  }

  // Translate a gender, keeping the original value if no translation exists.
  private translateGender(gender: string): string {
    const key = `STATS.STAYS.GENDERS.${gender.toUpperCase()}`;
    const translated = this._translate.instant(key);

    return translated === key ? gender.charAt(0).toUpperCase() + gender.slice(1) : translated;
  }

  // Return a translated string using the current language.
  private translate(key: string, params?: Record<string, string | number>): string {
    const translated = this._translate.instant(key, params);

    // Keep a readable fallback if a translation key is missing.
    return translated === key ? (key.split('.').pop() ?? key) : translated;
  }

  // Destroy the current chart instance.
  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  private navigateToGuest(guestId: string, groupType?: string | null, groupId?: string | null): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }

  private navigateToPeopleTogether(guests: typeof this.stays.maxPeopleTogether.overall.guests): void {
    if (!guests.length) {
      return;
    }

    const dates = guests.map(guest => guest.visitedDate);
    const from = dates.reduce((earliest, date) => (date < earliest ? date : earliest));
    const to = dates.reduce((latest, date) => (date > latest ? date : latest));

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        from,
        to,
      },
    });
  }
}
