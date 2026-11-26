// guests/stats/stats-labels.service.ts
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FormatService } from '@shared/services/format.service';
import { GENDER_COLORS, getFlagClass, RANKING_COLORS } from '@utils';
import { IChartLegendItem, TChartTooltipContent } from '@type/chart.types';

@Injectable({ providedIn: 'root' })
export class StatsLabelsService {
  private readonly _translate = inject(TranslateService);
  private readonly _format = inject(FormatService);

  // "Ana (Couple)" for groups, "Ana" for solo guests.
  guestName(fullName: string, groupType?: string | null): string {
    if (!groupType || groupType === 'solo') return fullName;

    return this._translate.instant('STATS.COMMON.GROUP_NAME', { name: fullName, group: this.groupType(groupType) });
  }

  // Translated group type, keeping the original value as fallback.
  groupType(groupType?: string | null): string {
    if (!groupType) return '';
    const key = `STATS.COMMON.GROUP_TYPES.${groupType.toUpperCase()}`;
    const label = this._translate.instant(key);

    return label === key ? groupType : label;
  }

  country(code: string): { name: string; flagClass: string } {
    return { name: this._format.formatCountry(code), flagClass: getFlagClass(code) };
  }

  // Bullets with the guest name (and flag) for tooltips.
  guestRows(guests: { fullName: string; hometownCode?: string | null }[]): TChartTooltipContent['rows'] {
    return guests.map(guest => ({
      value: `• ${guest.fullName}`,
      ...(guest.hometownCode ? { country: this.country(guest.hometownCode) } : {}),
    }));
  }

  rankingLegend(): IChartLegendItem[] {
    const entries = [
      ['FIRST', RANKING_COLORS.gold],
      ['SECOND', RANKING_COLORS.silver],
      ['THIRD', RANKING_COLORS.bronze],
      ['OTHERS', RANKING_COLORS.neutral],
    ] as const;

    return entries.map(([key, color]) => ({
      text: this._translate.instant(`STATS.COMMON.RANKING.${key}`),
      background: color.background,
      border: color.border,
    }));
  }

  // Only the genders present in `genders`, always in the same order.
  genderLegend(genders: string[]): IChartLegendItem[] {
    const present = new Set(genders.map(gender => gender.toLowerCase()));

    return (['female', 'male', 'gay', 'trans'] as const)
      .filter(gender => present.has(gender))
      .map(gender => ({
        text: this._format.formatGender(gender),
        background: GENDER_COLORS[gender].background,
        border: GENDER_COLORS[gender].border,
      }));
  }
}
