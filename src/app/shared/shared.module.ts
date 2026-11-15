import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Pipes
import { FlagPipe } from '@shared/pipes/three-code-letters-flag.pipe';
import { SocialLinkPipe } from '@shared/pipes/social-link.pipe';

// Components
import { ShTitleComponent } from '@shared/components/sh-title/sh-title.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@NgModule({
  declarations: [FlagPipe, SocialLinkPipe, LoadingComponent, ShTitleComponent, EmptyStateComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, FlagPipe, SocialLinkPipe, LoadingComponent, ShTitleComponent, TranslateModule, EmptyStateComponent],
})
export class SharedModule {}
