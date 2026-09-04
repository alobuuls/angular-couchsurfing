import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import Chart from 'chart.js/auto';

import { IRankingGenderView, IRankingGroupView, IRankingItem, IRankingView, IRankingsDistribution } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-rankings-chart',
  templateUrl: './guest-rankings-chart.component.html',
  styleUrls: ['./guest-rankings-chart.component.css'],
})
export class GuestRankingsChartComponent implements AfterViewInit, OnChanges {
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

  // Controls the selected women ranking view.
  selectedWomenView: IRankingGenderView = 'overall';

  // Available women ranking views.
  readonly womenRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected men ranking view.
  selectedMenView: IRankingGenderView = 'overall';

  // Available men ranking views.
  readonly menRankingViews: IRankingGenderView[] = ['overall', 'solo'];

  // Controls the selected Group ranking view.
  selectedGroupView: IRankingGroupView = 'overall';

  // Available Group ranking views.
  readonly groupRankingViews: IRankingGroupView[] = ['overall', 'couple', 'family', 'friends'];

  // Stores current Chart.js instance.
  private chart?: Chart;

  // Configuration for each ranking view.
  private readonly chartConfig: Record<
    IRankingView,
    {
      label: string;
      getData: (rankings: IRankingsDistribution) => IRankingItem[];
    }
  > = {
    people: {
      label: 'People Ranking',
      getData: rankings => rankings.people.overall,
    },

    women: {
      label: 'Women Ranking',
      getData: rankings => rankings.women.overall,
    },

    men: {
      label: 'Men Ranking',
      getData: rankings => rankings.men.overall,
    },

    groups: {
      label: 'Groups Ranking',
      getData: rankings => rankings.groups.overall,
    },
  };

  // Create the initial ranking chart after the canvas is rendered.
  ngAfterViewInit(): void {
    if (this.rankings) {
      this.createChart();
    }
  }

  // Recreate the chart when ranking data changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rankings'] && this.rankingChart) {
      this.createChart();
    }
  }

  // Changes the main ranking view.
  selectView(view: IRankingView): void {
    this.selectedView = view;

    // Reset People ranking to overall when selecting People.
    if (view === 'people') {
      this.selectedPeopleView = 'overall';
    }

    // Reset Women ranking to overall when selecting Women.
    if (view === 'women') {
      this.selectedWomenView = 'overall';
    }

    // Reset the men ranking to overall when selecting Men.
    if (view === 'men') {
      this.selectedMenView = 'overall';
    }

    // Reset the group ranking to overall when selecting Groups.
    if (view === 'groups') {
      this.selectedGroupView = 'overall';
    }

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // Changes the selected People ranking view.
  selectPeopleView(view: IRankingGenderView): void {
    this.selectedPeopleView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // Changes the selected Women ranking view.
  selectWomenView(view: IRankingGenderView): void {
    this.selectedWomenView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // Changes the selected Men ranking view.
  selectMenView(view: IRankingGenderView): void {
    this.selectedMenView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // Changes the selected Group ranking view.
  selectGroupView(view: IRankingGroupView): void {
    this.selectedGroupView = view;

    // Destroy the previous chart before creating a new one.
    this.chart?.destroy();
    this.chart = undefined;

    // Wait for Angular to update the view before creating the chart.
    setTimeout(() => {
      this.createChart();
    });
  }

  // Creates the ranking chart according to the selected view.
  private createChart(): void {
    if (!this.rankingChart || !this.rankings) {
      return;
    }
    const config = this.chartConfig[this.selectedView];

    // Use the selected subview for People, Women, Men, or Groups.
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

    // Destroy any existing chart instance.
    this.chart?.destroy();

    this.chart = new Chart(this.rankingChart.nativeElement, {
      type: 'bar',

      data: {
        labels: rankingData.map(item => item.guest.fullName),

        datasets: [
          {
            label:
              this.selectedView === 'people'
                ? `${config.label} - ${this.selectedPeopleView}`
                : this.selectedView === 'women'
                  ? `${config.label} - ${this.selectedWomenView}`
                  : this.selectedView === 'men'
                    ? `${config.label} - ${this.selectedMenView}`
                    : this.selectedView === 'groups'
                      ? `${config.label} - ${this.selectedGroupView}`
                      : config.label,
            data: rankingData.map(item => item.position),
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(201, 203, 207, 0.2)',
            ],
            borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: 'y',
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
              text: 'Ranking Position',
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
