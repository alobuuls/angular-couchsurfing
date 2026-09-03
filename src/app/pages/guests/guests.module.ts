import { NgModule } from '@angular/core';

// Modules
import { SharedModule } from '@shared/shared.module';
import { GuestsRoutingModule } from '@pages/guests/guests.routing.module';

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
  ],
  imports: [SharedModule, GuestsRoutingModule],
})
export class GuestsModule {}
