import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradingDashboardRouting } from './trading-dashboard-routing';
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { NgApexchartsModule } from "ng-apexcharts";
import { SharedModule } from "../../../../shared/shared.module";
import { TradingDashboardGraphComponent } from './trading-dashboard-graph/trading-dashboard-graph.component';
import { MatToolbarModule } from "@angular/material/toolbar";
import { TradingDashboardBuySellComponent } from './trading-dashboard-buysell/trading-dashboard-buysell.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { BuySellConfirmationDialog } from './trading-dashboard-buysell/confirmation-dialogue.component';
import { RecentNewsModule } from '../../dashboard/recent-news/recent-news.module';
import { HttpClientModule } from '@angular/common/http';
import { OrderNewModule } from '../../oms/order/order.module';
import { TranslateModule } from '@ngx-translate/core';
import { TradingDashboardTabsComponent } from './trading-dashboard-tabs/trading-dashboard-tabs';
import { SymbolTradingDetailsComponent } from './trading-dashboard-tabs/symbol-trading-details/symbol-trading-details';
import { SymbolTradesComponent } from './trading-dashboard-tabs/symbol-trades/symbol-trades';
import { SymbolScheduleComponent } from './trading-dashboard-tabs/symbol-schedule/symbol-schedule';
import { SymbolOverviewComponent } from './trading-dashboard-tabs/symbol-overview/symbol-overview';
import { OrderBookModule } from '../../dashboard/oder-book-dashboard/order-book-dashboard.module';
import { WjCoreModule } from '@grapecity/wijmo.angular2.core';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';
import { WjGridFilterModule } from '@grapecity/wijmo.angular2.grid.filter';
import { WjGridDetailModule } from '@grapecity/wijmo.angular2.grid.detail';
import { AccordionModule } from 'ngx-bootstrap/accordion';

@NgModule({
    declarations: [
        TradingDashboardGraphComponent,
        TradingDashboardBuySellComponent,
        BuySellConfirmationDialog,
        TradingDashboardTabsComponent,

        SymbolTradingDetailsComponent,
        SymbolTradesComponent,
        SymbolScheduleComponent,
        SymbolOverviewComponent
    ],
    exports: [
        TradingDashboardGraphComponent,
        TradingDashboardBuySellComponent,
        BuySellConfirmationDialog,
        TradingDashboardTabsComponent
    ],
    imports: [
        RouterModule.forChild(TradingDashboardRouting),
        CommonModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        NgApexchartsModule,
        SharedModule,
        MatToolbarModule,
        FormsModule,
        MatDialogModule,
        RecentNewsModule,
        HttpClientModule,
        OrderNewModule,
        TranslateModule,
        OrderBookModule,
        WjCoreModule,
        WjInputModule,
        WjGridModule,
        WjGridFilterModule,
        WjGridDetailModule,
        AccordionModule,


    ]
})
export class TradingDashboardModule {
}
