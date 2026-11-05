import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { MainRoutingModule } from '@main/main.routing.module';

// Components
import { MainLayoutComponent } from '@main/main-layout.component';
import { MenuComponent } from '@main/menu/menu.component';
import { FooterComponent } from '@main/footer/footer.component';
import { MaterialModule } from '@material/material.module';

@NgModule({
  declarations: [MainLayoutComponent, MenuComponent, FooterComponent],
  imports: [SharedModule, MaterialModule, MainRoutingModule],
})
export class MainModule {}
