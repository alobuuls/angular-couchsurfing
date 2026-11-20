import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Pipes
import { FlagPipe } from '@shared/pipes/two-code-letters-flag.pipe';
import { SocialLinkPipe } from '@shared/pipes/social-link.pipe';

// Components
import { ShTitleComponent } from '@shared/components/sh-title/sh-title.component';
import { ShProgressBarComponent } from '@shared/components/progress-bar/progress-bar.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

const components = [ShTitleComponent, ShProgressBarComponent, LoadingComponent, EmptyStateComponent];

@NgModule({
  declarations: [FlagPipe, SocialLinkPipe, ...components],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, FlagPipe, SocialLinkPipe, TranslateModule, ...components],
  providers: [FlagPipe],
})
export class SharedModule {}
