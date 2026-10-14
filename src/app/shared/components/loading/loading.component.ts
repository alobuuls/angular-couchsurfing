import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Input() messages: string[] = [];

  @Input() compact = false;

  currentMessage = '';
  private messageIndex = 0;
  private messageInterval?: ReturnType<typeof setInterval>;

  private _translate = inject(TranslateService);

  ngOnInit(): void {
    if (!this.messages.length) {
      this.messages = [
        this._translate.instant('LOADING.MESSAGES.INITIAL'),
        this._translate.instant('LOADING.MESSAGES.ALMOST_THERE'),
        this._translate.instant('LOADING.MESSAGES.WORKING'),
        this._translate.instant('LOADING.MESSAGES.ALMOST_READY'),
        this._translate.instant('LOADING.MESSAGES.JUST_A_MOMENT'),
      ];
    }

    this.changeLoadingMs();
  }

  private changeLoadingMs(): void {
    if (!this.messages.length) {
      return;
    }
    this.currentMessage = this.messages[0];

    if (this.messages.length > 1) {
      this.messageInterval = setInterval(() => {
        this.messageIndex = (this.messageIndex + 1) % this.messages.length;
        this.currentMessage = this.messages[this.messageIndex];
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
  }
}
