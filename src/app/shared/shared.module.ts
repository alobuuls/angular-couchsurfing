import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Pipes
import { FlagPipe } from '@shared/pipes/three-code-letters-flag.pipe';

const MATERIAL_MODULES = [
  MatBadgeModule,
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatSortModule,
  MatTableModule,
  MatTooltipModule,
];

const PIPES = [FlagPipe];

@NgModule({
  declarations: [...PIPES],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ...MATERIAL_MODULES],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, ...MATERIAL_MODULES, ...PIPES],
})
export class SharedModule {}
