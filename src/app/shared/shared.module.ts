import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Pipes
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';
import { SocialLinkPipe } from '@shared/pipes/social-link.pipe';

// Components
import { ShTitleComponent } from '@shared/components/sh-title/sh-title.component';
import { ShProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

// Charts Components
import { BarChartComponent } from '@shared/components/charts/bar-chart.component';
import { BubbleChartComponent } from '@shared/components/charts/bubble-chart.component';
import { DotPlotChartComponent } from '@shared/components/charts/dot-plot-chart.component';
import { HeatmapChartComponent } from '@shared/components/charts/heatmap-chart.component';
import { LineChartComponent } from '@shared/components/charts/line-chart.component';
import { NetworkChartComponent } from '@shared/components/charts/network-chart.component';
import { PieChartComponent } from '@shared/components/charts/pie-chart.component';
import { PolarAreaChartComponent } from '@shared/components/charts/polar-area-chart.component';
import { RadarChartComponent } from '@shared/components/charts/radar-chart.component';
import { ScatterChartComponent } from '@shared/components/charts/scatter-chart.component';

const components = [ShTitleComponent, ShProgressBarComponent, LoadingComponent, EmptyStateComponent];

// Charts
const chartsComponents = [
  BarChartComponent,
  BubbleChartComponent,
  DotPlotChartComponent,
  HeatmapChartComponent,
  LineChartComponent,
  NetworkChartComponent,
  PieChartComponent,
  PolarAreaChartComponent,
  RadarChartComponent,
  ScatterChartComponent,
];

@NgModule({
  declarations: [FlagPipe, SocialLinkPipe, ...components, ...chartsComponents],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, FlagPipe, SocialLinkPipe, TranslateModule, ...components, ...chartsComponents],
  providers: [FlagPipe],
})
export class SharedModule {}
