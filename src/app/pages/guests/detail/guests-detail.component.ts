import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { GuestsService } from '@services/guests.service';
import { GeonameService } from '@services/geoname.service';

// Const
import { LINK_BASE_COUCHSURFING, LINK_BASE_INSTAGRAM, LINK_BASE_WHATSAPP } from '@config/social/social-links';

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

  // Urls Base social media
  linkBaseCouchsurfing: string = LINK_BASE_COUCHSURFING;
  linkBaseInstagram: string = LINK_BASE_INSTAGRAM;
  linkBaseWhatsapp: string = LINK_BASE_WHATSAPP;

  _format = inject(FormatService);
  private route = inject(ActivatedRoute);
  private _guests = inject(GuestsService);
  private readonly _geoname = inject(GeonameService);
  private readonly _router = inject(Router);

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

  formatRegion(region: string): string {
    return region.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  formatDate(date: string): string {
    return this._format.formatDate(date);
  }

  // NAVIGATE BACK WITH VIEW TRANSITION
  async goBack(): Promise<void> {
    // Get the previous URL stored when navigating to the guest detail.
    // If no previous URL exists, redirect to /guests.
    const returnUrl = history.state?.returnUrl || '/guests';

    // Extend the Document type to include the native View Transitions API.
    // The optional (?) indicates that the browser might not support this API.
    const documentWithTransitions = document as Document & {
      startViewTransition?: (callback: () => Promise<void>) => {
        finished: Promise<void>;
      };
    };

    // FALLBACK: Navigate normally if the browser does not support View Transitions.
    if (!documentWithTransitions.startViewTransition) {
      await this._router.navigateByUrl(returnUrl);
      return;
    }

    // Add the backward class to <html> to trigger the reverse CSS animations.
    const root = document.documentElement;
    root.classList.add('backward');

    try {
      // Start the View Transition and navigate to the previous URL.
      const transition = documentWithTransitions.startViewTransition(async () => {
        await this._router.navigateByUrl(returnUrl);
      });

      // Wait until the visual transition finishes.
      await transition.finished;
    } finally {
      // Remove the backward class to prevent it from affecting future navigations.
      root.classList.remove('backward');
    }
  }
}
