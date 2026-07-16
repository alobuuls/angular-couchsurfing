import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { GroupsService } from '@services/groups.service';

// Interfaces
import { IGroupMember, IGuestDetail } from '@interfaces/couchsurfing.interface';
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
    private _guests: GuestsService,
    private _groups: GroupsService
  ) {}

  ngOnInit(): void {
    this.getById();
  }

  private getById(): void {
    const guestId = this.route.snapshot.paramMap.get('guestId');
    const groupId = this.route.snapshot.paramMap.get('groupId');

    this.status = 'loading';

    if (groupId) {
      this._groups.getGroupById(groupId).subscribe({
        next: resp => {
          console.log('GROUP RESP', resp.data);
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
}
