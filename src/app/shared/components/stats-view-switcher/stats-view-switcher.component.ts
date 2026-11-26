import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'stats-view-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [ngClass]="containerClass">
      <button
        type="button"
        *ngFor="let view of views"
        [class.active]="view === selected"
        [ngClass]="size === 'small' ? 'stats-nav-btns-small' : 'stats-nav-btns'"
        (click)="selectedChange.emit(view)"
      >
        {{ getLabel(view) | translate }}
      </button>
    </div>
  `,
})
export class StatsViewSwitcherComponent<T extends string = string> {
  @Input({ required: true }) views!: readonly T[];
  @Input({ required: true }) selected!: T;

  // i18n key = labelPrefix + VIEW. `labels` overrides it for views whose key does not follow that rule.
  @Input() labelPrefix = '';
  @Input() labels?: Partial<Record<T, string>>;

  @Input() size: 'main' | 'small' = 'main';
  @Input() containerClass = 'ctn-buttons';

  @Output() selectedChange = new EventEmitter<T>();

  getLabel(view: T): string {
    return this.labels?.[view] ?? this.labelPrefix + view.toUpperCase();
  }
}
