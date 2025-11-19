'use strict';
import { Component, OnInit, ViewEncapsulation, ViewChild, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AppState } from 'app/app.service';
import { AppUtility } from 'app/app.utility';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';

@Component({

  selector: 'payment-schedule',
  templateUrl: './payment-schedule.html',
  encapsulation: ViewEncapsulation.None,
})

export class PaymentScheduleComponent implements OnInit, OnChanges {

  public showLoader: boolean = false;
  public myForm: FormGroup;
  private _pageSize = 0;

  @Input() securityCode: any;
  @Input() buttonClicked: any;

  @ViewChild('settlementGrid') settlementGrid: wjcGrid.FlexGrid;
  @ViewChild('tradeDate') tradeDate: wjcInput.InputDate;
  @ViewChild('dialogCmp') dialogCmp: DialogCmp;

  lang: string;
  hideForm: boolean;
  generate: boolean;
  bondPaymentScheduleArr: wjcCore.CollectionView;
  securityId: number

  constructor(private listingService: ListingService, public userService: AuthService2, private translate: TranslateService, private _changeDetectorRef: ChangeDetectorRef, private loader: FuseLoaderScreenService) {
    this.hideForm = false;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ng2translate__________________________________________
  }

  ngOnChanges() {
    if (AppUtility.isValidVariable(this.securityCode) && this.securityCode != '' && this.buttonClicked)
      this.onView(this.securityCode)
  }

  ngOnInit() {
  }

  /*********************************
 *      Public & Action Methods
 *********************************/

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    if (this._pageSize != value) {
      this._pageSize = value;
      if (this.settlementGrid) {
        (<wjcCore.IPagedCollectionView>this.settlementGrid.collectionView).pageSize = value;
      }
    }
  }

  /***************************************
 *          Private Methods
 **************************************/

  onView(securityCode): void {
    this.loader.show();
    this.listingService.getSecurityId(this.securityCode).subscribe(res => {
      this.securityId = res.securityId;
      this.generate = false
      this.bondPaymentScheduleArr = new wjcCore.CollectionView();
      this.listingService.getPaymentScheduleForSecurity(this.securityId, this.generate).subscribe((restData) => {
        restData.pop()
        if (restData.length) {
          setTimeout(() => {
            this.bondPaymentScheduleArr = new wjcCore.CollectionView(restData);
            this._changeDetectorRef.detectChanges();
            this.loader.hide();
          }, 500);
        } else {
          this.loader.hide();
          this.dialogCmp.statusMsg = 'No Data Found';
          this.dialogCmp.showAlartDialog('Error');
        }

      }, (error) => {
        this.loader.hide();
        this.dialogCmp.statusMsg = 'Something Went Wrong';
        this.dialogCmp.showAlartDialog('Error');
      });
    })
  }
}