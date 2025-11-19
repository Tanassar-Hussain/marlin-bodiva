import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { PendingOrdersComponent } from './pending-orders/pending-orders.component';
import { RouterModule, Routes } from '@angular/router';
 
import { WjCoreModule } from '@grapecity/wijmo.angular2.core';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';
import { WjGridFilterModule } from '@grapecity/wijmo.angular2.grid.filter';
import {SharedModule} from "../../../../shared/shared.module";
import {TranslateModule} from "@ngx-translate/core";
import { EquityEtfPendingOrderActionComponent } from './pending-orders/pending-orders-list/pending-order-action-dialog/equity-etf-pending-order-action/equity-etf-pending-order-action.component';
import {
    PendingOrderActionDialogComponent
} from "./pending-orders/pending-orders-list/pending-order-action-dialog/pending-order-action-dialog.component";
import {AlertModule} from "ngx-bootstrap/alert";
import { BondPendingOrderActionComponent } from './pending-orders/pending-orders-list/pending-order-action-dialog/bond-pending-order-action/bond-pending-order-action.component';
import {AccordionModule} from "ngx-bootstrap/accordion";
import { PendingOrdersListComponent } from './pending-orders/pending-orders-list/pending-orders-list.component';
import { DialogCmp } from '../../back-office/user-site/dialog/dialog.component';
import { DialogCmpWatch } from '../dialog-component';
import { TradingReportsModule } from '../reports/reports.module';
import { DialogCmpOrders } from './dialog/dialog.component';


const routes: Routes = [
    {path: 'pending-orders', component: PendingOrdersComponent},
];

@NgModule({
  declarations: [
    PendingOrdersComponent,
    PendingOrdersListComponent,
    PendingOrderActionDialogComponent,
    EquityEtfPendingOrderActionComponent,
    BondPendingOrderActionComponent,
    DialogCmpOrders
  ],
  
    imports: [
        WjCoreModule,
        WjInputModule,
        WjGridModule,
        WjGridFilterModule,
        SharedModule,
        TranslateModule,
        RouterModule.forChild(routes),
        AlertModule,
        AccordionModule,
        TradingReportsModule
       
    ]
})
export class OrdersModule { }
