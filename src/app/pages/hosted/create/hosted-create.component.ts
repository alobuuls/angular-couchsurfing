import { Component } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { HostedService } from '@services/hosted.service';
import { AlertsService } from '@services/alerts.service';

@Component({
  selector: 'hosted-create',
  templateUrl: './hosted-create.component.html',
  styleUrls: ['./hosted-create.component.css'],
})
export class HostedCreateComponent {
  constructor(
    private _hosted: HostedService,
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

      this._hosted.createNewGuest(payload).subscribe({
        next: () => {
          this._alerts.showToast({
            icon: 'success',
            title: 'Guest created successfully',
          });

          this.router.navigateByUrl('/hosted');
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

    this._hosted.createNewGroup(payload).subscribe({
      next: () => {
        this._alerts.showToast({ icon: 'success', title: 'Group created successfully' });
        this.router.navigateByUrl('/hosted');
      },
      error: () => this._alerts.showToast({ icon: 'error', title: 'Error creating group' }),
    });
  }
}
