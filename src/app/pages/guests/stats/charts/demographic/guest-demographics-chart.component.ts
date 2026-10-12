import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

// Interfaces
import { IDemographicsDistribution, IDemographicsView, IDemographicsTotalsView, IDemographicGender, IDemographicsOldestView } from '@interfaces/stats-interface';
import { IQueryParamsGuests } from '@interfaces/guests.interface';

// Helpers
import { CHART_NEUTRAL_COLOR, CHART_UNKNOWN_COLOR, GENDER_COLORS, getColorWithOpacity, getRankingColors, GROUP_COLORS, RANKING_COLORS } from '@utils';

// Services
import { FormatService } from '@services/format.service';

@Component({
  selector: 'guest-demographics-chart',
  templateUrl: './guest-demographics-chart.component.html',
  styleUrls: ['./guest-demographics-chart.component.css'],
})
export class GuestDemographicsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private _format = inject(FormatService);
  private _router = inject(Router);

  // Demographic data received from the parent component.
  @Input() demographics!: IDemographicsDistribution;

  // Reference to the canvas where Chart.js will render the chart.
  @ViewChild('demographicsChart')
  demographicsChart!: ElementRef<HTMLCanvasElement>;

  groupLabels: Record<string, string> = {
    couple: 'Couple',
    friends: 'Friend',
    family: 'Family',
  };

  // Currently selected main demographics view.
  selectedView: IDemographicsView = 'totals';
  // Available main views shown in the UI.
  readonly demographicsViews: IDemographicsView[] = ['totals', 'oldest', 'youngest', 'firstLast'];

  readonly demographicsViewLabels: Record<IDemographicsView, string> = {
    totals: 'Totals',
    oldest: 'Oldest',
    youngest: 'Youngest',
    firstLast: 'First - Last',
  };

  // References color
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

  // Currently selected group for the oldest view.
  selectedAgeView: IDemographicsOldestView = 'overall';
  // Available groups for the oldest view.
  readonly demographicAgeViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  // Currently selected first/last view.
  selectedFirstLastView: IDemographicsOldestView = 'overall';

  // Available first/last views.
  readonly demographicFirstLastViews: IDemographicsOldestView[] = ['overall', 'solo', 'groups'];

  // Stores the current Chart.js instance so it can be destroyed or replaced.
  private chart?: Chart;

  ngAfterViewInit(): void {
    // The canvas must exist before Chart.js can create the chart.
    if (this.demographics) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recreate the chart whenever new demographics data is received.
    if (changes['demographics'] && this.demographicsChart) {
      this.createChart();
    }
  }

  selectView(view: IDemographicsView): void {
    // Update the selected main view.
    this.selectedView = view;

    // Remove the previous Chart.js instance before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the template/canvas before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  selectTotalsView(view: IDemographicsTotalsView): void {
    // Update the selected totals sub-view.
    this.selectedTotalsView = view;

    // Remove the previous chart instance.
    this.chart?.destroy();
    this.chart = undefined;

    // Create the chart for the selected totals view.
    setTimeout(() => {
      this.createChart();
    });
  }

  selectAgeView(view: IDemographicsOldestView): void {
    // Update the selected age-based sub-view.
    this.selectedAgeView = view;

    // Remove the previous chart instance.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the template before creating the new chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // FIRST LAST
  selectFirstLastView(view: IDemographicsOldestView): void {
    // Update the selected first/last view.
    this.selectedFirstLastView = view;

    // Remove the previous chart instance.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the template before creating the new chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  private createChart(): void {
    // Do not try to create a chart if the canvas or data is not available.
    if (!this.demographicsChart || !this.demographics) {
      return;
    }

    // Make sure an existing Chart.js instance is removed first.
    this.chart?.destroy();

    // TOTALS
    if (this.selectedView === 'totals') {
      // Display the overall gender distribution.
      if (this.selectedTotalsView === 'overall') {
        this.chart = this.createOverallTotalsChart();
        return;
      }

      // Display gender distribution separated by travel group.
      if (this.selectedTotalsView === 'groups') {
        this.chart = this.createGroupsChart();
        return;
      }
    }

    // OLDEST
    if (this.selectedView === 'oldest') {
      // Display the oldest guests overall.
      if (this.selectedAgeView === 'overall') {
        this.chart = this.createOverallOldestChart();
        return;
      }

      // Display solo oldest guests.
      if (this.selectedAgeView === 'solo') {
        this.chart = this.createSoloOldestChart();
        return;
      }

      // Display oldest guests from couple, friends and family groups.
      if (this.selectedAgeView === 'groups') {
        this.chart = this.createGroupsOldestChart();
        return;
      }
    }

    // YOUNGEST
    if (this.selectedView === 'youngest') {
      // Display the youngest guests overall.
      if (this.selectedAgeView === 'overall') {
        this.chart = this.createOverallYoungestChart();
        return;
      }

      // Display solo youngest guests.
      if (this.selectedAgeView === 'solo') {
        this.chart = this.createSoloYoungestChart();
        return;
      }

      // Display youngest guests from couple, friends and family groups.
      if (this.selectedAgeView === 'groups') {
        this.chart = this.createGroupsYoungestChart();
        return;
      }
    }

    // FIRST LAST
    if (this.selectedView === 'firstLast') {
      // Display first and last guests overall.
      if (this.selectedFirstLastView === 'overall') {
        this.chart = this.createOverallFirstLastChart();
        return;
      }

      // Display first and last guests for solo guests by gender.
      if (this.selectedFirstLastView === 'solo') {
        this.chart = this.createSoloFirstLastChart();
        return;
      }

      // Display first and last guests for couple, friends and family groups.
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
    const labels = ['Male', 'Female', 'Trans', 'Gay'];
    return new Chart(this.demographicsChart.nativeElement, {
      // Doughnut chart is used to show the overall distribution.
      type: 'doughnut',
      data: {
        // Each label represents one demographic category.
        labels,
        datasets: [
          {
            label: 'Overall Demographics',
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
          const label = labels[index];

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
        labels: ['Solo', 'Couple', 'Friends', 'Family'],
        datasets: [
          {
            label: 'Male',
            data: [groups.solo.male, groups.couple.male, groups.friends.male, groups.family.male],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.male),
            borderColor: GENDER_COLORS.male.border,
            borderWidth: 1,
          },

          {
            label: 'Female',
            data: [groups.solo.female, groups.couple.female, groups.friends.female, groups.family.female],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.female),
            borderColor: GENDER_COLORS.female.border,
            borderWidth: 1,
          },
          {
            label: 'Trans',
            data: [groups.solo.trans, groups.couple.trans, groups.friends.trans, groups.family.trans],
            backgroundColor: getColorWithOpacity(GENDER_COLORS.trans),
            borderColor: GENDER_COLORS.trans.border,
            borderWidth: 1,
          },
          {
            label: 'gay',
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

      // Sort from oldest to youngest
      .sort((a, b) => b.age - a.age);
    //  Get ranking colors based on the sorted ages.
    const colors = getRankingColors(oldestPeople.map(person => person.age));
    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        // Each person becomes a label on the Y axis.
        labels: oldestPeople.map(person => person.name),
        datasets: [
          {
            label: 'Age',
            // Each bar represents the person's calculated age.
            data: oldestPeople.map(person => person.age),
            //  Apply ranking colors
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
              text: 'Age',
            },
          },
          y: {
            //  The data is already sorted from oldest to youngest, so the axis does not need to be reversed.
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
                  text: 'Oldest',
                  fillStyle: getColorWithOpacity(RANKING_COLORS.gold),
                  strokeStyle: RANKING_COLORS.gold.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: 'Second oldest',
                  fillStyle: getColorWithOpacity(RANKING_COLORS.silver),
                  strokeStyle: RANKING_COLORS.silver.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: 'Third oldest',
                  fillStyle: getColorWithOpacity(RANKING_COLORS.bronze),
                  strokeStyle: RANKING_COLORS.bronze.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: 'Other',
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
                return [
                  `Age: ${person.age}`,
                  `Gender: ${person.gender}`,
                  `Country: ${this._format.formatCountry(person.country)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
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
            label: 'Oldest',
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
            title: {
              display: true,
              text: 'Visited Date',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Age',
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
                    text: 'Male',
                    fillStyle: this.genderColors.male.background,
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: this.genderColors.female.background,
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: this.genderColors.isGay.background,
                    strokeStyle: this.genderColors.isGay.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (oldestPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: 'Trans',
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

                const tooltip = [person.name, `Age: ${person.age}`];

                if (person.demographic === 'isGay' || person.demographic === 'trans') {
                  tooltip.push(`Gender: ${person.gender}`);
                }

                tooltip.push(`Country: ${this._format.formatCountry(person.country)}`, `Visit: ${this._format.formatDate(person.visitedDateLabel)}`);

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
            label: 'Groups',
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
              text: 'Age',
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
                  1: 'Couple',
                  2: 'Friends',
                  3: 'Family',
                };
                return labels[value as number];
              },
            },
            title: {
              display: true,
              text: 'Group',
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
                    text: 'Couple',
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Couple),
                    strokeStyle: GROUP_COLORS.Couple.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: 'Friends',
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Friends),
                    strokeStyle: GROUP_COLORS.Friends.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: 'Family',
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
                  `Age: ${person.age}`,
                  `Gender: ${person.gender}`,
                  `Country: ${this._format.formatCountry(person.country)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
    console.log('Color de labels:', chart.options.plugins?.legend?.labels?.color);

    console.log('Color CSS actual:', getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim());

    console.log('Color global Chart.js:', Chart.defaults.color);

    console.log('Color efectivo de la leyenda:', chart.options.plugins?.legend?.labels?.color);

    console.log('Leyenda activada:', chart.options.plugins?.legend?.display);

    console.log('Canvas:', chart.canvas);

    console.log('Instancia de la leyenda:', chart.legend);

    console.log('Color de las etiquetas:', chart.options.plugins?.legend?.labels?.color);

    console.log(
      'Elementos de la leyenda:',
      chart.legend?.legendItems?.map(item => ({
        text: item.text,
        fontColor: item.fontColor,
        fillStyle: item.fillStyle,
      }))
    );
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
      // Sort from youngest to oldest
      .sort((a, b) => a.age - b.age);
    //  Get ranking colors based on the sorted ages.
    const colors = getRankingColors(youngestPeople.map(person => person.age));

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        // Each person becomes a label on the Y axis.
        labels: youngestPeople.map(person => person.name),
        datasets: [
          {
            label: 'Age',
            // Each bar represents the person's calculated age.
            data: youngestPeople.map(person => person.age),
            // Apply ranking colors
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
              text: 'Age',
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
                  text: 'Youngest',
                  fillStyle: getColorWithOpacity(RANKING_COLORS.gold),
                  strokeStyle: RANKING_COLORS.gold.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: 'Second Youngest',
                  fillStyle: getColorWithOpacity(RANKING_COLORS.silver),
                  strokeStyle: RANKING_COLORS.silver.border,
                  lineWidth: 1,
                  fontColor: CHART_UNKNOWN_COLOR,
                },
                {
                  text: 'Third Youngest',
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
                  `Age: ${person.age}`,
                  `Gender: ${person.gender}`,
                  `Country: ${this._format.formatCountry(person.country)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
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
            label: 'Solo Guests',
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
            title: {
              display: true,
              text: 'Visit Date',
            },
          },

          // Y axis represents the guest's age.
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Age',
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
                    text: 'Male',
                    fillStyle: getColorWithOpacity(this.genderColors.male),
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: getColorWithOpacity(this.genderColors.female),
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: getColorWithOpacity(this.genderColors.trans),
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: 'Gay',
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
                  `Age: ${person.age}`,
                  `Country: ${this._format.formatCountry(person.country)}`,
                  `Visit: ${this._format.formatDate(person.visitedDateLabel)}`,
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
            label: 'Groups',
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
              text: 'Age',
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
                  1: 'Couple',
                  2: 'Friends',
                  3: 'Family',
                };
                return labels[value as number];
              },
            },
            title: {
              display: true,
              text: 'Group',
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
                    text: 'Couple',
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Couple),
                    strokeStyle: GROUP_COLORS.Couple.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: 'Friends',
                    fillStyle: getColorWithOpacity(GROUP_COLORS.Friends),
                    strokeStyle: GROUP_COLORS.Friends.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: 'Family',
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
                  `Age: ${person.age}`,
                  `Gender: ${person.gender}`,
                  `Country: ${this._format.formatCountry(person.country)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
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
            label: 'Overall',
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
            title: {
              display: true,
              text: 'Visit Date',
            },
          },

          // Only one category is displayed.
          y: {
            min: 0.5,
            max: 1.5,
            ticks: {
              stepSize: 1,
              callback: () => 'Overall',
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
                  { key: 'male' as const, text: 'Male', color: this.genderColors.male },
                  { key: 'female' as const, text: 'Female', color: this.genderColors.female },
                  { key: 'trans' as const, text: 'Trans', color: this.genderColors.trans },
                  { key: 'isGay' as const, text: 'Gay', color: this.genderColors.isGay },
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

                return [
                  `${point.type}: ${point.person.fullName}${groupLabel}`,
                  `Gender: ${point.person.gender}`,
                  `Country: ${this._format.formatCountry(point.person.hometownCode)}`,
                  `Visit: ${this._format.formatDate(point.person.visitedDate)}`,
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
        label: 'Solo Female',
        first: solo.female.first,
        last: solo.female.last,
        color: this.genderColors.female,
      },
      {
        label: 'Solo Male',
        first: solo.male.first,
        last: solo.male.last,
        color: this.genderColors.male,
      },
      {
        label: 'Solo Trans',
        first: solo.trans.first,
        last: solo.trans.last,
        color: this.genderColors.trans,
      },
      {
        label: 'Solo Gay',
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
            title: {
              display: true,
              text: 'Visit Date',
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
              text: 'Category',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels = [];

                if (validCategories.some(category => category.label === 'Solo Female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: getColorWithOpacity(this.genderColors.female),
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: getColorWithOpacity(this.genderColors.male),
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: getColorWithOpacity(this.genderColors.trans),
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                    fontColor: CHART_UNKNOWN_COLOR,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Gay')) {
                  labels.push({
                    text: 'Gay',
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
                return [
                  `${context.dataIndex === 0 ? 'First' : 'Last'}: ${person.fullName}`,
                  `Category: ${category.label}`,
                  `Country: ${this._format.formatCountry(person.hometownCode)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
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
        label: 'Couple',
        first: firstLast.couple.first,
        last: firstLast.couple.last,
        color: GROUP_COLORS.Couple,
      },
      {
        label: 'Friends',
        first: firstLast.friends.first,
        last: firstLast.friends.last,
        color: GROUP_COLORS.Friends,
      },
      {
        label: 'Family',
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
            title: {
              display: true,
              text: 'Visit Date',
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
              text: 'Group',
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
                if (!person) {
                  return '';
                }

                const groupLabel = person.groupType === 'solo' ? '' : ` and ${this.groupLabels[person.groupType]}`;

                return [
                  `${context.dataIndex === 0 ? 'First' : 'Last'}: ${person.fullName} ${groupLabel}`,
                  `Gender: ${person.gender}`,
                  `Country: ${this._format.formatCountry(person.hometownCode)}`,
                  `Visit: ${this._format.formatDate(person.visitedDate)}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    // Destroy the Chart.js instance when the component is removed to prevent memory leaks and duplicated charts
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
}
