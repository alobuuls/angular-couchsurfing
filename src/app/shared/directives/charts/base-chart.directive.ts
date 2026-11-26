import { AfterViewInit, Directive, ElementRef, EventEmitter, HostBinding, inject, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Chart, { ActiveElement, ChartConfiguration, ChartEvent, ChartType, LegendItem, TooltipModel } from 'chart.js/auto';

import { createExternalTooltip, destroyExternalTooltip, getChartTheme, hideExternalTooltip, IChartTheme } from '@utils';
import { IChartColors, IChartElementClick, IChartLegendItem, TChartTooltipContent } from '@type/chart.types';
import { ChartThemeService } from '@shared/services/chart-theme.service';
import { ThemeService } from '@core/services/theme.service';

@Directive()
export abstract class BaseChartDirective implements AfterViewInit, OnChanges, OnDestroy {
  private readonly zone = inject(NgZone);

  // Injecting it applies the current theme to Chart.js before the first chart is created.
  private readonly chartTheme = inject(ChartThemeService);
  private readonly themeService = inject(ThemeService);

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Input() title = '';
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() datasetLabel = '';
  @Input() colors?: IChartColors;
  @Input() legend: IChartLegendItem[] | null = null;
  @Input() height?: number;
  @Input() showLegend = true;

  // When false, the chart fills the height of its container.
  @Input() maintainAspectRatio = true;

  // Returns the content of the external tooltip for an item.
  @Input() tooltip?: (index: number, datasetIndex: number) => TChartTooltipContent | null;

  // Uses the default tooltip, but shows "dataset label: value".
  @Input() datasetLabelInTooltip = false;

  @Output() itemClick = new EventEmitter<number>();
  @Output() elementClick = new EventEmitter<IChartElementClick>();

  // The host must be a block so the chart can measure its container.
  @HostBinding('style.display') readonly hostDisplay = 'block';

  @HostBinding('style.height')
  get hostHeight(): string | null {
    return this.maintainAspectRatio ? null : '100%';
  }

  protected chart?: Chart;
  private viewReady = false;

  // Re-renders on theme change (Chart.js defaults are already updated at this point).
  private readonly themeSub = this.chartTheme.applied$.pipe(takeUntilDestroyed()).subscribe(() => {
    if (this.viewReady) this.render();
  });

  // Subclasses use this inside buildConfig(). It is read on every render.
  protected get theme(): IChartTheme {
    return getChartTheme(this.themeService.theme);
  }

  // Each chart type defines its own Chart.js configuration.
  protected abstract buildConfig(): ChartConfiguration<any>;

  // Charts with no data are not rendered.
  protected hasData(): boolean {
    return this.labels.length > 0;
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(): void {
    // Inputs can change before the canvas exists.
    if (this.viewReady) this.render();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private render(): void {
    this.destroy();

    if (!this.hasData()) return;

    this.canvas.nativeElement.style.height = this.height ? `${this.height}px` : '';

    this.zone.runOutsideAngular(() => {
      try {
        this.chart = new Chart(this.canvas.nativeElement, this.buildConfig());
      } catch (error) {
        console.error('[chart]', this.constructor.name, error);
      }
    });
  }

  private destroy(): void {
    if (!this.chart) return;

    destroyExternalTooltip(this.chart);
    this.chart.destroy();
    this.chart = undefined;
  }

  protected get titleOptions() {
    return { display: !!this.title, text: this.title };
  }

  protected get legendLabels(): { generateLabels: (chart: Chart) => LegendItem[] } | undefined {
    if (!this.legend) return undefined;

    const items = this.legend;

    return {
      generateLabels: chart =>
        items.map(
          (item, index) =>
            ({
              text: item.text,
              fillStyle: item.background,
              strokeStyle: item.border,
              lineWidth: 1,
              // Custom legend items do not inherit `labels.color`: without this the text is black.
              fontColor: chart.options.color as string,
              datasetIndex: index,
            }) as LegendItem
        ),
    };
  }

  protected get tooltipOptions(): any {
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

    if (this.datasetLabelInTooltip) {
      return {
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: any }) => `${context.dataset.label}: ${context.parsed?.y ?? context.parsed}`,
        },
      };
    }

    return undefined;
  }

  protected handleClick = (_event: ChartEvent, elements: ActiveElement[]): void => {
    if (!elements.length) return;

    const { index, datasetIndex } = elements[0];

    // The listeners navigate with the Router, which needs to run inside the zone.
    this.zone.run(() => {
      this.itemClick.emit(index);
      this.elementClick.emit({ datasetIndex, index });
    });
  };
}
