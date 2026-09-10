import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import { IDemographicsDistribution, IDemographicsView, IDemographicsTotalsView, IDemographicGender, IDemographicsOldestView } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-demographics-chart',
  templateUrl: './guest-demographics-chart.component.html',
  styleUrls: ['./guest-demographics-chart.component.css'],
})
export class GuestDemographicsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  // Demographic data received from the parent component.
  @Input() demographics!: IDemographicsDistribution;

  // Reference to the canvas where Chart.js will render the chart.
  @ViewChild('demographicsChart')
  demographicsChart!: ElementRef<HTMLCanvasElement>;

  // Currently selected main demographics view.
  selectedView: IDemographicsView = 'totals';
  // Available main views shown in the UI.
  readonly demographicsViews: IDemographicsView[] = ['totals', 'mostVisitedGender', 'oldest', 'youngest', 'firstLast'];

  readonly demographicsViewLabels: Record<IDemographicsView, string> = {
    totals: 'Totals',
    mostVisitedGender: 'Top Gender',
    oldest: 'Oldest',
    youngest: 'Youngest',
    firstLast: 'First - Last',
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

    // MOST VISITED GENDER
    if (this.selectedView === 'mostVisitedGender') {
      this.chart = this.createMostVisitedGenderChart();
      return;
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
    return new Chart(this.demographicsChart.nativeElement, {
      // Doughnut chart is used to show the overall distribution.
      type: 'doughnut',
      data: {
        // Each label represents one demographic category.
        labels: ['Male', 'Female', 'Trans', 'Gay'],
        datasets: [
          {
            label: 'Overall Demographics',

            // Values used to calculate each section of the doughnut.
            data: [overall.male, overall.female, overall.trans, overall.isGay],
            backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],
            borderColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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
            // Male values for each travel group.
            data: [groups.solo.male, groups.couple.male, groups.friends.male, groups.family.male],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
          },
          {
            label: 'Female',
            // Female values for each travel group.
            data: [groups.solo.female, groups.couple.female, groups.friends.female, groups.family.female],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
          },
          {
            label: 'Trans',
            // Trans values for each travel group.
            data: [groups.solo.trans, groups.couple.trans, groups.friends.trans, groups.family.trans],
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
          },
          {
            label: 'Gay',
            // Gay values for each travel group.
            data: [groups.solo.isGay, groups.couple.isGay, groups.friends.isGay, groups.family.isGay],
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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

  // MOST VISITED GENDER

  private createMostVisitedGenderChart(): Chart {
    const legendGenders = new Set<IDemographicGender>();
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];
    // Get demographic data for each travel group.
    const groups = this.demographics.totals.groups;
    // Combine overall data and group data into a single structure
    // so the same logic can be applied to every category.
    const categories = [
      {
        label: 'Overall',
        data: this.demographics.totals.overall,
      },
      {
        label: 'Solo',
        data: groups.solo,
      },
      {
        label: 'Couple',
        data: groups.couple,
      },
      {
        label: 'Friends',
        data: groups.friends,
      },
      {
        label: 'Family',
        data: groups.family,
      },
    ];

    // Final labels and values that will be passed to Chart.js.
    const labels: string[] = [];
    const data: number[] = [];

    // Demographic categories that should not be displayed
    // for specific groups.
    const hiddenGenders: Record<string, string[]> = {
      Overall: ['Trans'],
      Couple: ['Trans'],
      Friends: ['Trans'],
      Family: ['Trans', 'Gay'],
    };

    categories.forEach(category => {
      // Build the gender list for the current category.
      const genders = [
        {
          label: 'Female',
          value: category.data.female,
        },
        {
          label: 'Male',
          value: category.data.male,
        },
        {
          label: 'Trans',
          value: category.data.trans,
        },
        {
          label: 'Gay',
          value: category.data.isGay,
        },
      ]
        // Remove genders that are not applicable to the current category.
        .filter(gender => !hiddenGenders[category.label]?.includes(gender.label))

        // Remove genders with no registered guests.
        .filter(gender => gender.value > 0)

        // Sort from highest value to lowest value.
        .sort((a, b) => b.value - a.value);
      genders.forEach(gender => {
        // Create a label such as "Overall - Female".
        labels.push(`${category.label} - ${gender.label}`);

        // Add the corresponding value.
        data.push(gender.value);

        // Assign the color according to the gender category.
        const genderKey = {
          Female: 'female',
          Male: 'male',
          Trans: 'trans',
          Gay: 'isGay',
        }[gender.label] as IDemographicGender;

        backgroundColors.push(this.genderColors[genderKey].background);
        borderColors.push(this.genderColors[genderKey].border);

        // Store the gender for the dynamic legend.
        legendGenders.add(genderKey);
      });
    });

    return new Chart(this.demographicsChart.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Most Visited Gender',
            data,
            // Colors are assigned according to the gender categories.
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        // Display the bars horizontally.
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
          },
          y: {
            reverse: false,
          },
        },
        plugins: {
          // The dataset label is not needed because the bars already have labels.
          legend: {
            display: true,
            labels: {
              generateLabels: () => {
                const labels: {
                  text: string;
                  fillStyle: string;
                  strokeStyle: string;
                  lineWidth: number;
                }[] = [];

                if (legendGenders.has('male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: this.genderColors.male.background,
                    strokeStyle: this.genderColors.male.border,
                    lineWidth: 1,
                  });
                }

                if (legendGenders.has('female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: this.genderColors.female.background,
                    strokeStyle: this.genderColors.female.border,
                    lineWidth: 1,
                  });
                }

                if (legendGenders.has('trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: this.genderColors.trans.background,
                    strokeStyle: this.genderColors.trans.border,
                    lineWidth: 1,
                  });
                }

                if (legendGenders.has('isGay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: this.genderColors.isGay.background,
                    strokeStyle: this.genderColors.isGay.border,
                    lineWidth: 1,
                  });
                }

                return labels;
              },
            },
          },
        },
      },
    });
  }

  // OLDEST - OVERALL
  private createOverallOldestChart(): Chart {
    // Get people belonging to the overall demographic group.
    const people = this.demographics.oldest.overall.people;

    // Prepare the data required by Chart.js.
    const oldestPeople = people
      // Only people with a registered birth date can have their age calculated.
      .filter(person => person.birthDate)

      // Convert each person containing name, age, gender and country.
      .map(person => ({
        name: person.fullName,
        age: this.calculateAge(person.birthDate!),
        gender: person.gender,
        country: person.hometownCode,
      }))

      // Sort from youngest to oldest.
      .sort((a, b) => a.age - b.age);
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
            backgroundColor: oldestPeople.map(person => this.genderColors[person.gender].background),
            borderColor: oldestPeople.map(person => this.genderColors[person.gender].border),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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
          // Reverse the Y axis so the oldest person appears first.
          y: {
            reverse: true,
          },
        },
        plugins: {
          // Person names on the Y axis already identify the data.
          legend: {
            display: true,
            labels: {
              // Generate fixed labels to identify the data.
              generateLabels: () => {
                const labels = [];

                if (oldestPeople.some(person => person.gender === 'male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: 'rgba(54, 162, 235, 0.5)',
                    strokeStyle: 'rgb(54, 162, 235)',
                    lineWidth: 1,
                  });
                }

                if (oldestPeople.some(person => person.gender === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
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
                return person.country;
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
    // Get all solo guests from each gender category.
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

    // Prepare the data required by the scatter plot.
    const soloPeople = people
      // Only people with a registered birth date can have their age calculated.
      .filter(person => person.birthDate)
      .map(person => ({
        name: person.fullName,
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
                    fillStyle: 'rgba(54, 162, 235, 0.5)',
                    strokeStyle: 'rgb(54, 162, 235)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: 'rgba(153, 102, 255, 0.5)',
                    strokeStyle: 'rgb(153, 102, 255)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: 'rgba(255, 193, 7, 0.5)',
                    strokeStyle: 'rgb(255, 193, 7)',
                    lineWidth: 1,
                  });
                }

                return labels;
              },
            },
          },

          // Show guest information when hovering over a point.
          tooltip: {
            callbacks: {
              label: context => {
                const person = soloPeople[context.dataIndex];
                return [person.name, `Age: ${person.age}`, `Visited: ${person.visitedDateLabel}`, `Gender: ${person.gender}`, `Country: ${person.country}`];
              },
            },
          },
        },
      },
    });
  }

  private readonly genderColors: Record<IDemographicGender, { background: string; border: string }> = {
    female: {
      background: 'rgba(255, 99, 132, 0.5)',
      border: 'rgb(255, 99, 132)',
    },
    male: {
      background: 'rgba(54, 162, 235, 0.5)',
      border: 'rgb(54, 162, 235)',
    },
    isGay: {
      background: 'rgba(255, 193, 7, 0.5)',
      border: 'rgb(255, 193, 7)',
    },
    trans: {
      background: 'rgba(153, 102, 255, 0.5)',
      border: 'rgb(153, 102, 255)',
    },
  };

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
        age: this.calculateAge(person.birthDate!),
        group: person.group,
        gender: person.gender,
        demographic: person.demographic,
        groupId: person.groupId,
        country: person.hometownCode,
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

            // Apply the color according to the guest's demographic.
            backgroundColor: groupsPeople.map(person => this.groupColors[person.group].background),
            borderColor: groupsPeople.map(person => this.groupColors[person.group].border),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: 'Friends',
                    fillStyle: 'rgba(75, 192, 192, 0.5)',
                    strokeStyle: 'rgb(75, 192, 192)',
                    lineWidth: 1,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: 'Family',
                    fillStyle: 'rgba(255, 193, 7, 0.5)',
                    strokeStyle: 'rgb(255, 193, 7)',
                    lineWidth: 1,
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
                return [person.name, `Age: ${person.age}`, `Group: ${person.group}`, `Gender: ${person.gender}`, `Country: ${person.country}`];
              },
            },
          },
        },
      },
    });
  }

  private readonly groupColors: Record<string, { background: string; border: string }> = {
    Couple: {
      background: 'rgba(255, 99, 132, 0.5)',
      border: 'rgb(255, 99, 132)',
    },
    Friends: {
      background: 'rgba(75, 192, 192, 0.5)',
      border: 'rgb(75, 192, 192)',
    },
    Family: {
      background: 'rgba(255, 193, 7, 0.5)',
      border: 'rgb(255, 193, 7)',
    },
  };

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
        age: this.calculateAge(person.birthDate!),
        gender: person.gender,
        country: person.hometownCode,
      }))
      // Sort from oldest to youngest.
      .sort((a, b) => b.age - a.age);

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
            backgroundColor: youngestPeople.map(person => this.genderColors[person.gender].background),
            borderColor: youngestPeople.map(person => this.genderColors[person.gender].border),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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
            reverse: true,
          },
        },
        plugins: {
          // Person names on the Y axis already identify the data.
          legend: {
            display: true,
            labels: {
              // Generate fixed labels to identify the data.
              generateLabels: () => {
                const labels = [];

                if (youngestPeople.some(person => person.gender === 'male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: 'rgba(54, 162, 235, 0.5)',
                    strokeStyle: 'rgb(54, 162, 235)',
                    lineWidth: 1,
                  });
                }

                if (youngestPeople.some(person => person.gender === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }
                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const person = youngestPeople[context.dataIndex];
                return person.country;
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
                    fillStyle: 'rgba(54, 162, 235, 0.5)',
                    strokeStyle: 'rgb(54, 162, 235)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'female')) {
                  labels.push({
                    text: 'Female',
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: 'rgba(153, 102, 255, 0.5)',
                    strokeStyle: 'rgb(153, 102, 255)',
                    lineWidth: 1,
                  });
                }

                if (soloPeople.some(person => person.demographic === 'isGay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: 'rgba(255, 193, 7, 0.5)',
                    strokeStyle: 'rgb(255, 193, 7)',
                    lineWidth: 1,
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
                return [person.name, `Age: ${person.age}`, `Visited: ${person.visitedDateLabel}`, `Gender: ${person.gender}`, `Country: ${person.country}`];
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
        age: this.calculateAge(person.birthDate!),
        group: person.group,
        gender: person.gender,
        demographic: person.demographic,
        groupId: person.groupId,
        country: person.hometownCode,
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
            backgroundColor: groupsPeople.map(person => this.groupColors[person.group].background),
            borderColor: groupsPeople.map(person => this.groupColors[person.group].border),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
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
                    fillStyle: 'rgba(255, 99, 132, 0.5)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Friends')) {
                  labels.push({
                    text: 'Friends',
                    fillStyle: 'rgba(75, 192, 192, 0.5)',
                    strokeStyle: 'rgb(75, 192, 192)',
                    lineWidth: 1,
                  });
                }

                if (groupsPeople.some(person => person.group === 'Family')) {
                  labels.push({
                    text: 'Family',
                    fillStyle: 'rgba(255, 193, 7, 0.5)',
                    strokeStyle: 'rgb(255, 193, 7)',
                    lineWidth: 1,
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
                return [person.name, `Age: ${person.age}`, `Group: ${person.group}`, `Gender: ${person.gender}`, `Country: ${person.country}`];
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
            borderColor: 'rgba(100, 100, 100, 0.5)',
            borderWidth: 2,
            pointBackgroundColor: [
              first ? this.firstLastGenderColors[first.gender].background : undefined,
              last ? this.firstLastGenderColors[last.gender].background : undefined,
            ],
            pointBorderColor: [first ? this.firstLastGenderColors[first.gender].border : undefined, last ? this.firstLastGenderColors[last.gender].border : undefined],
            pointRadius: 8,
            pointHoverRadius: 11,
          },
        ],
      },
      options: {
        responsive: true,
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
                }[] = [];

                const genders = [
                  {
                    key: 'male' as const,
                    text: 'Male',
                    background: 'rgba(54, 162, 235, 0.7)',
                    border: 'rgb(54, 162, 235)',
                  },
                  {
                    key: 'female' as const,
                    text: 'Female',
                    background: 'rgba(255, 99, 132, 0.7)',
                    border: 'rgb(255, 99, 132)',
                  },
                  {
                    key: 'trans' as const,
                    text: 'Trans',
                    background: 'rgba(153, 102, 255, 0.7)',
                    border: 'rgb(153, 102, 255)',
                  },
                  {
                    key: 'isGay' as const,
                    text: 'Gay',
                    background: 'rgba(255, 193, 7, 0.7)',
                    border: 'rgb(255, 193, 7)',
                  },
                ];

                genders.forEach(gender => {
                  if (first?.gender === gender.key || last?.gender === gender.key) {
                    labels.push({
                      text: gender.text,
                      fillStyle: gender.background,
                      strokeStyle: gender.border,
                      lineWidth: 1,
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
                    visitedDate: string;
                    gender: IDemographicGender;
                    hometownCode: string;
                  };
                };
                return [
                  `${point.type}: ${point.person.fullName}`,
                  `Visited: ${point.person.visitedDate}`,
                  `Gender: ${point.person.gender}`,
                  `country: ${point.person.hometownCode}`,
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
        color: this.firstLastGenderColors.female,
      },
      {
        label: 'Solo Male',
        first: solo.male.first,
        last: solo.male.last,
        color: this.firstLastGenderColors.male,
      },
      {
        label: 'Solo Trans',
        first: solo.trans.first,
        last: solo.trans.last,
        color: this.firstLastGenderColors.trans,
      },
      {
        label: 'Solo Gay',
        first: solo.isGay.first,
        last: solo.isGay.last,
        color: this.firstLastGenderColors.isGay,
      },
    ];

    const validCategories = categories.filter(category => category.first || category.last);
    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: validCategories
          .filter(category => category.first && category.last)
          .map(category => ({
            label: category.label,
            data: [
              {
                x: new Date(category.first!.visitedDate),
                y: validCategories.indexOf(category) + 1,
              },
              {
                x: new Date(category.last!.visitedDate),
                y: validCategories.indexOf(category) + 1,
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
            max: validCategories.length + 0.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                return validCategories[(value as number) - 1]?.label ?? '';
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
                    fillStyle: 'rgba(255, 99, 132, 0.7)',
                    strokeStyle: 'rgb(255, 99, 132)',
                    lineWidth: 1,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Male')) {
                  labels.push({
                    text: 'Male',
                    fillStyle: 'rgba(54, 162, 235, 0.7)',
                    strokeStyle: 'rgb(54, 162, 235)',
                    lineWidth: 1,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Trans')) {
                  labels.push({
                    text: 'Trans',
                    fillStyle: 'rgba(153, 102, 255, 0.7)',
                    strokeStyle: 'rgb(153, 102, 255)',
                    lineWidth: 1,
                  });
                }

                if (validCategories.some(category => category.label === 'Solo Gay')) {
                  labels.push({
                    text: 'Gay',
                    fillStyle: 'rgba(255, 193, 7, 0.7)',
                    strokeStyle: 'rgb(255, 193, 7)',
                    lineWidth: 1,
                  });
                }

                return labels;
              },
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const category = validCategories[context.datasetIndex];
                const person = context.dataIndex === 0 ? category.first : category.last;
                if (!person) {
                  return '';
                }
                return [
                  `${context.dataIndex === 0 ? 'First' : 'Last'}: ${person.fullName}`,
                  `Category: ${category.label}`,
                  `Visited: ${person.visitedDate}`,
                  `Gender: ${person.gender}`,
                  `Country: ${person.hometownCode}`,
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
        color: this.firstLastGroupColors.Couple,
      },
      {
        label: 'Friends',
        first: firstLast.friends.first,
        last: firstLast.friends.last,
        color: this.firstLastGroupColors.Friends,
      },
      {
        label: 'Family',
        first: firstLast.family.first,
        last: firstLast.family.last,
        color: this.firstLastGroupColors.Family,
      },
    ];
    return new Chart(this.demographicsChart.nativeElement, {
      type: 'scatter',
      data: {
        datasets: categories
          .filter(category => category.first && category.last)
          .map((category, index) => ({
            label: category.label,
            data: [
              {
                x: new Date(category.first!.visitedDate),
                y: index + 1,
              },
              {
                x: new Date(category.last!.visitedDate),
                y: index + 1,
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
            max: categories.length + 0.5,
            ticks: {
              stepSize: 1,
              callback: value => {
                return categories[(value as number) - 1]?.label ?? '';
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
                }[] = [];

                categories.forEach(category => {
                  if (category.first || category.last) {
                    labels.push({
                      text: category.label,
                      fillStyle: category.color.background,
                      strokeStyle: category.color.border,
                      lineWidth: 1,
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
                const category = categories[context.datasetIndex];
                const person = context.dataIndex === 0 ? category.first : category.last;
                if (!person) {
                  return '';
                }
                return [
                  `${context.dataIndex === 0 ? 'First' : 'Last'}: ${person.fullName}`,
                  `Group: ${category.label}`,
                  `Visited: ${person.visitedDate}`,
                  `Gender: ${person.gender}`,
                  `Country: ${person.hometownCode}`,
                ];
              },
            },
          },
        },
      },
    });
  }

  private readonly firstLastGenderColors: Record<IDemographicGender, { background: string; border: string }> = {
    female: {
      background: 'rgba(255, 99, 132, 0.7)',
      border: 'rgb(255, 99, 132)',
    },
    male: {
      background: 'rgba(54, 162, 235, 0.7)',
      border: 'rgb(54, 162, 235)',
    },
    isGay: {
      background: 'rgba(255, 193, 7, 0.7)',
      border: 'rgb(255, 193, 7)',
    },
    trans: {
      background: 'rgba(153, 102, 255, 0.7)',
      border: 'rgb(153, 102, 255)',
    },
  };

  private readonly firstLastGroupColors: Record<'Couple' | 'Friends' | 'Family', { background: string; border: string }> = {
    Couple: {
      background: 'rgba(255, 99, 71, 0.7)',
      border: 'rgb(255, 99, 71)',
    },
    Friends: {
      background: 'rgba(75, 192, 120, 0.7)',
      border: 'rgb(75, 192, 120)',
    },
    Family: {
      background: 'rgba(255, 159, 64, 0.7)',
      border: 'rgb(255, 159, 64)',
    },
  };
  ngOnDestroy(): void {
    // Destroy the Chart.js instance when the component is removed to prevent memory leaks and duplicated charts
    this.chart?.destroy();
  }
}
