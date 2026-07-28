import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { AlertsService } from '@services/alerts.service';

@Component({
  selector: 'guests-create',
  templateUrl: './guests-create.component.html',
  styleUrls: ['./guests-create.component.css'],
})
export class GuestsCreateComponent {
  constructor(
    private _guests: GuestsService,
    private _alerts: AlertsService,
    private router: Router
  ) {}

  create(data: any): void {
    let payload: any;

    if (data.groupType === 'solo') {
      payload = {
        ...data.trip,
        ...data.guests[0],
      };

      this._guests.createNewGuest(payload).subscribe({
        next: () => {
          this._alerts.showToast({
            icon: 'success',
            title: 'Guest created successfully',
          });

          this.router.navigateByUrl('/guests');
        },
        error: () => {
          this._alerts.showToast({
            icon: 'error',
            title: 'Error creating guest',
          });
        },
      });

      return;
    }

    payload = {
      ...data.trip,
      groupType: data.groupType,
      members: data.guests,
    };

    this._guests.createNewGroup(payload).subscribe({
      next: () => {
        this._alerts.showToast({ icon: 'success', title: 'Group created successfully' });
        this.router.navigateByUrl('/guests'); // TODO
      },
      error: () => this._alerts.showToast({ icon: 'error', title: 'Error creating group' }),
    });
  }
}
