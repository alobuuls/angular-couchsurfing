import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

// Types
import { CountriesCodes } from '../types/word.types';

// Constants
import { WORLD } from '../config/world';

@Injectable({
  providedIn: 'root',
})
export class FormatService {
  private readonly datePipe = new DatePipe('en-US');

  formatDate(isoDate: string): string {
    return this.datePipe.transform(isoDate, 'MMMM d, y') ?? isoDate;
  }

  formatMonth(isoMonth: string): string {
    return this.datePipe.transform(`${isoMonth}-01`, 'MMMM y') ?? isoMonth;
  }

  formatDay(period: string): string {
    const [year, day] = period.split('-');
    return `Day ${day}, ${year}`;
  }

  formatCountry(code: string): string {
    const countryCode = code.toLowerCase() as CountriesCodes;
    return WORLD[countryCode]?.name ?? code;
  }
}
