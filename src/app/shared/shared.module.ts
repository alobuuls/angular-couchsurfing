import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Pipes
import { FlagPipe } from '@shared/pipes/three-code-letters-flag.pipe';

// Components
import { ShTitleComponent } from '@shared/components/sh-title/sh-title.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@NgModule({
  declarations: [FlagPipe, LoadingComponent, ShTitleComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, FlagPipe, LoadingComponent, ShTitleComponent, TranslateModule],
})
export class SharedModule {}
