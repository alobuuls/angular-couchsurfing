import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateFormatService {
  private readonly datePipe = new DatePipe('en-US');

  formatDate(isoDate: string): string {
    return this.datePipe.transform(isoDate, 'MMMM d, y') ?? isoDate;
  }
}
