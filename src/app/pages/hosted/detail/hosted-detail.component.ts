import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { HostedService } from '@services/hosted.service';

// Interfaces
import { IGroupMember, IGuestDetail } from '@interfaces/guests.interface';
import { IErrResp, ReqStatus } from '@interfaces/data-structure-api';

@Component({
  selector: 'hosted-detail',
  templateUrl: './hosted-detail.component.html',
  styleUrls: ['./hosted-detail.component.css'],
})
export class HostedDetailComponent implements OnInit {
  status: ReqStatus = 'loading';
  error?: IErrResp;

  guest?: IGuestDetail;
  group?: IGroupMember[];

  constructor(
    private route: ActivatedRoute,
    private _hosted: HostedService
  ) {}

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('hostedId');

    this.status = 'loading';

    if (guestId) {
      this._hosted.getGuestById(guestId).subscribe({
        next: resp => {
          this.guest = resp.data;
          this.status = 'success';
        },
        error: err => {
          this.error = err;
          this.status = 'error';
        },
      });
    }
  }

  openCouchsurfing(profileId: string): void {
    window.open(`https://www.couchsurfing.com/c/users/${profileId}`, '_blank');
  }

  openInstagram(username: string): void {
    window.open(`https://www.instagram.com/${username}`, '_blank');
  }

  formatRegion(region: string): string {
    return region.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
}
