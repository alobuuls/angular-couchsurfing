import { Component, ElementRef, Input, ViewChild } from '@angular/core';

// Interfaces
import { IBirthdaysDistribution } from '@interfaces/stats-interface';

@Component({
  selector: 'guest-birthdays-chart',
  templateUrl: './guest-birthdays-chart.component.html',
  styleUrls: ['./guest-birthdays-chart.component.css'],
})
export class GuestBirthdaysChartComponent {
  @Input() birthdays!: IBirthdaysDistribution;

  @ViewChild('birthdaysChart')
  birthdaysChart!: ElementRef<HTMLCanvasElement>;
}
