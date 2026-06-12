import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

// Services
import { CouchsurfingService } from '@services/couchsurfing.service';
import { ErrorHandlerService } from '@services/err-handler.service';

// Helpers
import { withReqState } from '@helpers/with-state-operator';

// Interfaces
import { IGuests } from '@interfaces/couchsurfing.interface';
import { DataState } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests',
  templateUrl: './guests.component.html',
  styleUrls: ['./guests.component.css'],
})
export class GuestsComponent implements OnInit {
  vm$!: Observable<DataState<IGuests[]>>;

  constructor(
    private _cs: CouchsurfingService,
    private _errH: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.getAllGuests();
  }

  getAllGuests(): void {
    this.vm$ = withReqState(this._cs.getAllGuests(), this._errH);
  }
}
