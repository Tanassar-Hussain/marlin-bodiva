import { Component, OnInit } from '@angular/core';
import {AppConstants} from "../../../../../app.utility";

@Component({
  selector: 'app-rejected-orders',
  templateUrl: './rejected-orders.component.html',
})
export class RejectedOrdersComponent implements OnInit {

    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;
    protected readonly AppConstants = AppConstants;

  constructor() { }

  ngOnInit(): void {
  }

}
