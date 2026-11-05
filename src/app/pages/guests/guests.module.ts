import { NgModule } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

// Modules
import { GuestsRoutingModule } from '@pages/guests/guests.routing.module';
import { SharedModule } from '@shared/shared.module';
import { MaterialModule } from '@material/material.module';

// Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Services
import { GuestsService } from '@services/guests.service';
import { GeonameService } from '@services/geoname.service';
import { FormatService } from '@services/format.service';

// Components
import { GuestsComponent } from '@pages/guests/guests.component';
import { GuestsCreateComponent } from '@pages/guests/create/guests-create.component';
import { GuestsEditComponent } from '@pages/guests/edit/guests-edit.component';
import { GuestsDetailComponent } from '@pages/guests/detail/guests-detail.component';
import { GuestFormComponent } from '@pages/guests/form/guest-form/guest-form.component';
import { TripFormComponent } from '@pages/guests/form/trip-form/trip-form.component';
import { GuestsFormComponent } from '@pages/guests/form/guests-form/guests-form.component';
import { GuestsTableComponent } from '@pages/guests/table/guests-table.component';
import { GuestsCardsComponent } from '@pages/guests/cards/guests-cards.component';
import { GuestsMapComponent } from '@pages/guests/map/guests-map.component';
import { GuestsStatsComponent } from '@pages/guests/stats/guests-stats.component';
import { GuestRatingChartComponent } from '@pages/guests/stats/charts/rating/guest-rating-chart.component';
import { GuestSummaryChartComponent } from '@pages/guests/stats/charts/summary/guest-summary-chart.component';
import { GuestRankingsChartComponent } from '@pages/guests/stats/charts/ranking/guest-rankings-chart.component';
import { GuestDemographicsChartComponent } from '@pages/guests/stats/charts/demographic/guest-demographics-chart.component';
import { GuestGeographyChartComponent } from '@pages/guests/stats/charts/geography/guest-geography-chart.component';
import { GuestTimelineChartComponent } from '@pages/guests/stats/charts/timeline/guest-timeline-chart.component';
import { GuestGiftsChartComponent } from '@pages/guests/stats/charts/gifts/guest-gifts-chart.component';
import { GuestStaysChartComponent } from '@pages/guests/stats/charts/stays/guest-stays-chart.component';
import { GuestBirthdaysChartComponent } from '@pages/guests/stats/charts/birthdays/guest-birthdays-chart.component';

const MATERIAL_MODULES = [
  MatBadgeModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatSortModule,
  MatTableModule,
  MatRadioModule,
  MatDatepickerModule,
  MatCheckboxModule,
  MatSelectModule,
  MatChipsModule,
  MatAutocompleteModule,
];

@NgModule({
  declarations: [
    GuestsComponent,
    GuestsCreateComponent,
    GuestsEditComponent,
    GuestsDetailComponent,
    GuestFormComponent,
    TripFormComponent,
    GuestsFormComponent,
    GuestsTableComponent,
    GuestsCardsComponent,
    GuestsMapComponent,
    GuestsStatsComponent,
    GuestRatingChartComponent,
    GuestSummaryChartComponent,
    GuestRankingsChartComponent,
    GuestDemographicsChartComponent,
    GuestGeographyChartComponent,
    GuestTimelineChartComponent,
    GuestGiftsChartComponent,
    GuestStaysChartComponent,
    GuestBirthdaysChartComponent,
  ],
  imports: [GuestsRoutingModule, SharedModule, MaterialModule, NgxSkeletonLoaderModule, ...MATERIAL_MODULES],
  providers: [GuestsService, GeonameService, FormatService],
})
export class GuestsModule {}
