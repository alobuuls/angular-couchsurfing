import { AfterViewInit, Directive, ElementRef, EventEmitter, HostBinding, inject, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import Chart, { ActiveElement, ChartConfiguration, ChartEvent, ChartType, LegendItem, TooltipModel } from 'chart.js/auto';

import { CHART_UNKNOWN_COLOR, createExternalTooltip, destroyExternalTooltip, hideExternalTooltip } from '@utils';
import { IChartColors, IChartElementClick, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import { ThemeService } from '@core/services/theme.service';
import { Subscription } from 'rxjs';
import { getChartTheme } from '@utils';

@Directive()
export abstract class BaseChartDirective implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Input() title = '';
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() datasetLabel = '';
  @Input() colors?: IChartColors;
  @Input() legend: IChartLegendItem[] | null = null;
  @Input() height?: number;

  // Shows or hides the legend.
  @Input() showLegend = true;

  // When false, the chart fills the height of its container.
  @Input() maintainAspectRatio = true;

  // Returns the content of the external tooltip for an item index.
  @Input() tooltip?: (index: number, datasetIndex: number) => TChartTooltipContent | null;

  // Uses the default tooltip, but shows "dataset label: value".
  @Input() datasetLabelInTooltip = false;

  // Emits the index of the clicked item.
  @Output() itemClick = new EventEmitter<number>();

  // Emits the dataset and item index of the clicked element.
  @Output() elementClick = new EventEmitter<IChartElementClick>();

  // The host must be a block so the chart can measure its container.
  @HostBinding('style.display') readonly hostDisplay = 'block';

  @HostBinding('style.height')
  get hostHeight(): string | null {
    return this.maintainAspectRatio ? null : '100%';
  }

  protected chart?: Chart;
  private viewReady = false;

  // Each chart type defines its own Chart.js configuration.
  protected abstract buildConfig(): ChartConfiguration<any>;

  // Charts with no data are not rendered.
  protected hasData(): boolean {
    return this.labels.length > 0;
  }

  private readonly themeService = inject(ThemeService);
  private themeSubscription?: Subscription;

  ngAfterViewInit(): void {
    this.viewReady = true;

    this.themeSubscription = this.themeService.themeChanges$.subscribe(() => {
      this.updateChartTheme();
    });

    this.render();
  }

  ngOnChanges(): void {
    // Inputs can change before the canvas exists.
    if (this.viewReady) this.render();
  }

  private render(): void {
    this.destroy();

    if (!this.hasData()) return;

    this.canvas.nativeElement.style.height = this.height ? `${this.height}px` : '';
    this.chart = new Chart(this.canvas.nativeElement, this.buildConfig());
    this.updateChartTheme();
  }

  private destroy(): void {
    if (!this.chart) return;

    // Destroy the external tooltip before destroying the chart.
    destroyExternalTooltip(this.chart);
    this.chart.destroy();
    this.chart = undefined;
  }

  // Title options. An empty title is not displayed (it would still take space).
  protected get titleOptions() {
    return { display: !!this.title, text: this.title };
  }

  // Custom legend. If there are no legend items, Chart.js uses its default legend.
  protected get legendLabels(): { generateLabels: () => LegendItem[] } | undefined {
    if (!this.legend) return undefined;

    const items = this.legend;

    return {
      generateLabels: () =>
        items.map(
          (item, index) =>
            ({
              text: item.text,
              fillStyle: item.background,
              strokeStyle: item.border,
              lineWidth: 1,
              fontColor: getChartTheme(this.themeService.theme).text,
              datasetIndex: index,
            }) as LegendItem
        ),
    };
  }

  // Tooltip options shared by all the charts.
  protected get tooltipOptions(): any {
    // External tooltip.
    if (this.tooltip) {
      const getContent = this.tooltip;

      return {
        enabled: false,
        external: (context: { chart: Chart; tooltip: TooltipModel<ChartType> }) => {
          const dataPoint = context.tooltip.dataPoints?.[0];
          const content = dataPoint ? getContent(dataPoint.dataIndex, dataPoint.datasetIndex) : null;

          if (!content) {
            hideExternalTooltip(context.chart);
            return;
          }

          createExternalTooltip(context.chart, context.tooltip, content);
        },
      };
    }

    // Default tooltip with the dataset label.
    if (this.datasetLabelInTooltip) {
      return {
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: any }) => {
            const value = context.parsed?.y ?? context.parsed;
            return `${context.dataset.label}: ${value}`;
          },
        },
      };
    }

    return undefined;
  }

  protected handleClick = (_event: ChartEvent, elements: ActiveElement[]): void => {
    if (!elements.length) return;

    const { index, datasetIndex } = elements[0];

    this.itemClick.emit(index);
    this.elementClick.emit({ datasetIndex, index });
  };

  // Theme
  protected updateChartTheme(): void {
    if (!this.chart) return;

    const theme = getChartTheme(this.themeService.theme);
    const options = this.chart.options as any;

    // Update all existing scales (X, Y and radial).
    if (options.scales) {
      Object.values(options.scales).forEach((scale: any) => {
        if (!scale) return;

        scale.grid = {
          ...scale.grid,
          color: theme.grid,
        };

        scale.border = {
          ...scale.border,
          color: theme.border,
        };

        scale.ticks = {
          ...scale.ticks,
          color: theme.text,
        };

        scale.title = {
          ...scale.title,
          color: theme.text,
        };
      });
    }

    // Update legend text.
    options.plugins ??= {};
    options.plugins.legend ??= {};
    options.plugins.legend.labels ??= {};

    options.plugins.legend.labels.color = theme.text;

    // Update chart title.
    options.plugins.title ??= {};
    options.plugins.title.color = theme.text;

    this.chart.update('none');
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.destroy();
  }
}
