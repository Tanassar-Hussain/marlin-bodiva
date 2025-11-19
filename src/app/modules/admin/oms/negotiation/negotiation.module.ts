import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import 'bootstrap-markdown/js/bootstrap-markdown.js';
import 'bootstrap-select/dist/js/bootstrap-select.js';
import 'parsleyjs';

import 'bootstrap-colorpicker';
import 'bootstrap-slider/dist/bootstrap-slider.js';
import 'dropzone/dist/dropzone.js';



import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TabsModule } from 'ngx-bootstrap/tabs';


import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';


import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Route, RouterModule } from '@angular/router';


import { WjCoreModule } from '@grapecity/wijmo.angular2.core';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';
import { WjGridFilterModule } from '@grapecity/wijmo.angular2.grid.filter';


import { SharedModule } from 'app/shared.module';
import { WidgetModule } from 'app/layout/widget/widget.module';
import { MarlinCommonModule } from 'app/common.module';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataService } from 'app/services/data.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NegotiatedDealsComponent } from './negotiated-deals/negotiated-deals';
import { NegotiatedDealsListComponent } from './negotiated-deals-list/negotiated-deals-list';
import { NegotiatedEquityInitiateOrderComponent } from './negotiated-deals/negotiated-equity-initiate-order/negotiated-equity-initiate-order';
import { NegotiatedBondInitiateOrderComponent } from './negotiated-deals/negotiated-bond-initiate-order/negotiated-bond-initiate-order';
import { NegotiatedEquityDealsListComponent } from './negotiated-deals-list/negotiated-equity-deals-list/negotiated-equity-deals-list';
import { NegotiatedBondDealsListComponent } from './negotiated-deals-list/negotiated-bond-deals-list/negotiated-bond-deals-list';
import { NegotiatedETFDealsListComponent } from './negotiated-deals-list/negotiated-ETF-deals-list/negotiated-ETF-deals-list';
import { NegotiatedEquityAcceptOrderComponent } from './negotiated-deals/negotiated-equity-accpet-order/negotiated-equity-accept-order';
import { NegotiatedBondAcceptOrderComponent } from './negotiated-deals/negotiated-bond-accpet-order/negotiated-bond-accept-order';
import { NegotiatedETFInitiateOrderComponent } from './negotiated-deals/negotiated-etf-initiate-order/negotiated-etf-initiate-order';
import { NegotiatedETFAcceptOrderComponent } from './negotiated-deals/negotiated-etf-accept-order/negotiated-etf-accept-order';
import { NegotiatedInvestorDealsListComponent } from './negotiated-Investor-deals-list/negotiated-investor-deals-list';
import { NegotiatedInvestorEquityDealsListComponent } from './negotiated-Investor-deals-list/negotiated-investor-equity-deals-list/negotiated-investor-equity-deals-list';
import { NegotiatedInvestorBondDealsListComponent } from './negotiated-Investor-deals-list/negotiated-investor-bond-deals-list/negotiated-investor-bond-deals-list';
import { NegotiatedInvestorETFDealsListComponent } from './negotiated-Investor-deals-list/negotiated-investor-ETF-deals-list/negotiated-investor-ETF-deals-list';
import { NegotiatedDealsRequestComponent } from './negotiated-deals-request/negotiated-deals-request.component';
import { RejectedNegotiatedDealsComponent } from './rejected-negotiated-deals/rejected-negotiated-deals.component';
  
import { AcceptRejectPendingOrderComponent } from './negotiated-deals-request/negotiated-deals-request-list/accept-reject-pending-order/accept-reject-pending-order.component';
import { RejectedNegotiatedDealsListComponent } from './rejected-negotiated-deals/rejected-negotiated-deals-list/rejected-negotiated-deals-list.component';
import { NegotiatedDealsRequestListComponent } from './negotiated-deals-request/negotiated-deals-request-list/negotiated-deals-request-list.component';
// import { NegotiatedBondOrderComponent } from './negotiated-deals/bonds-negotiated-order-new/bonds-negotiated-order-new';


export const negotiationRoutes = [

  { path: 'negotiated-deals-list', component: NegotiatedDealsListComponent, },
  { path: 'negotiated-investor-deals-list', component: NegotiatedInvestorDealsListComponent, },
  {path: 'pending-negotiated-deals', component: NegotiatedDealsRequestComponent, },
  {path: 'rejected-negotiated-deals', component: RejectedNegotiatedDealsComponent}
];

@NgModule({
  imports: [
    CommonModule,
    WidgetModule,
    FormsModule,
    ReactiveFormsModule,
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
    WjCoreModule,
    WjInputModule,
    WjGridModule,
    TabsModule,
    WjGridFilterModule,
    AccordionModule,
    AlertModule,
    MarlinCommonModule,
    SharedModule,
    TranslateModule,
    RouterModule.forChild(negotiationRoutes)
  ],

  declarations: [
    NegotiatedDealsComponent,
    NegotiatedDealsListComponent,

    NegotiatedEquityInitiateOrderComponent,
    NegotiatedEquityAcceptOrderComponent,

    NegotiatedBondAcceptOrderComponent,
    NegotiatedBondInitiateOrderComponent,

    NegotiatedETFInitiateOrderComponent,
    NegotiatedETFAcceptOrderComponent,

    NegotiatedDealsListComponent,
    NegotiatedBondDealsListComponent,
    NegotiatedEquityDealsListComponent,
    NegotiatedETFDealsListComponent,
    // ...................................... For Investor.......................//
    NegotiatedInvestorDealsListComponent,
    NegotiatedInvestorEquityDealsListComponent,
    NegotiatedInvestorBondDealsListComponent,
    NegotiatedInvestorETFDealsListComponent,
    NegotiatedDealsRequestComponent,
    NegotiatedDealsRequestListComponent,
    AcceptRejectPendingOrderComponent,
    RejectedNegotiatedDealsComponent,
    RejectedNegotiatedDealsListComponent
    // ...................................... For Investor.......................//
  ],
  exports: [
    NegotiatedDealsComponent,
    NegotiatedDealsListComponent,

    NegotiatedEquityInitiateOrderComponent,
    NegotiatedBondInitiateOrderComponent,
    NegotiatedETFInitiateOrderComponent,

    NegotiatedEquityAcceptOrderComponent,
    NegotiatedBondAcceptOrderComponent,
    NegotiatedETFAcceptOrderComponent
  ],
  providers: [
    DataServiceOMS,
    ListingService,
    OrderService,
  ]

})
export class NegotiationModule {
  // static routes = routes;
}



