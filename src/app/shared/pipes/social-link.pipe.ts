import { Pipe, PipeTransform } from '@angular/core';

export type SocialNetwork = 'instagram' | 'couchsurfing' | 'whatsapp';

const SOCIAL_LINKS: Record<SocialNetwork, string> = {
  instagram: 'https://www.instagram.com',
  couchsurfing: 'https://www.couchsurfing.com/c/users',
  whatsapp: 'https://wa.me',
};

@Pipe({
  name: 'socialLink',
})
export class SocialLinkPipe implements PipeTransform {
  transform(value: string | null | undefined, network: SocialNetwork): string {
    const baseUrl = SOCIAL_LINKS[network];
    if (!value?.trim()) return baseUrl;
    return `${baseUrl}/${value.trim().replace(/^\/+|\/+$/g, '')}`;
  }
}
