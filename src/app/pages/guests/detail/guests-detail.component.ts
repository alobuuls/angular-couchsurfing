import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { GeonameService } from '@services/geoname.service';
import { SocialLinksService } from '@services/social-links.service';

// Interfaces
import { IGroupMember, IGuestDetail } from '@interfaces/guests.interface';
import { IErrResp, ReqStatus } from '@interfaces/data-structure-api';
import { FormatService } from '@services/format.service';
import { Continents, Regions } from '@type/word.types';

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

  _format = inject(FormatService);
  private route = inject(ActivatedRoute);
  private _guests = inject(GuestsService);
  private readonly _geoname = inject(GeonameService);
  private _socialLinks = inject(SocialLinksService);

  ngOnInit(): void {
    this.getById();
  }

  getRegionName(region: Regions): string {
    return this._geoname.getRegionName(region);
  }

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
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
    this._socialLinks.openCouchsurfing(profileId);
  }

  openInstagram(username: string): void {
    this._socialLinks.openInstagram(username);
  }

  openWhatsapp(whatsapp: string): void {
    this._socialLinks.openWhatsapp(whatsapp);
  }

  formatRegion(region: string): string {
    return region.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  formatDate(date: string): string {
    return this._format.formatDate(date);
  }
}
