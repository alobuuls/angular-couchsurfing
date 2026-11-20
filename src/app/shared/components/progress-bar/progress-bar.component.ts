import { Component, Input, inject } from '@angular/core';

// Types
import { Continents } from '@type/word.types';

// Services
import { GeonameService } from '@services/geoname.service';

@Component({
  selector: 'sh-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css'],
})
export class ShProgressBarComponent {
  @Input() bgBar: string = 'var(--color-primary)';
  @Input() visitedCountriesCount!: number;
  @Input() totalCountriesCount!: number;
  @Input() visitedCountriesPercentage!: number;
  @Input() continent!: Continents;

  public _geoname = inject(GeonameService);

  getContinent(continent: Continents): string {
    return this._geoname.getContinentName(continent);
  }
}
