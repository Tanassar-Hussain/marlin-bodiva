import {Component} from '@angular/core';
import {AppConstants} from "../../../../../app.utility";

@Component({
    selector: 'app-negotiated-deals-request',
    templateUrl: './negotiated-deals-request.component.html',
})
export class NegotiatedDealsRequestComponent {

    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;
    protected readonly AppConstants = AppConstants;

    constructor() {
    }


}
