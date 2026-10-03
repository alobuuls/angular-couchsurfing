import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Input() messages: string[] = ['Loading', 'Almost there', 'We’re working on it', 'Almost ready', 'Just a moment'];

  currentMessage = '';
  private messageIndex = 0;
  private messageInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
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
