import { Component, OnInit } from '@angular/core';
import {AppConstants} from "../../../../../app.utility";

@Component({
  selector: 'app-rejected-negotiated-deals',
  templateUrl: './rejected-negotiated-deals.component.html',
})
export class RejectedNegotiatedDealsComponent implements OnInit {

    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;
    protected readonly AppConstants = AppConstants;

  constructor() { }

  ngOnInit(): void {
  }

}
