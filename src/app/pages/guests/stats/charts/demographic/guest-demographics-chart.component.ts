import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// Services
import { FormatService } from '@services/format.service';
import { LanguageService } from '@services/language.service';

// Interfaces
import { IDemographicsDistribution, IDemographicsView, IDemographicsTotalsView, IDemographicGender, IDemographicsOldestView } from '@interfaces/stats-interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';

// Helpers
import { CHART_NEUTRAL_COLOR, CHART_UNKNOWN_COLOR, GENDER_COLORS, getColorWithOpacity, getRankingColors, GROUP_COLORS, RANKING_COLORS } from '@utils';

// Libraries
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { enUS, es, de, zhCN, fr, it, pt, ru, ja } from 'date-fns/locale';
import type { Locale } from 'date-fns';

@Component({
  selector: 'guest-demographics-chart',
  templateUrl: './guest-demographics-chart.component.html',
  styleUrls: ['./guest-demographics-chart.component.css'],
})
export class GuestDemographicsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);
  private _translate = inject(TranslateService);
  private _language = inject(LanguageService);

  private langChangeSubscription?: Subscription;

  // Demographic data received from the parent component.
  @Input() demographics!: IDemographicsDistribution;

  // Reference to the canvas where Chart.js will render the chart.
  @ViewChild('demographicsChart')
  demographicsChart!: ElementRef<HTMLCanvasElement>;

  // Translated group labels used in chart tooltips.
  get groupLabels(): Record<string, string> {
    return {
      couple: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
      friends: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
      family: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
    };
  }

  // Currently selected main demographics view.
  selectedView: IDemographicsView = 'totals';

  // Available main views shown in the UI.
  readonly demographicsViews: IDemographicsView[] = ['totals', 'oldest', 'youngest', 'firstLast'];

  // Translation keys for the main views.
  readonly demographicsViewLabels: Record<IDemographicsView, string> = {
    totals: 'STATS.DEMOGRAPHICS.VIEWS.TOTALS',
    oldest: 'STATS.DEMOGRAPHICS.VIEWS.OLDEST',
    youngest: 'STATS.DEMOGRAPHICS.VIEWS.YOUNGEST',
    firstLast: 'STATS.DEMOGRAPHICS.VIEWS.FIRST_LAST',
  };

  // Gender colors.
  private readonly genderColors = {
    male: GENDER_COLORS.male,
    female: GENDER_COLORS.female,
    trans: GENDER_COLORS.trans,
    isGay: GENDER_COLORS.gay,
  };

  // Currently selected totals sub-view.
  selectedTotalsView: IDemographicsTotalsView = 'overall';

  // Available totals sub-views.
  readonly demographicTotalsViews: IDemographicsTotalsView[] = ['overall', 'groups'];

  // Currently selected age-based sub-view.
  selectedAgeView: IDemographicsOldestView = 'overall';

  // Available age-based sub-views.
  readonly demographicAgeViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  // Currently selected first/last sub-view.
  selectedFirstLastView: IDemographicsOldestView = 'overall';

  // Available first/last sub-views.
  readonly demographicFirstLastViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  // Stores the current Chart.js instance.
  private chart?: Chart;

  ngAfterViewInit(): void {
    // Create the chart once the canvas is available.
    if (this.demographics) {
      this.createChart();
    }

    // Recreate the chart when the language changes.
    this.langChangeSubscription = this._translate.onLangChange.subscribe(() => {
      this.chart?.destroy();
      this.chart = undefined;
      this.createChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart whenever new demographics data is received.
    if (changes['demographics'] && this.demographicsChart) {
      this.createChart();
    }
  }

  getSubViewLabel(view: string): string {
    return this._translate.instant(`STATS.DEMOGRAPHICS.SUBVIEWS.${view.toUpperCase()}`);
  }

  selectView(view: IDemographicsView): void {
    this.selectedView = view;

    this.chart?.destroy();
    this.chart = undefined;

    setTimeout(() => {
      this.createChart();
    });
  }

  selectTotalsView(view: IDemographicsTotalsView): void {
    this.selectedTotalsView = view;

    this.chart?.destroy();
    this.chart = undefined;

    setTimeout(() => {
      this.createChart();
    });
  }

  selectAgeView(view: IDemographicsOldestView): void {
    this.selectedAgeView = view;

    this.chart?.destroy();
    this.chart = undefined;

    setTimeout(() => {
      this.createChart();
    });
  }

  selectFirstLastView(view: IDemographicsOldestView): void {
    this.selectedFirstLastView = view;

    this.chart?.destroy();
    this.chart = undefined;

    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    // Do not create a chart without a canvas or demographic data.
    if (!this.demographicsChart || !this.demographics) {
      return;
    }

    this.chart?.destroy();

    // TOTALS
    if (this.selectedView === 'totals') {
      if (this.selectedTotalsView === 'overall') {
        this.chart = this.createOverallTotalsChart();
        return;
      }

      if (this.selectedTotalsView === 'groups') {
        this.chart = this.createGroupsChart();
        return;
      }
    }

    // OLDEST
    if (this.selectedView === 'oldest') {
      if (this.selectedAgeView === 'overall') {
        this.chart = this.createOverallOldestChart();
        return;
      }

      if (this.selectedAgeView === 'solo') {
        this.chart = this.createSoloOldestChart();
        return;
      }

      if (this.selectedAgeView === 'groups') {
        this.chart = this.createGroupsOldestChart();
        return;
      }
    }

    // YOUNGEST
    if (this.selectedView === 'youngest') {
      if (this.selectedAgeView === 'overall') {
        this.chart = this.createOverallYoungestChart();
        return;
      }

      if (this.selectedAgeView === 'solo') {
        this.chart = this.createSoloYoungestChart();
        return;
      }

      if (this.selectedAgeView === 'groups') {
        this.chart = this.createGroupsYoungestChart();
        return;
      }
    }

    // FIRST LAST
    if (this.selectedView === 'firstLast') {
      if (this.selectedFirstLastView === 'overall') {
        this.chart = this.createOverallFirstLastChart();
        return;
      }

      if (this.selectedFirstLastView === 'solo') {
        this.chart = this.createSoloFirstLastChart();
        return;
      }

      if (this.selectedFirstLastView === 'groups') {
        this.chart = this.createGroupsFirstLastChart();
        return;
      }
    }
  }

  // TOTALS - OVERALL
  private createOverallTotalsChart(): Chart {
    // Get the aggregated demographic data.
    const overall = this.demographics.totals.overall;

    const labels = [
      this._translate.instant('GENDER.MALE'),
      this._translate.instant('GENDER.FEMALE'),
      this._translate.instant('GENDER.TRANS'),
      this._translate.instant('GENDER.GAY'),
    ];

    return new Chart(this.demographicsChart.nativeElement, {
      // Doughnut chart is used to show the overall distribution.
      type: 'doughnut',
      data: {
        // Each label represents one demographic category.
        labels,
        datasets: [
          {
            label: this._translate.instant('GENDER.TXT'),

            // Values used to calculate each section of the doughnut.
            data: [overall.male, overall.female, overall.trans, overall.isGay],

            backgroundColor: [
              getColorWithOpacity(GENDER_COLORS.male),
              getColorWithOpacity(GENDER_COLORS.female),
              getColorWithOpacity(GENDER_COLORS.trans),
              getColorWithOpacity(GENDER_COLORS.gay),
            ],
            borderColor: [GENDER_COLORS.male.border, GENDER_COLORS.female.border, GENDER_COLORS.trans.border, GENDER_COLORS.gay.border],

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
          const label = ['Male', 'Female', 'Trans', 'Gay'][index];

          this.navigateToGenderGuests(label);
        },
        plugins: {
          // Place the legend below the chart.
          legend: {
            position: 'top',
          },
        },
      },
    });
  }

  // TOTALS - GROUPS
  private createGroupsChart(): Chart {
    // Get demographic data separated by travel group.
    const groups = this.demographics.totals.groups;

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        // Each bar represents a travel group.
        labels: [
          this._translate.instant('STATS.DEMOGRAPHICS.SUBVIEWS.SOLO'),
          this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
          this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
          this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
        ],
        datasets: [
          {
            label: this._translate.instant('GENDER.MALE'),
            data: [groups.solo.male, groups.couple.male, groups.friends.male, groups.family.male],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.male),
            borderColor: GENDER_COLORS.male.border,
            borderWidth: 1,
          },
          {
            label: this._translate.instant('GENDER.FEMALE'),
            data: [groups.solo.female, groups.couple.female, groups.friends.female, groups.family.female],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.female),
            borderColor: GENDER_COLORS.female.border,
            borderWidth: 1,
          },
          {
            label: this._translate.instant('GENDER.TRANS'),
            data: [groups.solo.trans, groups.couple.trans, groups.friends.trans, groups.family.trans],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.trans),
            borderColor: GENDER_COLORS.trans.border,
            borderWidth: 1,
          },
          {
            label: this._translate.instant('GENDER.GAY'),
            data: [groups.solo.isGay, groups.couple.isGay, groups.friends.isGay, groups.family.isGay],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.gay),
            borderColor: GENDER_COLORS.gay.border,
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

          const datasetIndex = elements[0].datasetIndex;
          const groupIndex = elements[0].index;

          // Keep the original values for navigation and filtering.
          const genderLabels = ['Male', 'Female', 'Trans', 'Gay'];
          const groupLabels = ['Solo', 'Couple', 'Friends', 'Family'];

          const gender = genderLabels[datasetIndex];
          const groupType = this.groupNavigation[groupLabels[groupIndex]];

          const genderFilters = this.genderNavigation[gender];

          if (!genderFilters || !groupType) {
            return;
          }

          this._router.navigate(['/guests'], {
            queryParams: {
              view: 'cards',
              ...genderFilters,
              groupType,
            },
          });
        },

        // Use horizontal bars instead of vertical bars.
        indexAxis: 'y',
        scales: {
          x: {
            // Stack demographic categories within each group.
            stacked: true,
            beginAtZero: true,
          },
          y: {
            // Stack the datasets on the same horizontal bar.
            stacked: true,
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
        },
      },
    });
  }

  // OLDEST - OVERALL
  private createOverallOldestChart(): Chart {
    // Get people belonging to the overall demographic group.
    const people = this.demographics.oldest.overall.people;

    // Only people with a registered birth date can have their age calculated.
    // Convert each person containing name, age, gender and country.
    const oldestPeople = people
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        gender: person.gender,
        visitedDate: person.visitedDate,
        country: person.hometownCode,
      }))
      // Sort from oldest to youngest.
      .sort((a, b) => b.age - a.age);

    // Get ranking colors based on the sorted ages.
    const colors = getRankingColors(oldestPeople.map(person => person.age));

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        // Each person becomes a label on the Y axis.
        labels: oldestPeople.map(person => person.name),
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            // Each bar represents the person's calculated age.
            data: oldestPeople.map(person => person.age),
            // Apply ranking colors.
            backgroundColor: colors.background,
            borderColor: colors.border,
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
          const person = oldestPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        // Display horizontal bars.
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            // Identify the X axis as age.
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },
          y: {
            // The data is already sorted from oldest to youngest.
            reverse: false,
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              // Generate fixed labels to identify the ranking colors.
              generateLabels: () => [
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.OLDEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.gold),
                  strokeStyle: RANKING_COLORS.gold.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.SECOND_OLDEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.silver),
                  strokeStyle: RANKING_COLORS.silver.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.THIRD_OLDEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.bronze),
                  strokeStyle: RANKING_COLORS.bronze.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.OTHER'),
                  fillStyle: RANKING_COLORS.neutral.background,
                  strokeStyle: RANKING_COLORS.neutral.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
              ],
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const person = oldestPeople[context.dataIndex];
                const genderLabel = this._format.formatGender(person.gender);

                return [
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`,
                  `${this._translate.instant('GENDER.TXT')}: ${genderLabel}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();

    // Start with the difference between the current year and birth year.
    let age = today.getFullYear() - birth.getFullYear();

    // Check whether the birthday has already happened this year.
    const hasHadBirthday = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

    // If the birthday has not happened yet, subtract one year.
    if (!hasHadBirthday) {
      age--;
    }

    return age;
  }

  // OLDEST - SOLO
  private createSoloOldestChart(): Chart {
    const people = [
      ...this.demographics.oldest.solo.male.map(person => ({
        ...person,
        demographic: 'male' as const,
      })),
      ...this.demographics.oldest.solo.female.map(person => ({
        ...person,
        demographic: 'female' as const,
      })),
      ...this.demographics.oldest.solo.trans.map(person => ({
        ...person,
        demographic: 'trans' as const,
      })),
      ...this.demographics.oldest.solo.isGay.map(person => ({
        ...person,
        demographic: 'isGay' as const,
      })),
    ];

    const priorityPeople = new Map<string, (typeof people)[number]>();

    for (const person of people) {
      const existing = priorityPeople.get(person.guestId);

      if (!existing) {
        priorityPeople.set(person.guestId, person);
        continue;
      }

      if (person.demographic === 'isGay') {
        priorityPeople.set(person.guestId, person);
        continue;
      }

      if (person.demographic === 'trans' && existing.demographic !== 'isGay') {
        priorityPeople.set(person.guestId, person);
      }
    }

    const oldestPeople = Array.from(priorityPeople.values())
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        visitedDate: new Date(person.visitedDate),
        visitedDateLabel: person.visitedDate,
        gender: person.gender,
        demographic: person.demographic,
        country: person.hometownCode,
      }));

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.OLDEST'),
            data: oldestPeople.map(person => ({
              x: person.visitedDate,
              y: person.age,
            })),
            backgroundColor: oldestPeople.map(person => {
              if (person.demographic === 'isGay') {
                return this.genderColors.isGay.background;
              }

              if (person.demographic === 'trans') {
                return this.genderColors.trans.background;
              }

              return this.genderColors[person.gender].background;
            }),
            borderColor: oldestPeople.map(person => {
              if (person.demographic === 'isGay') {
                return this.genderColors.isGay.border;
              }

              if (person.demographic === 'trans') {
                return this.genderColors.trans.border;
              }

              return this.genderColors[person.gender].border;
            }),
            pointRadius: 6,
            pointHoverRadius: 8,
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
          const person = oldestPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: this._language.dateFnsLocale,
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISITED_DATE'),
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (oldestPeople.some(person => person.demographic === 'male')) {
                  labels.push({
                    text: this._translate.instant('GENDER.MALE'),
                    fillStyle: this.genderColors.male.background,
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: this._translate.instant('GENDER.FEMALE'),
                    fillStyle: this.genderColors.female.background,
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: this._translate.instant('GENDER.GAY'),
                    fillStyle: this.genderColors.isGay.background,
                    strokeStyle: this.genderColors.isGay.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: this._translate.instant('GENDER.TRANS'),
                    fillStyle: this.genderColors.trans.background,
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const person = oldestPeople[context.dataIndex];

                const tooltip = [person.name, `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`];

                if (person.demographic === 'isGay' || person.demographic === 'trans') {
                  const genderLabel = this._format.formatGender(person.gender);

                  tooltip.push(`${this._translate.instant('GENDER.TXT')}: ${genderLabel}`);
                }

                tooltip.push(
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDateLabel)}`
                );

                return tooltip;
              },
            },
          },
        },
      },
    });
  }

  // OLDEST - GROUPS
  private createGroupsOldestChart(): Chart {
    // Get all guests from couple, friends and family groups.
    const people = [
      ...this.demographics.oldest.couple.map(person => ({
        ...person,
        group: 'Couple' as const,
        demographic: person.gender,
      })),

      ...this.demographics.oldest.friends.map(person => ({
        ...person,
        group: 'Friends' as const,
        demographic: person.gender,
      })),

      ...this.demographics.oldest.family.map(person => ({
        ...person,
        group: 'Family' as const,
        demographic: person.gender,
      })),
    ];

    // Prepare the data required by the bubble chart.
    const groupsPeople = people
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        group: person.group,
        gender: person.gender,
        demographic: person.demographic,
        groupId: person.groupId,
        country: person.hometownCode,
        visitedDate: person.visitedDate,
      }));

    // Map each group to a numeric value for the Y axis.
    const groupPositions: Record<string, number> = {
      Couple: 1,
      Friends: 2,
      Family: 3,
    };

    const chart = new Chart(this.demographicsChart.nativeElement, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.GROUPS'),
            // Each bubble represents one guest.
            data: groupsPeople.map(person => ({
              x: person.age,
              y: groupPositions[person.group],
              r: 20,
            })),

            // Apply the color according to the guest's demographic.
            backgroundColor: groupsPeople.map(person => getColorWithOpacity(GROUP_COLORS[person.group])),
            borderColor: groupsPeople.map(person => GROUP_COLORS[person.group].border),
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
          const person = groupsPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        scales: {
          // X axis represents the guest's age.
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },

          // Y axis represents the type of group.
          y: {
            min: 0.5,
            max: 3.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                const labels: Record<number, string> = {
                  1: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
                  2: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
                  3: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
                };

                return labels[value as number];
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.GROUP'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#f9eaf0',
              generateLabels: () => {
                const labels = [];

                if (groupsPeople.some(person => person.group === 'Couple')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Couple),
                    strokeStyle: GROUP_COLORS.Couple.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Friends),
                    strokeStyle: GROUP_COLORS.Friends.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Family),
                    strokeStyle: GROUP_COLORS.Family.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },

          // Show guest information when hovering over a bubble.
          tooltip: {
            callbacks: {
              label: context => {
                const person = groupsPeople[context.dataIndex];

                return [
                  person.name,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`,
                  `${this._translate.instant('GENDER.TXT')}: ${this._format.formatGender(person.gender)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
    return chart;
  }

  // YOUNGEST - OVERALL
  private createOverallYoungestChart(): Chart {
    // Get people belonging to the overall demographic group.
    const people = this.demographics.youngest.overall.people;

    // Prepare the data required by Chart.js.
    const youngestPeople = people
      // Only people with a registered birth date can have their age calculated.
      .filter(person => person.birthDate)
      // Convert each person object containing name, gender and country.
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        gender: person.gender,
        visitedDate: person.visitedDate,
        country: person.hometownCode,
      }))
      // Sort from youngest to oldest.
      .sort((a, b) => a.age - b.age);

    // Get ranking colors based on the sorted ages.
    const colors = getRankingColors(youngestPeople.map(person => person.age));

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        // Each person becomes a label on the Y axis.
        labels: youngestPeople.map(person => person.name),
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            // Each bar represents the person's calculated age.
            data: youngestPeople.map(person => person.age),
            // Apply ranking colors.
            backgroundColor: colors.background,
            borderColor: colors.border,
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
          const person = youngestPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        // Display horizontal bars.
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            // Identify the X axis as age.
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },

          // Youngest person appears first.
          y: {
            reverse: false,
          },
        },
        plugins: {
          // Person names on the Y axis already identify the data.
          legend: {
            display: true,
            labels: {
              // Generate fixed labels to identify the ranking colors.
              generateLabels: () => [
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.YOUNGEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.gold),
                  strokeStyle: RANKING_COLORS.gold.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.SECOND_YOUNGEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.silver),
                  strokeStyle: RANKING_COLORS.silver.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: this._translate.instant('STATS.DEMOGRAPHICS.RANKING.THIRD_YOUNGEST'),
                  fillStyle: getColorWithOpacity(RANKING_COLORS.bronze),
                  strokeStyle: RANKING_COLORS.bronze.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
              ],
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const person = youngestPeople[context.dataIndex];

                return [
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`,
                  `${this._translate.instant('GENDER.TXT')}: ${this._format.formatGender(person.gender)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  private createSoloYoungestChart(): Chart {
    // Get all solo guests from each gender category.
    const people = [
      ...this.demographics.youngest.solo.male.map(person => ({
        ...person,
        demographic: 'male' as const,
      })),

      ...this.demographics.youngest.solo.female.map(person => ({
        ...person,
        demographic: 'female' as const,
      })),

      ...this.demographics.youngest.solo.trans.map(person => ({
        ...person,
        demographic: 'trans' as const,
      })),

      ...this.demographics.youngest.solo.isGay.map(person => ({
        ...person,
        demographic: 'isGay' as const,
      })),
    ];

    // Prepare the data required by the scatter plot.
    const soloPeople = people
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        visitedDate: new Date(person.visitedDate),
        visitedDateLabel: person.visitedDate,
        gender: person.gender,
        demographic: person.demographic,
        country: person.hometownCode,
      }));

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS'),
            data: soloPeople.map(person => ({
              x: person.visitedDate,
              y: person.age,
            })),
            backgroundColor: soloPeople.map(person => this.genderColors[person.demographic].background),
            borderColor: soloPeople.map(person => this.genderColors[person.demographic].border),
            pointRadius: 5,
            pointHoverRadius: 7,
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
          const person = soloPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        scales: {
          // X axis represents the guest's visit date.
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: this._language.dateFnsLocale,
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE'),
            },
          },

          // Y axis represents the guest's age.
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (soloPeople.some(person => person.demographic === 'male')) {
                  labels.push({
                    text: this._translate.instant('GENDER.MALE'),
                    fillStyle: getColorWithOpacity(this.genderColors.male),
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: this._translate.instant('GENDER.FEMALE'),
                    fillStyle: getColorWithOpacity(this.genderColors.female),
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: this._translate.instant('GENDER.TRANS'),
                    fillStyle: getColorWithOpacity(this.genderColors.trans),
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: this._translate.instant('GENDER.GAY'),
                    fillStyle: getColorWithOpacity(this.genderColors.isGay),
                    strokeStyle: this.genderColors.isGay.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const person = soloPeople[context.dataIndex];

                return [
                  person.name,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDateLabel)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  private createGroupsYoungestChart(): Chart {
    // Get all guests from couple, friends and family groups.
    const people = [
      ...this.demographics.youngest.couple.map(person => ({
        ...person,
        group: 'Couple' as const,
        demographic: person.gender,
      })),

      ...this.demographics.youngest.friends.map(person => ({
        ...person,
        group: 'Friends' as const,
        demographic: person.gender,
      })),

      ...this.demographics.youngest.family.map(person => ({
        ...person,
        group: 'Family' as const,
        demographic: person.gender,
      })),
    ];

    // Prepare the data required by the bubble chart.
    const groupsPeople = people
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
        guestId: person.guestId,
        age: this.calculateAge(person.birthDate!),
        group: person.group,
        gender: person.gender,
        demographic: person.demographic,
        groupId: person.groupId,
        country: person.hometownCode,
        visitedDate: person.visitedDate,
      }));

    // Map each group to a numeric value for the Y axis.
    const groupPositions: Record<string, number> = {
      Couple: 1,
      Friends: 2,
      Family: 3,
    };

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.GROUPS'),
            // Each bubble represents one guest.
            data: groupsPeople.map(person => ({
              x: person.age,
              y: groupPositions[person.group],
              r: 20,
            })),
            // Apply the color according to the group.
            backgroundColor: groupsPeople.map(person => getColorWithOpacity(GROUP_COLORS[person.group])),
            borderColor: groupsPeople.map(person => GROUP_COLORS[person.group].border),
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
          const person = groupsPeople[index];

          if (!person) {
            return;
          }

          this.navigateToGuest(person.guestId);
        },
        scales: {
          // X axis represents the guest's age.
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE'),
            },
          },

          // Y axis represents the type of group.
          y: {
            min: 0.5,
            max: 3.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                const labels: Record<number, string> = {
                  1: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
                  2: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
                  3: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
                };

                return labels[value as number];
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.GROUP'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (groupsPeople.some(person => person.group === 'Couple')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Couple),
                    strokeStyle: GROUP_COLORS.Couple.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Friends),
                    strokeStyle: GROUP_COLORS.Friends.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Family),
                    strokeStyle: GROUP_COLORS.Family.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },

          // Show guest information when hovering over a bubble.
          tooltip: {
            callbacks: {
              label: context => {
                const person = groupsPeople[context.dataIndex];

                return [
                  person.name,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.AGE')}: ${person.age}`,
                  `${this._translate.instant('GENDER.TXT')}: ${this._format.formatGender(person.gender)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.country)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // FIRST LAST - OVERALL
  private createOverallFirstLastChart(): Chart {
    // Get the first and last guest overall.
    const overall = this.demographics.firstLast.overall.people;
    const first = overall.first;
    const last = overall.last;

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.OVERALL_DEMOGRAPHICS'),
            data: [
              ...(first
                ? [
                    {
                      x: new Date(first.visitedDate),
                      y: 1,
                      type: 'First',
                      person: first,
                    },
                  ]
                : []),
              ...(last
                ? [
                    {
                      x: new Date(last.visitedDate),
                      y: 1,
                      type: 'Last',
                      person: last,
                    },
                  ]
                : []),
            ],
            // Connect First and Last.
            showLine: true,
            borderColor: CHART_NEUTRAL_COLOR,
            borderWidth: 2,
            pointBackgroundColor: [first ? this.genderColors[first.gender].background : undefined, last ? this.genderColors[last.gender].background : undefined],
            pointBorderColor: [first ? this.genderColors[first.gender].border : undefined, last ? this.genderColors[last.gender].border : undefined],
            pointRadius: 8,
            pointHoverRadius: 11,
          },
        ],
      },
      options: {
        responsive: true,
        onClick: (_, elements) => {
          const element = elements[0];

          if (!element) return;

          const data = this.chart?.data.datasets[element.datasetIndex].data[element.index] as any;
          this.navigateToGuest(data.person.guestId, data.person.groupType, data.person.groupId);
        },
        scales: {
          // X axis represents the visit date.
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: this._language.dateFnsLocale,
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE'),
            },
          },

          // Only one category is displayed.
          y: {
            min: 0.5,
            max: 1.5,
            ticks: {
              stepSize: 1,
              callback: () => this._translate.instant('STATS.DEMOGRAPHICS.LABELS.OVERALL_DEMOGRAPHICS'),
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              generateLabels: () => {
                const labels: {
                  text: string;
                  fillStyle: string;
                  strokeStyle: string;
                  lineWidth: number;
                  fontColor: string;
                }[] = [];

                const genders = [
                  {
                    key: 'male' as const,
                    text: this._translate.instant('GENDER.MALE'),
                    color: this.genderColors.male,
                  },
                  {
                    key: 'female' as const,
                    text: this._translate.instant('GENDER.FEMALE'),
                    color: this.genderColors.female,
                  },
                  {
                    key: 'trans' as const,
                    text: this._translate.instant('GENDER.TRANS'),
                    color: this.genderColors.trans,
                  },
                  {
                    key: 'isGay' as const,
                    text: this._translate.instant('GENDER.GAY'),
                    color: this.genderColors.isGay,
                  },
                ];

                genders.forEach(gender => {
                  if (first?.gender === gender.key || last?.gender === gender.key) {
                    labels.push({
                      text: gender.text,
                      fillStyle: getColorWithOpacity(gender.color),
                      strokeStyle: gender.color.border,
                      lineWidth: 1,
                      fontColor: CHART_UNKNOWN_COLOR,
                    });
                  }
                });

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const point = context.raw as {
                  type: 'First' | 'Last';
                  person: {
                    fullName: string;
                    guestId: string;
                    visitedDate: string;
                    groupType: string;
                    gender: IDemographicGender;
                    hometownCode: string;
                  };
                };

                const groupLabel = point.person.groupType === 'solo' ? '' : ` and ${this.groupLabels[point.person.groupType]}`;
                const firstLastLabel = this._translate.instant(point.type === 'First' ? 'STATS.DEMOGRAPHICS.RANKING.FIRST' : 'STATS.DEMOGRAPHICS.RANKING.LAST');
                const genderLabel = this._format.formatGender(point.person.gender);

                return [
                  `${firstLastLabel}: ${point.person.fullName}${groupLabel}`,
                  this._translate.instant('GENDER.LABEL', { gender: genderLabel }),
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(point.person.hometownCode)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(point.person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // FIRST LAST - SOLO
  private createSoloFirstLastChart(): Chart {
    // Get first and last guests for each solo demographic.
    const solo = this.demographics.firstLast.solo;

    const categories = [
      {
        key: 'Solo Female',
        label: `${this._translate.instant('GENDER.FEMALE')} (${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        first: solo.female.first,
        last: solo.female.last,
        color: this.genderColors.female,
      },
      {
        key: 'Solo Male',
        label: `${this._translate.instant('GENDER.MALE')} (${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        first: solo.male.first,
        last: solo.male.last,
        color: this.genderColors.male,
      },
      {
        key: 'Solo Trans',
        label: `${this._translate.instant('GENDER.TRANS')} (${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        first: solo.trans.first,
        last: solo.trans.last,
        color: this.genderColors.trans,
      },
      {
        key: 'Solo Gay',
        label: `${this._translate.instant('GENDER.GAY')} (${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.SOLO_GUESTS')})`,
        first: solo.isGay.first,
        last: solo.isGay.last,
        color: this.genderColors.isGay,
      },
    ];

    const validCategories = categories.filter(category => category.first || category.last);
    const chartCategories = validCategories.filter(category => category.first && category.last);

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: chartCategories.map((category, index) => ({
          label: category.label,
          data: [
            {
              x: new Date(category.first!.visitedDate),
              y: index + 1,
              person: category.first,
            },
            {
              x: new Date(category.last!.visitedDate),
              y: index + 1,
              person: category.last,
            },
          ],
          showLine: true,
          backgroundColor: category.color.background,
          borderColor: category.color.border,
          borderWidth: 2,
          pointRadius: 7,
          pointHoverRadius: 10,
        })),
      },
      options: {
        responsive: true,

        onClick: (_event, elements) => {
          if (!elements.length) {
            return;
          }

          const point = elements[0];
          const data = this.chart?.data.datasets[point.datasetIndex].data[point.index] as any;

          if (!data?.person?.guestId) {
            return;
          }

          this.navigateToGuest(data.person.guestId);
        },
        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: this._language.dateFnsLocale,
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE'),
            },
          },
          y: {
            min: 0.5,
            max: chartCategories.length + 0.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                return chartCategories[(value as number) - 1]?.label ?? '';
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.CATEGORY'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (validCategories.some(category => category.key === 'Solo Female')) {
                  labels.push({
                    text: this._translate.instant('GENDER.FEMALE'),
                    fillStyle: getColorWithOpacity(this.genderColors.female),
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.key === 'Solo Male')) {
                  labels.push({
                    text: this._translate.instant('GENDER.MALE'),
                    fillStyle: getColorWithOpacity(this.genderColors.male),
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.key === 'Solo Trans')) {
                  labels.push({
                    text: this._translate.instant('GENDER.TRANS'),
                    fillStyle: getColorWithOpacity(this.genderColors.trans),
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.key === 'Solo Gay')) {
                  labels.push({
                    text: this._translate.instant('GENDER.GAY'),
                    fillStyle: getColorWithOpacity(this.genderColors.isGay),
                    strokeStyle: this.genderColors.isGay.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const category = chartCategories[context.datasetIndex];
                const person = context.dataIndex === 0 ? category.first : category.last;

                if (!person) {
                  return '';
                }

                const firstLastLabel = this._translate.instant(context.dataIndex === 0 ? 'STATS.DEMOGRAPHICS.RANKING.FIRST' : 'STATS.DEMOGRAPHICS.RANKING.LAST');

                return [
                  `${firstLastLabel}: ${person.fullName}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.CATEGORY')}: ${category.label}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.hometownCode)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  // FIRST LAST - GROUPS
  private createGroupsFirstLastChart(): Chart {
    // Get first and last guests for each travel group.
    const firstLast = this.demographics.firstLast;

    const categories = [
      {
        key: 'Couple',
        label: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.COUPLE'),
        first: firstLast.couple.first,
        last: firstLast.couple.last,
        color: GROUP_COLORS.Couple,
      },
      {
        key: 'Friends',
        label: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FRIENDS'),
        first: firstLast.friends.first,
        last: firstLast.friends.last,
        color: GROUP_COLORS.Friends,
      },
      {
        key: 'Family',
        label: this._translate.instant('STATS.DEMOGRAPHICS.GROUPS.FAMILY'),
        first: firstLast.family.first,
        last: firstLast.family.last,
        color: GROUP_COLORS.Family,
      },
    ];

    const chartCategories = categories.filter(category => category.first && category.last);

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: chartCategories.map((category, index) => ({
          label: category.label,
          data: [
            {
              x: new Date(category.first!.visitedDate),
              y: index + 1,
              person: category.first,
            },
            {
              x: new Date(category.last!.visitedDate),
              y: index + 1,
              person: category.last,
            },
          ],
          showLine: true,
          backgroundColor: category.color.background,
          borderColor: category.color.border,
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 11,
        })),
      },
      options: {
        responsive: true,
        onClick: (_, elements) => {
          const element = elements[0];

          if (!element) return;

          const data = this.chart?.data.datasets[element.datasetIndex].data[element.index] as any;
          this.navigateToGuest(data.person.guestId, data.person.groupType, data.person.groupId);
        },

        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: this._language.dateFnsLocale,
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT_DATE'),
            },
          },
          y: {
            min: 0.5,
            max: chartCategories.length + 0.5,

            ticks: {
              stepSize: 1,
              callback: value => {
                return chartCategories[(value as number) - 1]?.label ?? '';
              },
            },
            title: {
              display: true,
              text: this._translate.instant('STATS.DEMOGRAPHICS.LABELS.GROUP'),
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels: {
                  text: string;
                  fillStyle: string;
                  strokeStyle: string;
                  lineWidth: number;
                  fontColor: string;
                }[] = [];

                categories.forEach(category => {
                  if (category.first || category.last) {
                    labels.push({
                      text: category.label,
                      fillStyle: category.color.background,
                      strokeStyle: category.color.border,
                      lineWidth: 1,
                      fontColor: CHART_UNKNOWN_COLOR,
                    });
                  }
                });

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const category = chartCategories[context.datasetIndex];
                const person = context.dataIndex === 0 ? category.first : category.last;
                if (!person) return '';

                const firstLastLabel = this._translate.instant(context.dataIndex === 0 ? 'STATS.DEMOGRAPHICS.RANKING.FIRST' : 'STATS.DEMOGRAPHICS.RANKING.LAST');
                const groupLabel = person.groupType === 'solo' ? '' : ` and ${this.groupLabels[person.groupType]}`;
                const genderLabel = this._format.formatGender(person.gender);

                return [
                  `${firstLastLabel}: ${person.fullName} ${groupLabel}`,
                  `${this._translate.instant('GENDER.TXT')}: ${genderLabel}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.COUNTRY')}: ${this._format.formatCountry(person.hometownCode)}`,
                  `${this._translate.instant('STATS.DEMOGRAPHICS.LABELS.VISIT')}: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    // Destroy the Chart.js instance when the component is removed to prevent memory leaks and duplicated charts.
    this.langChangeSubscription?.unsubscribe();
    this.chart?.destroy();
  }

  // Click on chart
  private readonly genderNavigation: Record<string, Partial<IQueryParamsGuests>> = {
    Female: { gender: 'female' },
    Male: { gender: 'male' },
    Gay: { gay: true },
    Trans: { gender: 'trans' },
  };

  private readonly groupNavigation: Record<string, IQueryParamsGuests['groupType']> = {
    Solo: 'solo',
    Couple: 'couple',
    Friends: 'friends',
    Family: 'family',
  };

  private navigateToGenderGuests(label: string): void {
    const filters = this.genderNavigation[label];

    if (!filters) {
      return;
    }

    this._router.navigate(['/guests'], {
      queryParams: {
        view: 'cards',
        ...filters,
      },
    });
  }

  private navigateToGuest(guestId: string, groupType?: string, groupId?: string): void {
    if (groupType !== 'solo' && groupId) {
      this._router.navigate(['/guests/groups', groupId]);
      return;
    }

    this._router.navigate(['/guests', guestId]);
  }

  private getGenderTranslationKey(gender: IDemographicGender): string {
    const genderKeys: Record<IDemographicGender, string> = {
      male: 'MALE',
      female: 'FEMALE',
      trans: 'TRANS',
      isGay: 'GAY',
    };

    return genderKeys[gender];
  }
}
