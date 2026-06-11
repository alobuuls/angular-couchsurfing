import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NotFoundComponent } from '@pages/404/not-found.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AppComponent, NotFoundComponent],
  imports: [BrowserModule, RouterModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
