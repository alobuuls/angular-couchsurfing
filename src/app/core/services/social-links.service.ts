import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SocialLinksService {
  openCouchsurfing(profileId: string): void {
    window.open(`https://www.couchsurfing.com/c/users/${profileId}`, '_blank', 'noopener,noreferrer');
  }

  openInstagram(username: string): void {
    window.open(`https://www.instagram.com/${username}`, '_blank', 'noopener,noreferrer');
  }

  openWhatsapp(whatsapp: string): void {
    window.open(`https://wa.me/${whatsapp}`, '_blank', 'noopener,noreferrer');
  }
}
