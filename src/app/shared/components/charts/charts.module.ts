// shared/components/charts/charts.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BarChartComponent } from './bar-chart.component';
import { BubbleChartComponent } from './bubble-chart.component';
import { DotPlotChartComponent } from './dot-plot-chart.component';
import { HeatmapChartComponent } from './heatmap-chart.component';
import { LineChartComponent } from './line-chart.component';
import { NetworkChartComponent } from './network-chart.component';
import { PieChartComponent } from './pie-chart.component';
import { PolarAreaChartComponent } from './polar-area-chart.component';
import { RadarChartComponent } from './radar-chart.component';
import { ScatterChartComponent } from './scatter-chart.component';

const CHARTS = [
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
  declarations: CHARTS,
  imports: [CommonModule],
  exports: CHARTS,
})
export class ChartsModule {}
