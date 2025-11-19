import { Component } from '@angular/core';
import {AppConstants} from "../../../../../app.utility";

export enum PendingOrderAction {
    EDIT = 'EDIT',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    CANCEL = 'CANCEL'
}

@Component({
  selector: 'app-pending-orders',
  templateUrl: './pending-orders.component.html',
  styleUrls: ['./pending-orders.component.scss']
})

export class PendingOrdersComponent{


    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;

    constructor() { }


    protected readonly AppConstants = AppConstants;
}

