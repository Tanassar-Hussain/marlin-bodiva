import { Component } from '@angular/core';
import {AppConstants} from "../../../../../app.utility";

export enum OfflineOrderAction {
    EDIT = 'EDIT',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    CANCEL = 'CANCEL'
}

@Component({
  selector: 'app-offline-orders',
  templateUrl: './offline-orders.component.html',
  styleUrls: ['./offline-orders.component.scss']
})

export class OfflineOrdersComponent{


    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;

    constructor() { }


    protected readonly AppConstants = AppConstants;
}

