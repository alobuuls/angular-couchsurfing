import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';

// Interfaces
import { IGroupMember, IGuestDetail } from '@interfaces/guests.interface';
import { IErrResp, ReqStatus } from '@interfaces/data-structure-api';

@Component({
  selector: 'guests-detail',
  templateUrl: './guests-detail.component.html',
  styleUrls: ['./guests-detail.component.css'],
})
export class GuestsDetailComponent implements OnInit {
  status: ReqStatus = 'loading';
  error?: IErrResp;

  guest?: IGuestDetail;
  group?: IGroupMember[];

  constructor(
    private route: ActivatedRoute,
    private _guests: GuestsService
  ) {}

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('guestId');
    const groupId = this.route.snapshot.paramMap.get('groupId');

    this.status = 'loading';

    if (groupId) {
      this._guests.getGroupById(groupId).subscribe({
        next: resp => {
          this.group = resp.data;
          this.status = 'success';
        },
        error: err => {
          this.error = err;
          this.status = 'error';
        },
      });

      return;
    }

    if (guestId) {
      this._guests.getGuestById(guestId).subscribe({
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
