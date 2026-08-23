import { Component, Input } from '@angular/core';

import { IGuestTableRow } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-map',
  templateUrl: './guests-map.component.html',
  styleUrls: ['./guests-map.component.css'],
})
export class GuestsMapComponent {
  @Input() data: IGuestTableRow[] = [];
}
