'use strict';
import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter, ElementRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

// import * as moment from 'moment-timezone';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Exchange } from 'app/models/exchange';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';


import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { IPagedCollectionView, } from '@grapecity/wijmo';
import { ClientLevieDetail } from 'app/models/client-levy-detail';

import { TraansactionTypesExchange } from 'app/models/traansaction-type-exchange';
import { ClientLevieMaster } from 'app/models/client-levy-master';
import { Participant } from 'app/models/participant';
import { VoucherType } from 'app/models/voucher-type';
import { ChartOfAccount } from 'app/models/chart-of-account';
import { BasicInfo } from 'app/models/basic-info';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { LevieDetail } from 'app/models/levy-detail';
import { AssetClass } from 'app/models/asset_class';
import { Market } from 'app/models/market';
import { BondCategory } from 'app/models/bond-category';
import { BondSubCategory } from 'app/models/bond-sub-category';
import { BondType } from 'app/models/bond-type';
import { ComboItem } from 'app/models/combo-item';
import { LevyCategory } from 'app/models/levyCategory';
import { BondNature } from 'app/models/bondNature';
import { TranslocoModule } from '@ngneat/transloco';
import { BondEventLog } from 'app/modules/admin/oms/reports/bond-event-log/bond-event-log';
import { DatePipe } from '@angular/common';
import { ClientAppliedLevy } from 'app/models/client-applied-levy';
import { ivaLeviesMaster } from 'app/models/ivaLeviesMaster';

declare var jQuery: any;
//import 'slim_scroll/jquery.slimscroll.js';

@Component({

  selector: 'client-levies-page',
  templateUrl: './client-levies-page.html',

  encapsulation: ViewEncapsulation.None,
})

export class ClientLeviePage implements OnInit {
  private showLoader: boolean = false;
  public static _exchangeid: Number;
  private static searchButtonDisabled: String = 'btn btn-success btn-sm disabled';
  private static searchButtonEnabled: String = 'btn btn-success btn-sm';
  private static lowerRangeMax: Number = 999999.9998;
  public myForm: FormGroup;
  itemsList: wjcCore.CollectionView;        // A list which will bind to the flex grid of Page.
  detailList: wjcCore.CollectionView;   // A list which will bind to the flex grid of Modal.
  selectedItem: LevieDetail;  // The Master Item
  selectedDetailItem: LevieDetail;    // The Detail Item
  modal = true;

  errorMessage: string;
  exchangeNameList: any[];
  transactionTypeList: any[];
  appliesToList: any[];
  appliesToListTrade: any[];
  appliesToListPayment: any[];
  voucherTypeList: any[];
  chartOfAccountList: any[];
  levyTypeList: any[];
  levelList: any[];
  recurrenceList: any[];
  today: Date = new Date();
  todayNewDate: Date = new Date();
  public hideForm = false;
  public isSubmitted: boolean;
  public isEditing: boolean;
  public isParentDisabled: boolean;
  public LevyRateError: Boolean;
  public isDetailEditing: boolean;
  public addingNew: boolean;
  public finalSaveUpdate: boolean;
  public maxLevyRate: number;
  public disabled: String;
  public levyRateLabelModalDisplay: String;

  private isNotUnique: boolean;
  private _pageSize = 0;

  public disabledCheckbox: Boolean = true;
  allTransTypes: Boolean = false;
  //claims: any;

  @ViewChild('LevyDeleteDlg', { static: false }) LevyDeleteDlg: wjcInput.Popup;
  @ViewChild('flex') flex: wjcGrid.FlexGrid;
  @ViewChild('flexDetail') flexDetail: wjcGrid.FlexGrid;
  @ViewChild('levyRate') levyRateControl: wjcInput.InputNumber;
  @ViewChild('exchangeName') exchangeName: wjcInput.ComboBox;

  @ViewChild('bondCategoryId') bondCategoryId: wjcInput.ComboBox;
  @ViewChild('bondTypeId') bondTypeId: wjcInput.ComboBox;
  @ViewChild('bondNatureId') bondNatureId: wjcInput.ComboBox;
  @ViewChild('assetClass') assetClass: wjcInput.ComboBox;
  @ViewChild('transactionType') transactionTypeControl: wjcInput.MultiSelect;
  @ViewChild('levyModeId') levyModeId: wjcInput.ComboBox;
  @ViewChild('appliesTo') appliesTo: wjcInput.MultiSelect;
  @ViewChild('cmbLevy') cmbLevy: wjcInput.MultiSelect;
  @ViewChild('dialogCmp') dialogCmp: DialogCmp;
  @ViewChild('updateBtn') updateBtn: ElementRef;
  @ViewChild('saveBtn') saveBtn: ElementRef;

  lang: string;
  assetClassList: any[] = [];
  marketList: any[] = [];
  bondCategoryList: any[] = [];
  bondSubCategoryList: any[] = [];
  bondTypeList: any[] = [];
  levyModeList: any[] = [];
  valueTypeList: any[] = [];
  slabRangeList: any[] = [];
  isBondFieldsRequired: boolean = false;
  appliesToListVault: any[] = [];
  levyCategories: any[] = [];
  bondNatureList: any;
  isTransactionType: boolean = false;
  selectedExchangeId: any;
  isRepo: boolean = false;
  isDebt: boolean = true;
  isPercentageOnLevies : boolean = false;
  leviesList: any[] = [];
  selectedLevies: any[] = [];
  selectedLeviesIds: any[] = [];
  isIVL : boolean = false;
  statusMsg : string = AppConstants.MSG_CONFIRM_RECORD_DELETION;
  deleteItemId: number = null;
  // public tabFocusChanged() {
  //   if (this.isEditing)
  //     this.updateBtn.nativeElement.focus();
  //   else
  //     this.saveBtn.nativeElement.focus();
  // }

  constructor(private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2, public datePipe: DatePipe,
    private translate: TranslateService, private loader: FuseLoaderScreenService) {





    this.levyTypeList = [
      {
        'value': AppConstants.PLEASE_SELECT_STR,
        'abbreviation': AppConstants.PLEASE_SELECT_VAL
      },
      {
        'value': AppConstants.FIXED_STRING,
        'abbreviation': AppConstants.FIXED_ABBREVIATION
      },
      {
        'value': AppConstants.PERCENTAGE_STRING,
        'abbreviation': AppConstants.PERCENTAGE_ABBREVIATION
      },
      {
        'value': AppConstants.PERCENTAGE_ON_COMMISSION_STRING,
        'abbreviation': AppConstants.PERCENTAGE_ON_COMMISSION_ABBREVIATION
      },
      {
        'value': AppConstants.PERCENTAGE_ON_BADLA_STRING,
        'abbreviation': AppConstants.PERCENTAGE_ON_BADLA_ABBREVIATION
      },
      {
        'value': AppConstants.PERCENTAGE_ON_DELIVERY_STRING,
        'abbreviation': AppConstants.PERCENTAGE_ON_DELIVERY_ABBREVIATION
      }
    ];


    this.slabRangeList = [
      {
        'label': AppConstants.PLEASE_SELECT_STR,
        'value': AppConstants.PLEASE_SELECT_VAL
      },
      {
        'label': 'Days',
        'value': 'D',
      },

    ];





    this.clearFields(true, true);
    this.hideForm = false;
    this.isSubmitted = false;
    this.isEditing = false;
    this.today = new Date();
    this.today.setDate(this.today.getDate() + 1);

    this.todayNewDate = new Date();

    this.disabledCheckbox = false;
    //this.claims = authService.claims;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________
  }
  ngOnInit() {

    jQuery('.parsleyjs').parsley();




    /////////////////////////////////////////
    /////////MultiLingual Frontend Lists////
    //////////////////////////////////////// 
    this.getRecurrenceList();
    this.getLevelList();
    this.getLevyModeList();
    this.getApplyToListTrade();
    this.getApplyToListPayment();
    this.getApplyToListVault();
    this.getValueTypeList();
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////


    this.populateLevyCategory();
    this.populateClientLevieMasterList();
    this.populateVoucherTypeList();
    this.populateChartOfAccountList();
    this.loadAssetClassList();
    this.populateBondCategoryList();
    this.populateBondTypeList();
    this.populateBondNature();
    this.loadLeveisByParticipant();


    this.clearFields(true, true);
    this.populateExchangeList();
    this.addFormValidations();


     



  }

  public ngAfterViewInit() {

    var self = this;
    $('#add_new').on('shown.bs.modal', function () {
      wjcGrid.FlexGrid.invalidateAll();
      self.exchangeName.focus();
    });

    this.flexDetail.invalidate();

  }

  /*********************************
 *      Public & Action Methods
 *********************************/


  public deleteLeviesDetailById = () => {
       if(AppUtility.isValidVariable(this.deleteItemId)){
         this.listingService.deleteLeviesDetailById(this.deleteItemId).subscribe((res : any)=>{
              
                if(AppUtility.isValidVariable(this.selectedItem.leviesMaster)){
                  this.getClientLevieDetailList(this.selectedItem.leviesMaster.leviesMasterId);
                }
               
         }, (error : any) => {
            console.log(error);
         })
       }
  }



  public onDeleteIVL(item : any){
    this.deleteItemId = item.leviesDetailId;
    this.statusMsg  = AppConstants.MSG_CONFIRM_RECORD_DELETION;
    this.showDialog(this.LevyDeleteDlg);
  }

  showDialog(dlg: wjcInput.Popup) {
    if (dlg) {
      let inputs = <NodeListOf<HTMLInputElement>>dlg.hostElement.querySelectorAll('input');
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].type !== 'checkbox') {
          inputs[i].value = '';
        }
      }

      dlg.modal = this.modal;
      dlg.hideTrigger = dlg.modal ? wjcInput.PopupTrigger.None : wjcInput.PopupTrigger.Blur;

      dlg.show();
    }
  };


  loadLeveisByParticipant(): void {
    this.listingService.getLeviesByBroker(AppConstants.participantId).subscribe(
      (data : any[]) => {
        this.leviesList = [];
        if (AppUtility.isValidVariable(data) && !AppUtility.isEmptyArray(data)) {
           data.filter((element) => {
             if(AppUtility.isValidVariable(element) && AppUtility.isValidVariable(element.levyCategories) 
             && element.levyCategories.Code !== "IVL") {
                  this.leviesList.push(element);     
             }
          })
        }
      },

      error => this.errorMessage = <any>error.message);
  }

 

  private selectedAppliedLevy() {
     
    var items: String[] = [];
    this.selectedLevies = [];
    if (AppUtility.isValidVariable(this.cmbLevy)) {
      if (this.cmbLevy.checkedItems.length > 0) {
        if (this.cmbLevy.checkedItems[0].leviesMasterId == "-1") {
          for (let i = 1; i < this.leviesList.length; i++) {
            items.push(this.leviesList[i].leviesMasterId);
          }
        }
        else {
          for (let selectedAppLevies of this.cmbLevy.checkedItems) {
            items.push(selectedAppLevies.leviesMasterId);
          }
        }
      }
    }

    this.selectedLevies = items;
  }






  public onChangeLevyCategory = (event) => {

    if (AppUtility.isValidVariable(event)) {
      if (event === AppConstants.LEVY_CATEGORY_SETTLEMENT_ID || event === AppConstants.LEVY_CATEGORY_TRADING_ID || event === AppConstants.LEVY_CATEGORY_IVA_ID) {
        this.isIVL = false;
        this.assetClass.isDisabled = false;
        this.transactionTypeControl.isDisabled = false;
        this.levyModeId.isDisabled = false;
        this.appliesTo.isDisabled = false;


        this.selectedDetailItem.asset.assetId = null;
        this.selectedDetailItem.bondCategory.categoryId = null;
        this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
        this.transactionTypeControl.checkedItems = [];
        this.selectedDetailItem.bondNature.bondNatureId = null;
        this.selectedDetailItem.levyMode = null;
        this.selectedDetailItem.appliedTo = null;

        this.disabledCheckbox = true;
        this.isTransactionType = true;
        this.getValueTypeList();

      }
      else if (event === AppConstants.LEVY_CATEGORY_IVL_ID) {

        this.isIVL = true;       
        this.assetClass.isDisabled = true;
        this.transactionTypeControl.isDisabled = true;
        this.levyModeId.isDisabled = true;
        this.appliesTo.isDisabled = true;
        this.disabledCheckbox = false;
        this.isTransactionType = false;

        this.selectedDetailItem.asset.assetId = null;
        this.selectedDetailItem.bondCategory.categoryId = null;
        this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
        this.transactionTypeControl.checkedItems = [];
        this.selectedDetailItem.bondNature.bondNatureId = null;
        this.selectedDetailItem.levyMode = null;
        this.selectedDetailItem.appliedTo = null;
        this.myForm.get('transactionType').clearValidators();
        this.getValueTypeListIVA();

      }
     
      else if (event === AppConstants.PLEASE_SELECT_VAL) {
        this.isIVL = false;
        this.assetClass.isDisabled = true;
        this.transactionTypeControl.isDisabled = true;
        this.levyModeId.isDisabled = true;
        this.appliesTo.isDisabled = true;
        this.disabledCheckbox = false;
        this.isTransactionType = false;

        this.selectedDetailItem.asset.assetId = null;
        this.selectedDetailItem.bondCategory.categoryId = null;
        this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
        this.transactionTypeControl.checkedItems = [];
        this.selectedDetailItem.bondNature.bondNatureId = null;
        this.selectedDetailItem.levyMode = null;
        this.selectedDetailItem.appliedTo = null;


        this.myForm.get('transactionType').clearValidators();
        this.getValueTypeList();

      }
      else {
        this.isIVL = false;
        this.assetClass.isDisabled = true;
        this.transactionTypeControl.isDisabled = true;
        this.levyModeId.isDisabled = true;
        this.appliesTo.isDisabled = true;
        this.disabledCheckbox = false;
        this.isTransactionType = false;

        this.selectedDetailItem.asset.assetId = null;
        this.selectedDetailItem.bondCategory.categoryId = null;
        this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
        this.transactionTypeControl.checkedItems = [];
        this.selectedDetailItem.bondNature.bondNatureId = null;
        this.selectedDetailItem.levyMode = null;
        this.selectedDetailItem.appliedTo = null;


        this.myForm.get('transactionType').clearValidators();
        this.getValueTypeList();

      }
    }
  }



  public getRecurrenceList = () => {
    let recurrenceArray = [];
    this.recurrenceList = [];
    this.translate.get(['Translation.Select', 'Translation.Annual', 'Translation.Bi-Annually', 'Translation.Quarterly',
      'Translation.Monthly', 'Translation.One time', 'Translation.Per Transaction']).subscribe((res: any) => {
        recurrenceArray.push(res['Translation.Select']);
        recurrenceArray.push(res['Translation.Annual']);
        recurrenceArray.push(res['Translation.Bi-Annually']);
        recurrenceArray.push(res['Translation.Quarterly']);
        recurrenceArray.push(res['Translation.Monthly']);
        recurrenceArray.push(res['Translation.One time']);
        recurrenceArray.push(res['Translation.Per Transaction']);

        let recurrenceValueArr = [null, 'A', 'BA', 'Q', 'M', 'OT', 'PT'];
        let recCmbList = [];
        let cmbItem: ComboItem;
        for (let i = 0; i < recurrenceArray.length; i++) {
          cmbItem = new ComboItem(recurrenceArray[i], recurrenceValueArr[i]);
          recCmbList[i] = cmbItem;
        }
        this.recurrenceList = recCmbList;

      })
  }





  public getLevelList = () => {
    let levelArray = [];
    this.levelList = [];
    this.translate.get(['Translation.Select', 'Translation.Participant', 'Translation.Client']).subscribe((res: any) => {
      levelArray.push(res['Translation.Select']);
      levelArray.push(res['Translation.Participant']);
      levelArray.push(res['Translation.Client']);

      let levelValueArr = [null, 'P', 'C'];
      let levelCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < levelArray.length; i++) {
        cmbItem = new ComboItem(levelArray[i], levelValueArr[i]);
        levelCmbList[i] = cmbItem;
      }
      this.levelList = levelCmbList;

    })
  }







  public getLevyModeList = () => {
    let levyModeArray = [];
    this.levyModeList = [];
    this.translate.get(['Translation.Select', 'Translation.Trade', 'Translation.Payment', 'Translation.Vault Transaction']).subscribe((res: any) => {
      levyModeArray.push(res['Translation.Select']);
      levyModeArray.push(res['Translation.Trade']);
      levyModeArray.push(res['Translation.Payment']);
      levyModeArray.push(res['Translation.Vault Transaction']);

      let levyModeValueArr = [null, 'T', 'P', 'V'];
      let levyModeCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < levyModeArray.length; i++) {
        cmbItem = new ComboItem(levyModeArray[i], levyModeValueArr[i]);
        levyModeCmbList[i] = cmbItem;
      }
      this.levyModeList = levyModeCmbList;
      this.levyModeId.isDisabled = true;

    })
  }


  public getApplyToListTrade = () => {
    let applyToTradeArray = [];
    this.appliesToListTrade = [];
    this.translate.get(['Translation.Select', 'Translation.Buy', 'Translation.Sell', 'Translation.Both']).subscribe((res: any) => {
      applyToTradeArray.push(res['Translation.Select']);
      applyToTradeArray.push(res['Translation.Buy']);
      applyToTradeArray.push(res['Translation.Sell']);
      applyToTradeArray.push(res['Translation.Both']);

      let levyApplyToTradeValueArr = [null, AppConstants.BUY_ABBREVIATION, AppConstants.SELL_ABBREVIATION, AppConstants.BOTH_ABBREVIATION];
      let levyApplyToCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < applyToTradeArray.length; i++) {
        cmbItem = new ComboItem(applyToTradeArray[i], levyApplyToTradeValueArr[i]);
        levyApplyToCmbList[i] = cmbItem;
      }
      this.appliesToListTrade = levyApplyToCmbList;
      this.appliesTo.isDisabled = true;
    })
  }



  public getApplyToListPayment = () => {
    let applyToPaymentArray = [];
    this.appliesToListPayment = [];
    this.translate.get(['Translation.Select', 'Translation.Coupon', 'Translation.Reimbursement', 'Translation.Both']).subscribe((res: any) => {
      applyToPaymentArray.push(res['Translation.Select']);
      applyToPaymentArray.push(res['Translation.Coupon']);
      applyToPaymentArray.push(res['Translation.Reimbursement']);
      applyToPaymentArray.push(res['Translation.Both']);

      let levyApplyToPaymentValueArr = [null, 'C', 'R', 'CR'];
      let levyApplyToCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < applyToPaymentArray.length; i++) {
        cmbItem = new ComboItem(applyToPaymentArray[i], levyApplyToPaymentValueArr[i]);
        levyApplyToCmbList[i] = cmbItem;
      }
      this.appliesToListPayment = levyApplyToCmbList;
      this.appliesTo.isDisabled = true;

    })
  }


  public getApplyToListVault = () => {
    let applyToVaultArray = [];
    this.appliesToListVault = [];
    this.translate.get(['Translation.Select', 'Translation.Deposit', 'Translation.Withdrawal', 'Translation.Both']).subscribe((res: any) => {
      applyToVaultArray.push(res['Translation.Select']);
      applyToVaultArray.push(res['Translation.Deposit']);
      applyToVaultArray.push(res['Translation.Withdrawal']);
      applyToVaultArray.push(res['Translation.Both']);

      let levyApplyToVaultValueArr = [null, 'D', 'W', 'DW'];
      let levyApplyToCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < applyToVaultArray.length; i++) {
        cmbItem = new ComboItem(applyToVaultArray[i], levyApplyToVaultValueArr[i]);
        levyApplyToCmbList[i] = cmbItem;
      }
      this.appliesToListVault = levyApplyToCmbList;
      this.appliesTo.isDisabled = true;
    })
  }



  public getValueTypeList = () => {
    let valueTypeArray = [];
    let valueTypeFixedArray = [];
    this.valueTypeList = [];
    this.translate.get(['Translation.Select', 'Translation.Fixed', 'Translation.Percentage on gross amount', 
      'Translation.Percentage on commission', 'Translation.Percentage on clean amount']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Fixed']);
      valueTypeArray.push(res['Translation.Percentage on gross amount']);
      valueTypeArray.push(res['Translation.Percentage on commission']);
      valueTypeArray.push(res['Translation.Percentage on clean amount']);
  

      valueTypeFixedArray.push(res['Translation.Select']);
      valueTypeFixedArray.push(res['Translation.Fixed']);

      let valueTypeValueArr = [null, 'F', 'PG', "PC", "PA"];
      let valueTypeFixedArr = [null, 'F'];
      let levyValueFixedCmbList = [];
      let levyValueTypeCmbList = [];
      let cmbItem: ComboItem;
      let cmItemFixed: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValueArr[i]);
        levyValueTypeCmbList[i] = cmbItem;
      }

      for (let i = 0; i < valueTypeFixedArray.length; i++) {
        cmItemFixed = new ComboItem(valueTypeFixedArray[i], valueTypeFixedArr[i]);
        levyValueFixedCmbList[i] = cmItemFixed;
      }

      if (AppUtility.isValidVariable(this.selectedItem.leviesMaster.levyCategories.id)) {
        if (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_SETTLEMENT_ID
          || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_TRADING_ID
          ||  this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVA_ID) {
          this.valueTypeList = [];
          this.valueTypeList = levyValueTypeCmbList;
        }
        else {
          this.valueTypeList = [];
          this.valueTypeList = levyValueFixedCmbList;
        }
      }


    })
  }



  public getValueTypeListIVA = () => {
    let valueTypeArray = [];
    let valueTypeFixedArray = [];
    this.valueTypeList = [];
    this.translate.get(['Translation.Select',  'Translation.Percentage on Levies']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Percentage on Levies']);

      valueTypeFixedArray.push(res['Translation.Select']);
      valueTypeFixedArray.push(res['Translation.Fixed']);

      let valueTypeValueArr = [null, "PL"];
      let valueTypeFixedArr = [null, 'F'];
      let levyValueFixedCmbList = [];
      let levyValueTypeCmbList = [];
      let cmbItem: ComboItem;
      let cmItemFixed: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValueArr[i]);
        levyValueTypeCmbList[i] = cmbItem;
      }

      for (let i = 0; i < valueTypeFixedArray.length; i++) {
        cmItemFixed = new ComboItem(valueTypeFixedArray[i], valueTypeFixedArr[i]);
        levyValueFixedCmbList[i] = cmItemFixed;
      }

      if (AppUtility.isValidVariable(this.selectedItem.leviesMaster.levyCategories.id)) {
        if (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVL_ID) {
          this.valueTypeList = [];
          this.valueTypeList = levyValueTypeCmbList;
        }
        else {
          this.valueTypeList = [];
          this.valueTypeList = levyValueFixedCmbList;
        }
      }


    })
  }





  loadAssetClassList() {
    this.listingService.getAssetClassList().subscribe((data) => {
      if (data != null) {
        this.assetClassList = data;

        let asset: AssetClass = new AssetClass();
        asset.assetId = AppConstants.PLEASE_SELECT_VAL;
        asset.assetName = AppConstants.PLEASE_SELECT_STR;
        this.assetClassList.unshift(asset);
        this.selectedDetailItem.asset.assetId = this.assetClassList[0].assetId;
        this.assetClass.isDisabled = true;

      }
    },
      (error) => {

        this.errorMessage = <any>error
      });
  }






  private populateBondCategoryList() {

    this.listingService.getBondCategoryList()
      .subscribe(
        restData => {
          this.bondCategoryList = restData;
          var bc: BondCategory = new BondCategory();
          bc.categoryId = AppConstants.PLEASE_SELECT_VAL;
          bc.category = AppConstants.ALL_STR;
          this.bondCategoryList.unshift(bc);
          this.selectedDetailItem.bondCategory.categoryId = this.bondCategoryList[0].categoryId;
          this.bondCategoryId.isDisabled = true;
        },
        err => {

          if (err.message) {
            this.errorMessage = err.message;
          }
          else {
            this.errorMessage = err;
          }
        });
  }



  private populateBondTypeList() {

    this.listingService.getBondTypeList()
      .subscribe(
        restData => {

          this.bondTypeList = restData;
          var bt: BondType = new BondType();
          bt.bondTypeId = AppConstants.PLEASE_SELECT_VAL;
          bt.bondType = AppConstants.ALL_STR;
          this.bondTypeList.unshift(bt);
          this.selectedDetailItem.bondType.bondTypeId = this.bondTypeList[0].bondTypeId;
          this.bondTypeId.isDisabled = true;
        },
        err => {
          if (err.message) {
            this.errorMessage = err.message;
          }
          else {
            this.errorMessage = err;
          }
        });
  }


  public changeLevyMode = (event) => {
    this.appliesToList = [];
    if (AppUtility.isValidVariable(event)) {
      if (event === 'T') {
        this.appliesToList = this.appliesToListTrade;
      }

      if (event === 'P') {
        this.appliesToList = this.appliesToListPayment;
      }

      if (event === 'V') {
        this.appliesToList = this.appliesToListVault;
      }

    }
  }







  public clearFields(_clearMaster: Boolean, _clearDetail: Boolean) {
    if (AppUtility.isValidVariable(this.myForm)) {
      this.myForm.markAsPristine();
    }

    this.disabledCheckbox = false;
    if (AppUtility.isValidVariable(this.itemsList)) {
      this.itemsList.cancelEdit();
      this.itemsList.cancelNew();
    }
    this.isIVL = false;
    this.hideForm = false;
    this.isEditing = false;
    this.addingNew = true;
    this.isDetailEditing = false;
    this.LevyRateError = false;
    this.finalSaveUpdate = false;
    this.isSubmitted = false;
    this.isPercentageOnLevies = false;
    if (!this.isNotUnique) {
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
      }

    }

    if (_clearMaster)
      this.ClearMasterObject();
    if (_clearDetail)
      this.ClearDetailObject();
  }

  private ClearMasterObject() {
    this.selectedItem = new LevieDetail();
    this.selectedItem.effectiveDate = new Date();
    this.selectedItem.effectiveToDate = new Date();
    this.selectedItem.levyRate = 0;
    this.selectedItem.appliedTo = null;
    this.selectedItem.leviesDetailId = null;
    this.selectedItem.active = true;
    this.selectedItem.unProcessedLevy = null;


    this.disabled = 'disabled';
    this.selectedItem.traansactionTypesExchange = new TraansactionTypesExchange();
    this.selectedItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
    this.selectedItem.traansactionTypesExchange.transactionType = null;



    this.selectedItem.leviesMaster = new ClientLevieMaster();
    this.selectedItem.leviesMaster.leviesMasterId = null;
    this.selectedItem.leviesMaster.levyDesc = null;
    this.selectedItem.leviesMaster.levyCode = null;
    this.selectedItem.leviesMaster.levyType = '';
    this.selectedItem.leviesMaster.levyTypeDispaly_ = null;
    this.selectedItem.leviesMaster.levyLevel = "";
    this.selectedItem.leviesMaster.levyName = "";
    this.selectedItem.leviesMaster.recurrenceId = "";

    this.levyRateLabelModalDisplay = '';

    this.selectedItem.leviesMaster.exchange = new Exchange();
    this.selectedItem.leviesMaster.exchange.exchangeId = null;
    this.selectedItem.leviesMaster.exchange.exchangeCode = null;
    this.selectedItem.leviesMaster.exchange.exchangeName = null;

    this.selectedItem.leviesMaster.participant = new Participant();
    this.selectedItem.leviesMaster.participant.participantId = AppConstants.participantId;

    this.selectedItem.leviesMaster.voucherType = new VoucherType();
    if (!AppUtility.isEmptyArray(this.voucherTypeList)) {
      this.selectedItem.leviesMaster.voucherType.voucherType = this.voucherTypeList[0].voucherType;
      this.selectedItem.leviesMaster.voucherType.voucherTypeId = this.voucherTypeList[0].voucherTypeId;
    }

    this.selectedItem.leviesMaster.chartOfAccount = new ChartOfAccount();
    if (!AppUtility.isEmptyArray(this.chartOfAccountList)) {
      this.selectedItem.leviesMaster.chartOfAccount.glCodeDisplayName_ = this.chartOfAccountList[0].glCodeDisplayName_;
      this.selectedItem.leviesMaster.chartOfAccount.chartOfAccountId = this.chartOfAccountList[0].chartOfAccountId;
    }

    this.selectedItem.leviesMaster.levyCategories = new LevyCategory();
    if (!AppUtility.isEmptyArray(this.levyCategories)) {
      this.selectedItem.leviesMaster.levyCategories.description = this.levyCategories[0].description;
      this.selectedItem.leviesMaster.levyCategories.id = this.levyCategories[0].id;
    }

    if (!AppUtility.isEmptyArray(this.appliesToList)) {
      this.selectedItem.appliedTo = this.appliesToList[0].abbreviation;
    }

    this.selectedItem.traansactionTypesExchange = new TraansactionTypesExchange();
    if (!AppUtility.isEmptyArray(this.transactionTypeList)) {
      this.selectedItem.traansactionTypesExchange.traansactionTypeExchangeId = this.transactionTypeList[0].traansactionTypeExchangeId;
      this.selectedItem.traansactionTypesExchange.transactionType = this.transactionTypeList[0].transactionType;
    }
  }

  private ClearDetailObject() {
    this.today = new Date();
    this.today.setDate(this.today.getDate() + 1);
    this.selectedDetailItem = new LevieDetail();
    this.selectedDetailItem.effectiveDate = new Date();
    this.selectedDetailItem.effectiveToDate = this.today;
    this.selectedDetailItem.levyRate = 0;
    this.selectedDetailItem.appliedTo = null;
    this.selectedDetailItem.leviesDetailId = null;
    this.selectedDetailItem.active = true;
    this.selectedDetailItem.unProcessedLevy = null;

    this.selectedDetailItem.ivaLeviesMaster = new ivaLeviesMaster();
    this.selectedDetailItem.ivaLeviesMaster.leviesMasterId = null;

    this.selectedDetailItem.traansactionTypesExchange = new TraansactionTypesExchange();

    if (!AppUtility.isEmptyArray(this.transactionTypeList)) {
      this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.transactionTypeList[0].traansactionTypeExchangeId;
      this.selectedDetailItem.traansactionTypesExchange.transactionType = this.transactionTypeList[0].transactionType;
    }
    else {
      this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
      this.selectedDetailItem.traansactionTypesExchange.transactionType = null;
    }

    this.selectedDetailItem.leviesMaster = new ClientLevieMaster();
    this.selectedDetailItem.leviesMaster.leviesMasterId = null;
    this.selectedDetailItem.leviesMaster.levyDesc = null;
    this.selectedDetailItem.leviesMaster.levyCode = null;
    this.selectedDetailItem.leviesMaster.levyType = '';
    this.selectedDetailItem.leviesMaster.levyTypeDispaly_ = '';
    if (this.lang === 'pt') {
      this.levyRateLabelModalDisplay = 'Valor da taxa';
    }
    else {
      this.levyRateLabelModalDisplay = 'Levy Value';
    }


    if (this.selectedDetailItem.valueType == 'F') {
      //this.selectedDetailItem.leviesMaster.levyTypeDispaly_ = 'Fixed';

      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por compartilhamento)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Share)';
      }
    }
    else {
      // this.selectedDetailItem.leviesMaster.levyTypeDispaly_ = 'Commission Percentage';
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
      }
    }

    this.selectedDetailItem.leviesMaster.exchange = new Exchange();
    this.selectedDetailItem.leviesMaster.exchange.exchangeId = null;
    this.selectedDetailItem.leviesMaster.exchange.exchangeCode = null;
    this.selectedDetailItem.leviesMaster.exchange.exchangeName = null;

    this.selectedDetailItem.leviesMaster.participant = new Participant();
    this.selectedDetailItem.leviesMaster.participant.participantId = AppConstants.participantId;

    this.selectedDetailItem.leviesMaster.voucherType = new VoucherType();
    this.selectedDetailItem.leviesMaster.voucherType.voucherType = null;
    this.selectedDetailItem.leviesMaster.voucherType.voucherTypeId = null;

    this.selectedDetailItem.leviesMaster.chartOfAccount = new ChartOfAccount();
    this.selectedDetailItem.leviesMaster.chartOfAccount.glCodeDisplayName_ = null;
    this.selectedDetailItem.leviesMaster.chartOfAccount.chartOfAccountId = null;

    this.selectedDetailItem.asset = new AssetClass();
    this.selectedDetailItem.asset.assetId = null;
    this.selectedDetailItem.asset.assetName = null;

    this.selectedDetailItem.bondNature = new BondNature();
    this.selectedDetailItem.bondNature.bondNatureId = null;
    this.selectedDetailItem.bondNature.bondNatureDesc = null;


    this.selectedDetailItem.bondCategory = new BondCategory();
    this.selectedDetailItem.bondCategory.categoryId = null;
    this.selectedDetailItem.bondCategory.category = null;

    this.selectedDetailItem.bondType = new BondType();
    this.selectedDetailItem.bondType.bondTypeId = null;
    this.selectedDetailItem.bondType.bondType = null;

    this.selectedDetailItem.levyMode = null;
    this.selectedDetailItem.valueType = null;
    this.selectedDetailItem.levyFloor = 0;
    this.selectedDetailItem.levyCeiling = 0;
    this.selectedDetailItem.rangeFrom = 0;
    this.selectedDetailItem.rangeTo = 0;
    this.selectedDetailItem.slabRange = 'D';



  }
  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    if (this._pageSize != value) {
      this._pageSize = value;
      if (this.flex) {
        (<IPagedCollectionView><unknown>this.flex.collectionView).pageSize = value;
      }
    }
  }

  public onTransactionTypeChangeEvent(stId) {
    if (AppUtility.isValidVariable(this.transactionTypeList) && AppUtility.isValidVariable(stId)) {
      for (let i = 0; i < this.transactionTypeList.length; i++) {
        if (this.transactionTypeList[i].traansactionTypeExchangeId == stId) {
          this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.transactionTypeList[i].traansactionTypeExchangeId;
          this.selectedDetailItem.traansactionTypesExchange.transactionType = this.transactionTypeList[i].transactionType;
        }
      }


      if (this.selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_BONDS) {
        for (let j = 0; j < stId.length; j++) {
          if (stId.length == 1 && stId[j].transactionType === AppConstants.MARKET_TYPE_REPO_) {
            this.isRepo = true;
            this.isDebt = false;
            this.myForm.get('slabRange').addValidators(Validators.required);
            this.myForm.get('slabRange').updateValueAndValidity();
            this.myForm.get('rangeFrom').addValidators(Validators.required);
            this.myForm.get('rangeFrom').updateValueAndValidity();
            this.myForm.get('rangeTo').addValidators(Validators.required);
            this.myForm.get('rangeTo').updateValueAndValidity();

          }
          else if (stId.length == 1 && stId[j].transactionType === AppConstants.MARKET_TYPE_DEBT_) {
            this.isRepo = false;
            this.isDebt = true;
            this.myForm.get('slabRange').clearValidators();
            this.myForm.get('slabRange').updateValueAndValidity();
            this.myForm.get('rangeFrom').clearValidators();
            this.myForm.get('rangeFrom').updateValueAndValidity();
            this.myForm.get('rangeTo').clearValidators();
            this.myForm.get('rangeTo').updateValueAndValidity();

          } else if (stId.length > 1) {
            this.isRepo = true;
            this.isDebt = false;
            this.myForm.get('slabRange').addValidators(Validators.required);
            this.myForm.get('slabRange').updateValueAndValidity();
            this.myForm.get('rangeFrom').addValidators(Validators.required);
            this.myForm.get('rangeFrom').updateValueAndValidity();
            this.myForm.get('rangeTo').addValidators(Validators.required);
            this.myForm.get('rangeTo').updateValueAndValidity();
          } else {
            this.isRepo = false;
            this.isDebt = true;
            this.myForm.get('slabRange').clearValidators();
            this.myForm.get('slabRange').updateValueAndValidity();
            this.myForm.get('rangeFrom').clearValidators();
            this.myForm.get('rangeFrom').updateValueAndValidity();
            this.myForm.get('rangeTo').clearValidators();
            this.myForm.get('rangeTo').updateValueAndValidity();
          }
        }
      } else {
        this.isRepo = false;
        this.isDebt = true;
        this.myForm.get('slabRange').clearValidators();
        this.myForm.get('slabRange').updateValueAndValidity();
        this.myForm.get('rangeFrom').clearValidators();
        this.myForm.get('rangeFrom').updateValueAndValidity();
        this.myForm.get('rangeTo').clearValidators();
        this.myForm.get('rangeTo').updateValueAndValidity();
      }










    }
  }
  // public hideModal() {
  //   jQuery('#add_new').modal('hide');   // hiding the modal on save/updating the record
  // }

  public onModalLoaded() {
    $('#add_new').on('shown.bs.modal', function () {
      wjcGrid.FlexGrid.invalidateAll();
    });

    if (AppUtility.isValidVariable(this.detailList)) {
      if (this.selectedDetailItem.valueType == 'F') {
        if (this.lang === 'pt') {
          this.levyRateLabelModalDisplay = 'Valor da taxa (Por compartilhamento)';
        }
        else {
          this.levyRateLabelModalDisplay = 'Levy Value (Per Share)';
        }
        this.maxLevyRate = 999999.9999;
      }
      else {
        if (this.lang === 'pt') {
          this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
        }
        else {
          this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
        }
        this.maxLevyRate = 100;
      }
    }
    this.flexDetail.invalidate();
  }

  public onCancelAction() {
    this.clearFields(true, true);
    this.populateClientLevieMasterList();
    if (this.lang === 'pt') { this.transactionTypeControl.placeholder = 'Selecione'; } else { this.transactionTypeControl.placeholder = 'Select'; }
    this.transactionTypeControl.invalidate();
    this.hideForm = false;
  }

  public onNewAction() {
    this.todayNewDate = new Date();
    this.clearFields(true, true);
    this.today = new Date();
    this.today.setDate(this.today.getDate() + 1);
    this.selectedDetailItem.effectiveToDate = this.today;
    if (this.lang === 'pt') { this.transactionTypeControl.placeholder = 'Selecione'; } else { this.transactionTypeControl.placeholder = 'Select'; }
    this.transactionTypeControl.invalidate();
    this.hideForm = true;
    if (AppUtility.isValidVariable(this.detailList)) {
      this.detailList = null;
      this.onModalLoaded();
    }
    this.isParentDisabled = false;
    this.addingNew = true;
    this.onValueTypeChangeEvent(AppConstants.PERCENTAGE_ABBREVIATION);
  }






  public loadObject(selectedDetailItem: ClientLevieDetail) {
  
     
    let temp_detail = this.detailList.addNew();
    //if (selectedDetailItem.unProcessedLevy > 0)
    temp_detail.effectiveDate = new Date();
    temp_detail.effectiveDate = selectedDetailItem.effectiveDate;
    //else
    temp_detail.effectiveToDate = new Date();
    temp_detail.effectiveToDate = selectedDetailItem.effectiveToDate

    temp_detail.levyRate = selectedDetailItem.levyRate;
    if (AppUtility.isValidVariable(selectedDetailItem.appliedTo)) {
      temp_detail.appliedTo = selectedDetailItem.appliedTo;
    }
    else {
      temp_detail.appliedTo = null;
    }
  
  
  
    if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_EQUITIES
    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_BONDS
    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_ETF
    }


    if (AppUtility.isValidVariable(selectedDetailItem.bondCategory) && AppUtility.isValidVariable(selectedDetailItem.bondCategory.categoryId)) {
      if (selectedDetailItem.bondCategory.categoryId === AppConstants.BOND_CATEGORY_CORPORATE_ID) {
        temp_detail.bondCategoryDisplay_ = "Corporate"
      }
      else if (selectedDetailItem.bondCategory.categoryId === AppConstants.BOND_CATEGORY_GOVT_ID) {
        temp_detail.bondCategoryDisplay_ = "Government"
      }

    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID && AppUtility.isValidVariable(selectedDetailItem.bondCategory)) {
      temp_detail.bondCategoryDisplay_ = "ALL";
    }
    else {
      temp_detail.bondCategoryDisplay_ = "";
    }


    if (AppUtility.isValidVariable(selectedDetailItem.bondNature) && AppUtility.isValidVariable(selectedDetailItem.bondNature.bondNatureId)) {
      if (selectedDetailItem.bondNature.bondNatureId === AppConstants.BOND_NATURE_NON_INDEX_ID) {
        temp_detail.bondNatureDisplay_ = "Non Index Bond";
      }
      else if (selectedDetailItem.bondNature.bondNatureId === AppConstants.BOND_NATURE_INDEX_ID) {
        temp_detail.bondNatureDisplay_ = "Index Bond";
      }
      else if (selectedDetailItem.bondNature.bondNatureId === AppConstants.BOND_NATURE_FOREIGN_CURR_ID) {
        temp_detail.bondNatureDisplay_ = "Foreign Currency Bond";
      }
    }
    else {
      temp_detail.bondCategoryDisplay_ = "";
    }


    if (AppUtility.isValidVariable(selectedDetailItem.bondType) && AppUtility.isValidVariable(selectedDetailItem.bondType.bondTypeId)) {
      if (selectedDetailItem.bondType.bondTypeId === AppConstants.BOND_TYPE_FIXED_COUPON_ID) {
        temp_detail.bondTypeDisplay_ = "Fixed Coupon";
      }
      else if (selectedDetailItem.bondType.bondTypeId === AppConstants.BOND_TYPE_END_OF_TERM_ID) {
        temp_detail.bondTypeDisplay_ = "End of term"
      }
      else if (selectedDetailItem.bondType.bondTypeId === AppConstants.BOND_TYPE_FLOATING_RATE_ID) {
        temp_detail.bondTypeDisplay_ = "Floating Rate"
      }
      else if (selectedDetailItem.bondType.bondTypeId === AppConstants.BOND_TYPE_ZERO_COUPON_ID) {
        temp_detail.bondTypeDisplay_ = "Zero Coupon";
      }

    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID && AppUtility.isValidVariable(selectedDetailItem.bondType)) {
      temp_detail.bondTypeDisplay_ = "ALL";
    }
    else {
      temp_detail.bondTypeDisplay_ = "";
    }

    if (selectedDetailItem.levyMode === 'T') {
      temp_detail.levyModeDisplay_ = 'Trade';
    }
    else if (selectedDetailItem.levyMode === 'P') {
      temp_detail.levyModeDisplay_ = 'Payment';
    }
    else if (selectedDetailItem.levyMode === 'V') {
      temp_detail.levyModeDisplay_ = 'Vault Transaction';
    }
    else {
      temp_detail.levyModeDisplay_ = null
    }

    if (selectedDetailItem.valueType === 'F') {
      temp_detail.valueTypeDisplay_ = "Fixed";
    }
    else if (selectedDetailItem.valueType === 'PG') {
      temp_detail.valueTypeDisplay_ = "Percentage on gross amount";
    }
    else if (selectedDetailItem.valueType === 'PC') {
      temp_detail.valueTypeDisplay_ = "Percentage on commission";
    }
    else if (selectedDetailItem.valueType === 'PA') {
      temp_detail.valueTypeDisplay_ = "Percentage on clean amount";
    }
    else if (selectedDetailItem.valueType === 'PL') {
      temp_detail.valueTypeDisplay_ = "Percentage on Levies";
    }
    else {
      temp_detail.valueTypeDisplay_ = null;
    }




    if (selectedDetailItem.appliedTo == 'S')
      temp_detail.tradingSideDisplay_ = 'Sell';
    else if (selectedDetailItem.appliedTo == 'B')
      temp_detail.tradingSideDisplay_ = 'Buy';
    else if (selectedDetailItem.appliedTo == 'O')
      temp_detail.tradingSideDisplay_ = 'Both';
    else if (selectedDetailItem.appliedTo == 'C')
      temp_detail.tradingSideDisplay_ = 'Coupon';
    else if (selectedDetailItem.appliedTo == 'R')
      temp_detail.tradingSideDisplay_ = 'Reimbursement';
    else if (selectedDetailItem.appliedTo == 'CR')
      temp_detail.tradingSideDisplay_ = 'Coupon, Reimbursement';
    else if (selectedDetailItem.appliedTo == 'D')
      temp_detail.tradingSideDisplay_ = 'Deposit';
    else if (selectedDetailItem.appliedTo == 'W')
      temp_detail.tradingSideDisplay_ = 'Withdrawal';
    else if (selectedDetailItem.appliedTo == 'DW')
      temp_detail.tradingSideDisplay_ = 'Deposit, Withdrawal';
    else
      temp_detail.tradingSideDisplay_ = null;

    temp_detail.leviesDetailId = selectedDetailItem.leviesDetailId;
    temp_detail.active = selectedDetailItem.active;



    if (AppUtility.isValidVariable(selectedDetailItem.traansactionTypesExchange) && AppUtility.isValidVariable(selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId)) {
      temp_detail.traansactionTypesExchange = new TraansactionTypesExchange();
      temp_detail.traansactionTypesExchange.transactionType = selectedDetailItem.traansactionTypesExchange.transactionType;
      temp_detail.traansactionTypesExchange.traansactionTypeExchangeId = selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId;
    }
    else {
      temp_detail.traansactionTypesExchange = null;

    }



    temp_detail.leviesMaster = selectedDetailItem.leviesMaster;
    temp_detail.leviesMaster.leviesMasterId = selectedDetailItem.leviesMaster.leviesMasterId;
    temp_detail.leviesMaster.levyDesc = selectedDetailItem.leviesMaster.levyDesc;
    temp_detail.leviesMaster.levyCode = selectedDetailItem.leviesMaster.levyCode;
    if (selectedDetailItem.valueType == 'F') {
      // temp_detail.leviesMaster.levyTypeDispaly_ = 'Fixed';
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por compartilhamento)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Share)';
      }
    }
    else {
      // temp_detail.leviesMaster.levyTypeDispaly_ = 'Commission Percentage';
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
      }
    }

    //tradingSideDisplay_
    temp_detail.leviesMaster.exchange = selectedDetailItem.leviesMaster.exchange;
    temp_detail.leviesMaster.exchange.exchangeId = selectedDetailItem.leviesMaster.exchange.exchangeId;
    temp_detail.leviesMaster.exchange.exchangeCode = selectedDetailItem.leviesMaster.exchange.exchangeCode;
    temp_detail.leviesMaster.exchange.exchangeName = selectedDetailItem.leviesMaster.exchange.exchangeName;

    temp_detail.leviesMaster.voucherType = selectedDetailItem.leviesMaster.voucherType;
    temp_detail.leviesMaster.voucherType.voucherTypeId = selectedDetailItem.leviesMaster.voucherType.voucherTypeId;
    temp_detail.leviesMaster.voucherType.voucherType = selectedDetailItem.leviesMaster.voucherType.voucherType;

    temp_detail.leviesMaster.chartOfAccount = selectedDetailItem.leviesMaster.chartOfAccount;
    temp_detail.leviesMaster.chartOfAccount.chartOfAccountId = selectedDetailItem.leviesMaster.chartOfAccount.chartOfAccountId;
    temp_detail.leviesMaster.chartOfAccount.glCodeDisplayName_ = selectedDetailItem.leviesMaster.chartOfAccount.glCodeDisplayName_;

    temp_detail.leviesMaster.levyLevel = this.selectedItem.leviesMaster.levyLevel;
    temp_detail.leviesMaster.levyName = this.selectedItem.leviesMaster.levyName;
    temp_detail.leviesMaster.recurrenceId = this.selectedItem.leviesMaster.recurrenceId;

    if (AppUtility.isValidVariable(selectedDetailItem.asset.assetId)) {
      //  temp_detail.asset = new AssetClass(); 
      temp_detail.asset = selectedDetailItem.asset;
      temp_detail.asset.assetId = selectedDetailItem.asset.assetId;
    }
    else {
      temp_detail.asset = null;
    }


    if (AppUtility.isValidVariable(selectedDetailItem.bondNature.bondNatureId)) {
      temp_detail.bondNature = selectedDetailItem.bondNature;
      temp_detail.bondNature.bondNatureId = selectedDetailItem.bondNature.bondNatureId;
    }
    else {
      temp_detail.bondNature = null;
    }


    if (this.isBondFieldsRequired === true) {
      if (AppUtility.isValidVariable(selectedDetailItem.bondCategory) && AppUtility.isValidVariable(selectedDetailItem.bondCategory.categoryId)) {
        temp_detail.bondCategory = selectedDetailItem.bondCategory;
        temp_detail.bondCategory.bondCategoryId = selectedDetailItem.bondCategory.categoryId;
      }
      else {
        temp_detail.bondCategory = null;
      }
    }
    else {
      temp_detail.bondCategory = null;
    }




    if (this.isBondFieldsRequired == true) {
      if (AppUtility.isValidVariable(selectedDetailItem.bondType) && AppUtility.isValidVariable(selectedDetailItem.bondType.bondTypeId)) {
        temp_detail.bondType = selectedDetailItem.bondType;
        temp_detail.bondType.bondTypeId = selectedDetailItem.bondType.bondTypeId;
      }
      else {
        temp_detail.bondType = null;
      }

    }
    else {
      temp_detail.bondType = null;
    }



    temp_detail.levyMode = selectedDetailItem.levyMode;
    temp_detail.valueType = selectedDetailItem.valueType;
    temp_detail.levyFloor = selectedDetailItem.levyFloor;
    temp_detail.levyCeiling = selectedDetailItem.levyCeiling;
    temp_detail.rangeFrom = selectedDetailItem.rangeFrom;
    temp_detail.rangeTo = selectedDetailItem.rangeTo;

    if (AppUtility.isValidVariable(selectedDetailItem.traansactionTypesExchange)) {
      if (selectedDetailItem.traansactionTypesExchange.transactionType === AppConstants.MARKET_TYPE_REPO_) {
        temp_detail.slabRange = selectedDetailItem.slabRange;
      } else {
        temp_detail.slabRange = "";
      }
    }

    if (temp_detail.slabRange == 'D')
      temp_detail.slabRangeDisplay_ = 'Days';
    else
      temp_detail.slabRangeDisplay_ = '';

    this.detailList.commitNew();


 




  }





  public loadObjectIVL(selectedDetailItem: ClientLevieDetail , leviesId : any) {
  
     
    let temp_detail = this.detailList.addNew();
    //if (selectedDetailItem.unProcessedLevy > 0)
    temp_detail.effectiveDate = new Date();
    temp_detail.effectiveDate = selectedDetailItem.effectiveDate;
    //else
    temp_detail.effectiveToDate = new Date();
    temp_detail.effectiveToDate = selectedDetailItem.effectiveToDate

    temp_detail.levyRate = selectedDetailItem.levyRate;
    temp_detail.appliedTo = null;
    temp_detail.traansactionTypesExchange = null;
    temp_detail.asset = null;
    temp_detail.bondNature = null;
    temp_detail.bondCategory = null;
    temp_detail.bondType = null;
    temp_detail.slabRange = "";
    temp_detail.slabRangeDisplay_ = '';

    temp_detail.leviesDetailId = selectedDetailItem.leviesDetailId;
    temp_detail.active = selectedDetailItem.active;

    if(AppUtility.isValidVariable(leviesId)){
      temp_detail.ivaLeviesMaster = new ivaLeviesMaster();
      temp_detail.ivaLeviesMaster.leviesMasterId = leviesId.leviesMasterId;
      if(AppUtility.isValidVariable(this.leviesList) && !AppUtility.isEmptyArray(this.leviesList)){
              this.leviesList.forEach((element) => {
                 if(element.leviesMasterId === leviesId.leviesMasterId){
                   temp_detail.ivaLevyDisplay_ = element.levyCode;
                 }
              })
      }


    }
   
    
    
    temp_detail.leviesMaster = selectedDetailItem.leviesMaster;
    temp_detail.leviesMaster.leviesMasterId = selectedDetailItem.leviesMaster.leviesMasterId;
    temp_detail.leviesMaster.levyDesc = selectedDetailItem.leviesMaster.levyDesc;
    temp_detail.leviesMaster.levyCode = selectedDetailItem.leviesMaster.levyCode;
 
    if (selectedDetailItem.valueType == 'F') {
      // temp_detail.leviesMaster.levyTypeDispaly_ = 'Fixed';
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por compartilhamento)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Share)';
      }
    }
    else {
      // temp_detail.leviesMaster.levyTypeDispaly_ = 'Commission Percentage';
      temp_detail.valueTypeDisplay_ = "Percentage on Levies";
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
      }
    }

    //tradingSideDisplay_
    temp_detail.leviesMaster.exchange = selectedDetailItem.leviesMaster.exchange;
    temp_detail.leviesMaster.exchange.exchangeId = selectedDetailItem.leviesMaster.exchange.exchangeId;
    temp_detail.leviesMaster.exchange.exchangeCode = selectedDetailItem.leviesMaster.exchange.exchangeCode;
    temp_detail.leviesMaster.exchange.exchangeName = selectedDetailItem.leviesMaster.exchange.exchangeName;

    temp_detail.leviesMaster.voucherType = selectedDetailItem.leviesMaster.voucherType;
    temp_detail.leviesMaster.voucherType.voucherTypeId = selectedDetailItem.leviesMaster.voucherType.voucherTypeId;
    temp_detail.leviesMaster.voucherType.voucherType = selectedDetailItem.leviesMaster.voucherType.voucherType;

    temp_detail.leviesMaster.chartOfAccount = selectedDetailItem.leviesMaster.chartOfAccount;
    temp_detail.leviesMaster.chartOfAccount.chartOfAccountId = selectedDetailItem.leviesMaster.chartOfAccount.chartOfAccountId;
    temp_detail.leviesMaster.chartOfAccount.glCodeDisplayName_ = selectedDetailItem.leviesMaster.chartOfAccount.glCodeDisplayName_;

    temp_detail.leviesMaster.levyLevel = this.selectedItem.leviesMaster.levyLevel;
    temp_detail.leviesMaster.levyName = this.selectedItem.leviesMaster.levyName;
    temp_detail.leviesMaster.recurrenceId = this.selectedItem.leviesMaster.recurrenceId;

    temp_detail.levyMode = selectedDetailItem.levyMode;
    temp_detail.valueType = selectedDetailItem.valueType;
    temp_detail.levyFloor = selectedDetailItem.levyFloor;
    temp_detail.levyCeiling = selectedDetailItem.levyCeiling;
    temp_detail.rangeFrom = selectedDetailItem.rangeFrom;
    temp_detail.rangeTo = selectedDetailItem.rangeTo;
  
    this.detailList.commitNew();

  }









  public onAddNewRow() {
    
    if (!this.LevyRateError) {
      // const ctrl_: FormControl = (<any>this.myForm).controls.transactionType;
      // ctrl_.setValidators(Validators.required);
      // ctrl_.updateValueAndValidity();


      const ctrl: FormControl = (<any>this.myForm).controls.valueTypeId;
      ctrl.setValidators(Validators.required);
      ctrl.updateValueAndValidity();
      if (this.selectedDetailItem.valueType == null || this.selectedDetailItem.valueType == "null") {
        this.myForm.controls['valueTypeId'].setErrors({ 'required': true });
      }

      const ctrl1: FormControl = (<any>this.myForm).controls.levyRate;
      ctrl1.setValidators(Validators.required);
      ctrl1.updateValueAndValidity();
      if (this.selectedDetailItem.levyRate == null || this.selectedDetailItem.levyRate == 0) {
        this.myForm.controls['levyRate'].setErrors({ 'required': true });
      }

      if (this.isBondFieldsRequired === true) {

        const ctrl2: FormControl = (<any>this.myForm).controls.bondNatureId;
        ctrl2.setValidators(Validators.required);
        ctrl2.updateValueAndValidity();
        if (this.selectedDetailItem.bondNature.bondNatureId == null || this.selectedDetailItem.bondNature.bondNatureId === undefined) {
          this.myForm.controls['bondNatureId'].setErrors({ 'required': true });
        }


      }

      if (this.isRepo === true) {

        const ctrl6: FormControl = (<any>this.myForm).controls.rangeFrom;
        ctrl6.setValidators(Validators.required);
        ctrl6.updateValueAndValidity();
        if (this.selectedDetailItem.rangeFrom == null || this.selectedDetailItem.rangeFrom === undefined || this.selectedDetailItem.rangeFrom === 0) {
          this.myForm.controls['rangeFrom'].setErrors({ 'required': true });
        }

        const ctrl7: FormControl = (<any>this.myForm).controls.rangeTo;
        ctrl7.setValidators(Validators.required);
        ctrl7.updateValueAndValidity();
        if (this.selectedDetailItem.rangeTo == null || this.selectedDetailItem.rangeTo === undefined || this.selectedDetailItem.rangeTo === 0) {
          this.myForm.controls['rangeTo'].setErrors({ 'required': true });
        }

      }

      if (this.isTransactionType === true) {
        const ctrl4: FormControl = (<any>this.myForm).controls.transactionType;
        ctrl4.setValidators(Validators.required);
        ctrl4.updateValueAndValidity();
        if (this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId == null || this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId == undefined) {
          this.myForm.controls['transactionType'].setErrors({ 'required': true });
        }
      }


      if(this.selectedDetailItem.valueType == 'PL' && this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVL_ID){
        this.selectedAppliedLevy();
        this.selectedLeviesIds = [];
        let cal = [];
        for (let j = 0; j < this.selectedLevies.length; j++) {
    
          cal[j] = new ivaLeviesMaster();
          cal[j].leviesMasterId = this.selectedLevies[j];
        this.selectedLeviesIds.push(cal[j]);
        }
       }


      if (this.allTransTypes) {
        let transList = []
        for (let i = 0; i < this.transactionTypeList.length; i++) {
          this.transactionTypeList[i].$checked = true;
          transList.push(this.transactionTypeList[i]);
        }
        this.transactionTypeControl.checkedItems = transList
        this.allTransTypes = false
      }


      if(this.selectedItem.leviesMaster.levyCategories.id !== AppConstants.LEVY_CATEGORY_IVL_ID){
        if (this.transactionTypeControl.checkedItems.length > 0) {

          for (let selectedTransactionType of this.transactionTypeControl.checkedItems) {
            this.selectedDetailItem.traansactionTypesExchange = new TraansactionTypesExchange();
            this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = selectedTransactionType.traansactionTypeExchangeId;
            this.selectedDetailItem.traansactionTypesExchange.transactionType = selectedTransactionType.transactionType;
            if (!this.isDetailEditing) {
              if (AppUtility.isValidVariable(this.detailList) && this.detailList.items.length && this.myForm.valid) {
                 
                if (this.isUnique()) {
  
                  this.loadObject(this.selectedDetailItem);
                  this.AllowingEdit();
                }
              }
              else {
                // it is the 1st ever element to be added in the list.
                if (this.myForm.valid) {
                  this.detailList = new wjcCore.CollectionView();
                  this.loadObject(this.selectedDetailItem);
                  this.AllowingEdit();
                }
              }
            }
            else {
              // this part will be executed in case of editing the detail records in Modal.
              if (this.myForm.valid) {
                let temp: ClientLevieDetail = new ClientLevieDetail();
                temp = (JSON.parse(JSON.stringify(this.detailList.currentItem)));
                this.deleteCurrentItem();
                 
                if (this.isUnique())
                  this.loadObject(this.selectedDetailItem);
                else
                  this.loadObject(temp);
                this.detailList.refresh();
                this.flexDetail.refresh();
                this.isDetailEditing = false;
                this.AllowingEdit();
              }
            }
          }
  
        }
        else {
          // this.selectedDetailItem.traansactionTypesExchange = null;
          if (!this.isDetailEditing) {
            if (AppUtility.isValidVariable(this.detailList) && this.detailList.items.length && this.myForm.valid) {
               
              if (this.isUnique()) {
  
                this.loadObject(this.selectedDetailItem);
                this.AllowingEdit();
              }
            }
            else {
              // it is the 1st ever element to be added in the list.
              if (this.myForm.valid) {
                this.detailList = new wjcCore.CollectionView();
                this.loadObject(this.selectedDetailItem);
                this.AllowingEdit();
              }
            }
          }
          else {
            // this part will be executed in case of editing the detail records in Modal.
            if (this.myForm.valid) {
              let temp: ClientLevieDetail = new ClientLevieDetail();
              temp = (JSON.parse(JSON.stringify(this.detailList.currentItem)));
              this.deleteCurrentItem();
               
              if (this.isUnique())
                this.loadObject(this.selectedDetailItem);
              else
                this.loadObject(temp);
              this.detailList.refresh();
              this.flexDetail.refresh();
              this.isDetailEditing = false;
              this.AllowingEdit();
            }
          }
        }
      }
      else{
                   /////////////IVL Code For add New Entries

                  if(this.selectedLeviesIds.length > 0){

                   this.selectedLeviesIds.forEach(element => {
                      
                    if (!this.isDetailEditing) {
                      if (AppUtility.isValidVariable(this.detailList) && this.detailList.items.length && this.myForm.valid) {
                         
                         if(this.isUniqueIVL(element)){
                          this.loadObjectIVL(this.selectedDetailItem , element);
                          this.AllowingEdit();
                         }
                          
                      }
                      else {
                        // it is the 1st ever element to be added in the list.
                        if (this.myForm.valid) {
                          this.detailList = new wjcCore.CollectionView();
                          this.loadObjectIVL(this.selectedDetailItem, element);
                          this.AllowingEdit();
                        }
                      }
                    }
                    else {
                      // this part will be executed in case of editing the detail records in Modal.
                      if (this.myForm.valid) {
                        let temp: ClientLevieDetail = new ClientLevieDetail();
                        temp = (JSON.parse(JSON.stringify(this.detailList.currentItem)));
                        this.deleteCurrentItem();
                         
                        if (this.isUniqueIVL(element))
                          this.loadObjectIVL(this.selectedDetailItem , element);
                        else
                          this.loadObjectIVL(temp,  element);
                        this.detailList.refresh();
                        this.flexDetail.refresh();
                        this.isDetailEditing = false;
                        this.AllowingEdit();
                      }
                    }
                   })

  
                  }


      }

    



      this.selectedDetailItem.bondNature = new BondNature();
      this.myForm.get('bondNatureId').clearValidators();
      this.selectedDetailItem.bondCategory = new BondCategory();
      this.selectedDetailItem.bondType = new BondType();
      this.selectedDetailItem.levyMode = null;
      this.selectedDetailItem.appliedTo = null;
   //   this.selectedDetailItem.valueType = null;
   //   this.myForm.get('valueTypeId').clearValidators();
      this.selectedDetailItem.levyRate = 0;
      this.selectedDetailItem.levyFloor = 0;
      this.selectedDetailItem.levyCeiling = 0;
      this.selectedDetailItem.rangeFrom = 0;
      this.selectedDetailItem.rangeTo = 0;
      this.selectedDetailItem.slabRange = 'D';



 


    }
  }













  public onAllSelected(e) {
    if (e.target.checked) {
      this.transactionTypeControl.isDisabled = true;
      this.allTransTypes = true;
      this.transactionTypeControl.placeholder = 'All';
    } else {
      this.transactionTypeControl.isDisabled = false;
      this.allTransTypes = false;
    }
  }

  public onAppliesToChangeEvent(stId) {
    if (AppConstants.SELL_ABBREVIATION == stId) {
      this.selectedDetailItem.tradingSideDisplay_ = AppConstants.SELL_STRING;
    } else if (AppConstants.BUY_ABBREVIATION == stId) {
      this.selectedDetailItem.tradingSideDisplay_ = AppConstants.BUY_STRING;
    } else {
      this.selectedDetailItem.tradingSideDisplay_ = AppConstants.BOTH_STRING;
    }
  }

  public onEditAction() {

    if (!AppUtility.isEmpty(this.itemsList.currentItem)) {
      this.clearFields(true, true);
      this.hideForm = true;
      this.isEditing = true;
      this.addingNew = false;
      this.selectedItem.leviesMaster = this.itemsList.currentItem;
      this.getClientLevieDetailList(this.selectedItem.leviesMaster.leviesMasterId);
      this.itemsList.editItem(this.selectedItem);
    }
    this.addingNew = false;
    this.onModalLoaded();
    this.AllowingEdit();
    this.flexDetail.refresh();

  }

  /**
   * This function allow the user to edit the Levis detail
   * if the date of that detail is greater than the current date.
   */
  private AllowingEdit() {

    this.isParentDisabled = false;

    let milliSecondsInOneDay: Number = 86400000;

    // Number of days from  01 January, 1970
    let _Day: Number = Math.round(new Date().valueOf() / milliSecondsInOneDay.valueOf());

    if (AppUtility.isValidVariable(this.detailList)) {
      for (let i = 0; i < this.detailList.items.length; i++) {

        // Number of days from  01 January, 1970
        let _dayOfRecord: Number =
          Math.round(this.detailList.items[i].effectiveDate.valueOf() /
            milliSecondsInOneDay.valueOf());


        if (isNaN(_dayOfRecord.valueOf()))
          _dayOfRecord = Math.round(Date.parse(
            this.detailList.items[i].effectiveDate.valueOf()
          ).valueOf() / milliSecondsInOneDay.valueOf());

        if (_dayOfRecord >= _Day) {
          if (this.detailList.items[i].leviesDetailId == null) {
            this.detailList.items[i].validFrom = true;
            this.detailList.items[i].newElement = true;
          }
          else {
            this.detailList.items[i].validFrom = true;
            this.detailList.items[i].newElement = false;
          }
        }
        else {
          this.isParentDisabled = true;
          this.detailList.items[i].validFrom = false;
          this.detailList.items[i].newElement = false;
        }
      }
      this.detailList.refresh();
    }
  }






  private isUnique() {
     
    if (this.isTransactionType === true) {
      if (this.isBondFieldsRequired) {
        if (AppUtility.isValidVariable(this.detailList)) {
          for (let i = 0; i < this.detailList.items.length; i++) {

            let bC, bT, sBC, sBT;
            if (AppUtility.isValidVariable(this.detailList.items[i].bondCategory)) {
              bC = this.detailList.items[i].bondCategory.categoryId;
            }
            else {
              bC = null;
            }

            if (AppUtility.isValidVariable(this.detailList.items[i].bondType)) {
              bT = this.detailList.items[i].bondType.bondTypeId;
            }
            else {
              bT = null;
            }

            if (AppUtility.isValidVariable(this.selectedDetailItem.bondCategory) && !AppUtility.isValidVariable(this.selectedDetailItem.bondCategory.categoryId)) {
              sBC = null;
            }
            else if (!AppUtility.isValidVariable(this.selectedDetailItem.bondCategory)) {
              sBC = null;
            }
            else {
              sBC = this.selectedDetailItem.bondCategory;
            }


            if (AppUtility.isValidVariable(this.selectedDetailItem.bondType) && !AppUtility.isValidVariable(this.selectedDetailItem.bondType.bondTypeId)) {
              sBT = null;
            }
            else if (!AppUtility.isValidVariable(this.selectedDetailItem.bondType)) {
              sBC = null;
            }
            else {
              sBT = this.selectedDetailItem.bondType;
            }


            if (AppUtility.isValidVariable(this.selectedDetailItem.effectiveDate)) {
              var d1 = this.datePipe.transform(this.selectedDetailItem.effectiveDate, 'yyyy-MM-dd');
            }


             ////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////  @By Faizan Repo Slab range issue 15-04-24
            ////////////////////////////////////////////////////////////////////////////////////////////////
            if(!this.isRepo){
              if (this.selectedDetailItem.traansactionTypesExchange && AppUtility.isValidVariable(this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId)) {
                if (this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId == this.detailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId
                  && this.detailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId
                  && this.detailList.items[i].levyMode === this.selectedDetailItem.levyMode
                  && this.detailList.items[i].appliedTo === this.selectedDetailItem.appliedTo
                  && (this.detailList.items[i].bondNature.bondNatureId === this.selectedDetailItem.bondNature.bondNatureId)
                  && ((sBC == null) ? this.detailList.items[i].bondCategory === sBC : bC === this.selectedDetailItem.bondCategory.categoryId)
                  && ((sBT == null) ? this.detailList.items[i].bondType === sBT : bT === this.selectedDetailItem.bondType.bondTypeId)
                  ) {
                  switch (this.lang) {
                    case 'en':
                      this.errorMessage = 'Levy details already exist.';
                      this.dialogCmp.statusMsg = this.errorMessage;
                      this.dialogCmp.showAlartDialog('Error');
                      break;
                    case 'pt': 
                      this.errorMessage = 'Os detalhes do imposto já existem.';
                      this.dialogCmp.statusMsg = this.errorMessage;
                      this.dialogCmp.showAlartDialog('Error');
                      break;
                    default:
                      this.errorMessage = 'Levy details already exist.';
                      this.dialogCmp.statusMsg = this.errorMessage;
                      this.dialogCmp.showAlartDialog('Error');
                  }
  
                  return false;
                }
              }
            } 
             ////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////
       



          }
        }

      }
      else if (!this.isBondFieldsRequired) {

        if (AppUtility.isValidVariable(this.selectedDetailItem.effectiveDate)) {
          var d1 = this.datePipe.transform(this.selectedDetailItem.effectiveDate, 'yyyy-MM-dd');
        }


        if (AppUtility.isValidVariable(this.detailList)) {
          for (let i = 0; i < this.detailList.items.length; i++) {
            if (this.selectedDetailItem.traansactionTypesExchange && AppUtility.isValidVariable(this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId)) {
              if (this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId == this.detailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId
                && this.detailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId
                && this.detailList.items[i].levyMode === this.selectedDetailItem.levyMode
                && this.detailList.items[i].appliedTo === this.selectedDetailItem.appliedTo
                && (d1 <= (this.detailList.items[i].effectiveToDate))) {

                switch (this.lang) {
                  case 'en':
                    this.errorMessage = 'Levy details already exist.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                    break;
                  case 'pt':
                    this.errorMessage = 'Os detalhes do imposto já existem.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                    break;
                  default:
                    this.errorMessage = 'Levy details already exist.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }

                return false;
              }
            }
          }
        }
      }
    }
    else {
      return true;
    }

    return true;

  }



  private isUniqueIVL(leviesId : any) {
     
     if (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVL_ID) {
        if (AppUtility.isValidVariable(this.detailList)) {
          for (let i = 0; i < this.detailList.items.length; i++) {
            if (AppUtility.isValidVariable(this.selectedLeviesIds) && !AppUtility.isEmptyArray(this.selectedLeviesIds)) {
              if (AppUtility.isValidVariable(this.detailList.items[i].ivaLeviesMaster) && AppUtility.isValidVariable(leviesId) 
               &&  this.detailList.items[i].ivaLeviesMaster.leviesMasterId === leviesId.leviesMasterId) {
                switch (this.lang) {
                  case 'en':
                    this.errorMessage = 'Levy details already exist.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                    break;
                  case 'pt':
                    this.errorMessage = 'Os detalhes do imposto já existem.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                    break;
                  default:
                    this.errorMessage = 'Levy details already exist.';
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }

                return false;
              }
            }
          }
        }
      }
 
    return true;

  }



 

  public onEditDetailAction() {
    this.today = new Date();
    this.today.setDate(this.today.getDate() + 1);
    this.isDetailEditing = true;
    this.transactionTypeControl.isDisabled = false;
    this.selectedDetailItem = (JSON.parse(JSON.stringify(this.detailList.currentItem)));
    this.selectedDetailItem.effectiveDate = this.detailList.currentItem.effectiveDate;
    this.todayNewDate = new Date(this.selectedDetailItem.effectiveDate);

    let d = new Date();
    if(new Date(this.selectedDetailItem.effectiveToDate).getTime() <= d.getTime()){
      this.today = this.selectedDetailItem.effectiveToDate;
    }
   
    this.selectedDetailItem.effectiveToDate = this.detailList.currentItem.effectiveToDate;

    if (!AppUtility.isValidVariable(this.selectedDetailItem.asset)) {
      this.selectedDetailItem.asset = new AssetClass();
      this.selectedDetailItem.asset.assetId = null;
    }

    if (!AppUtility.isValidVariable(this.selectedDetailItem.bondCategory)) {
      this.selectedDetailItem.bondCategory = new BondCategory();
      this.selectedDetailItem.bondCategory.categoryId = null;
    }

    if (!AppUtility.isValidVariable(this.selectedDetailItem.bondNature)) {
      this.selectedDetailItem.bondNature = new BondNature();
      this.selectedDetailItem.bondNature.bondNatureId = null;
    }


    if (!AppUtility.isValidVariable(this.selectedDetailItem.bondType)) {
      this.selectedDetailItem.bondType = new BondType();
      this.selectedDetailItem.bondType.bondTypeId = null;
    }


    // if((this.detailList.currentItem.bondCategory !== null && AppUtility.isValidVariable(this.detailList.currentItem.bondCategory.categoryId)) 
    // && (AppUtility.isValidVariable(this.detailList.currentItem.bondNature.bondNatureId) && this.detailList.currentItem.bondNature !== null)){
    //   setTimeout(() => {
    //     this.selectedDetailItem.bondCategory.categoryId = this.detailList.currentItem.bondCategory.categoryId;
    //     this.selectedDetailItem.bondNature.bondNatureId = this.detailList.currentItem.bondNature.bondNatureId;
    //   }, 150);


    // }

    setTimeout(() => {
      if ((this.detailList.currentItem.bondCategory !== null && AppUtility.isValidVariable(this.detailList.currentItem.bondCategory.categoryId))) {
        this.selectedDetailItem.bondCategory.categoryId = this.detailList.currentItem.bondCategory.categoryId;
      }

      if ((this.detailList.currentItem.bondType !== null && AppUtility.isValidVariable(this.detailList.currentItem.bondType.bondTypeId))) {
        this.selectedDetailItem.bondType.bondTypeId = this.detailList.currentItem.bondType.bondTypeId;
      }

      if ((this.detailList.currentItem.bondNature !== null && AppUtility.isValidVariable(this.detailList.currentItem.bondNature.bondNatureId))) {
        this.selectedDetailItem.bondNature.bondNatureId = this.detailList.currentItem.bondNature.bondNatureId;
      }

      this.selectedDetailItem.appliedTo = this.detailList.currentItem.appliedTo;

    }, 150);



    this.selectedDetailItem.leviesMaster = JSON.parse(JSON.stringify(this.selectedItem.leviesMaster));
    if (this.lang === 'pt') { this.transactionTypeControl.placeholder = 'Selecione'; } else { this.transactionTypeControl.placeholder = 'Select'; }
    setTimeout(() => {
      let tempArr = [];
      if (this.transactionTypeList.length > 0) {
        for (let i = 0; i < this.transactionTypeList.length; i++) {
          this.transactionTypeList[i].$checked = false;
          if (AppUtility.isValidVariable(this.selectedDetailItem.traansactionTypesExchange)) {
            if (this.selectedDetailItem.traansactionTypesExchange.transactionTypeId == this.transactionTypeList[i].traansactionTypeExchangeId) {

              this.transactionTypeList[i].$checked = true;
              this.transactionTypeControl.placeholder = this.transactionTypeList[i].transactionType;
              tempArr.push(this.transactionTypeList[i]);
              const ctrl_: FormControl = (<any>this.myForm).controls.transactionType;
              ctrl_.setValidators(null);
              ctrl_.updateValueAndValidity();
            }
          }else{
            this.selectedDetailItem.traansactionTypesExchange = new TraansactionTypesExchange();
            this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
          }

        }
        this.transactionTypeControl.checkedItems = tempArr;
      }

      this.onValueTypeChangeEvent(this.selectedDetailItem.valueType);

      setTimeout(() => {
        if(AppUtility.isValidVariable(this.detailList.currentItem.ivaLeviesMaster) && !AppUtility.isEmptyArray(this.leviesList)){
          let tempLevy = [];
          let levyId = this.detailList.currentItem.ivaLeviesMaster.leviesMasterId;
          this.selectedDetailItem.ivaLeviesMaster = new ivaLeviesMaster();
          this.selectedDetailItem.ivaLeviesMaster.leviesMasterId = levyId;
        
            if (this.leviesList != null && this.leviesList.length > 0) {
          
                for (let j = 0; j < this.leviesList.length; j++) {
                  if (levyId  == this.leviesList[j].leviesMasterId) {
                    this.leviesList[j].selected = true;
                    this.leviesList[j].$checked = true;
                    tempLevy.push(this.leviesList[j]);
                  } else {
                    this.leviesList[j].selected = false;
                    this.leviesList[j].$checked = false;
                  }
                }
              
                if (AppUtility.isValidVariable(this.cmbLevy) && !this.cmbLevy.containsFocus())
                  this.cmbLevy.checkedItems = tempLevy;
                  this.cmbLevy.refresh();
             
            
            }
        }
      }, 500);


    }, 250);



  }

  public onLevyRateChange(LevyRate: number) {
    if (LevyRate.valueOf() < 0 || LevyRate.valueOf() > this.maxLevyRate)
      this.LevyRateError = true;
    else
      this.LevyRateError = false;
  }

  onEditDetailDelete() {
    if (this.detailList.items.length > 1) {
      this.selectedItem.traansactionTypesExchange = this.transactionTypeList[1];
      this.deleteCurrentItem();
      this.AllowingEdit();
    }
    else {
      if (this.lang === 'pt') {
        this.dialogCmp.statusMsg = 'Pelo menos 1 item é necessário no detalhe de taxa do cliente.';
      }
      else {
        this.dialogCmp.statusMsg = 'At least 1 item is required in Client Levy Detail.';
      }

      this.dialogCmp.showAlartDialog('Warning');
    }
    // alert('Atleast 1 item is required in Client Levy Detail.');
  }

  public deleteCurrentItem() {
    this.detailList.remove(this.detailList.currentItem);
  }

  public onValueTypeChangeEvent(_isPercentage: String) {

     
     
    this.isPercentageOnLevies = false;
     if(_isPercentage == 'PL' && this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVL_ID){
      this.isPercentageOnLevies = true;
      const ctrl: FormControl = (<any>this.myForm).controls.levyId;
      ctrl.setValidators(Validators.required);
      ctrl.updateValueAndValidity();
     
     }
   else if (_isPercentage == 'F' && (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_SETTLEMENT_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_SETTLEMENT_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_TRADING_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_IVA_ID)) {
        this.myForm.get('levyId').clearValidators();
        this.myForm.get('levyId').updateValueAndValidity();
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por compartilhamento)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Share)';
      }
      this.maxLevyRate = 999999.9999;

    }
    else if (_isPercentage == 'F' && (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_AR_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_AC_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_AM_ID)) {
        this.myForm.get('levyId').clearValidators();
        this.myForm.get('levyId').updateValueAndValidity();
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por conta)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Account)';
      }
      this.maxLevyRate = 999999.9999;
    }
    else if (_isPercentage == 'F' && (this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_DC_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_PC_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_RC_ID
      || this.selectedItem.leviesMaster.levyCategories.id === AppConstants.LEVY_CATEGORY_WC_ID)) {
        this.myForm.get('levyId').clearValidators();
        this.myForm.get('levyId').updateValueAndValidity();
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (Por transação)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Per Transaction)';
      }
      this.maxLevyRate = 999999.9999;
    }
    else {
      this.myForm.get('levyId').clearValidators();
      this.myForm.get('levyId').updateValueAndValidity();
      if (this.lang === 'pt') {
        this.levyRateLabelModalDisplay = 'Valor da taxa (geral)';
      }
      else {
        this.levyRateLabelModalDisplay = 'Levy Value (Overall)';
      }
      this.maxLevyRate = 100;
    }

    if (this.selectedDetailItem.levyRate.valueOf() < 0 || this.selectedDetailItem.levyRate > this.maxLevyRate) {
      this.LevyRateError = true;
    }
    else {
      this.LevyRateError = false;
    }
  }

  public FinalSave() {

    const ctrl_: FormControl = (<any>this.myForm).controls.transactionType;
    ctrl_.setValidators(null);
    ctrl_.updateValueAndValidity();

    const ctrl: FormControl = (<any>this.myForm).controls.appliesTo;
    ctrl.setValidators(null);
    ctrl.updateValueAndValidity();


    this.finalSaveUpdate = true;
    this.isEditing = false;
  }


  public FinalUpdate() {
    this.finalSaveUpdate = true;
    const ctrl_: FormControl = (<any>this.myForm).controls.transactionType;
    ctrl_.setValidators(null);
    ctrl_.updateValueAndValidity();

    const ctrl: FormControl = (<any>this.myForm).controls.appliesTo;
    ctrl.setValidators(null);
    ctrl.updateValueAndValidity();
  }


  public onSaveAction(model: any, isValid: boolean) {


    if (!this.LevyRateError) {
      this.isSubmitted = true;
      if (this.finalSaveUpdate) {

        if (this.isEditing) {
          if (AppUtility.isValidVariable(this.detailList)) {
            let tempArray: ClientLevieDetail[] = [];
            for (let i = 0; i < this.detailList.items.length; i++) {
              tempArray[i] = new ClientLevieDetail();
              this.detailList.items[i].leviesMaster = this.selectedItem.leviesMaster;
              tempArray[i] = this.detailList.items[i];


            }
            this.loader.show();
            this.listingService.updateLevies(tempArray).subscribe(
              data => {
                this.loader.hide();
                this.detailList.commitEdit();
                // this.clearFields(true, true);
                //alert(this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId + " ," + this.transactionTypeList[0].traansactionTypeExchangeId);
                //if (this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId == this.transactionTypeList[0].traansactionTypeExchangeId) {
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
                this.dialogCmp.showAlartDialog('Success');
                //}
                // alert(AppConstants.MSG_RECORD_UPDATED);
                this.populateClientLevieMasterList();
                if (AppUtility.isValidVariable(this.itemsList)) {
                  this.itemsList.refresh();
                }
                this.flex.refresh();
                if (AppUtility.isValidVariable(this.itemsList))
                  AppUtility.moveSelectionToLastItem(this.itemsList);

              },
              err => {
                this.loader.hide();
                this.errorMessage = err;
                this.hideForm = true;
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');

              }
            );
          }
        }
        else {
          if (AppUtility.isValidVariable(this.detailList)) {
            let tempArray: ClientLevieDetail[] = [];
            for (let i = 0; i < this.detailList.items.length; i++) {
              tempArray[i] = new ClientLevieDetail();
              this.detailList.items[i].leviesMaster = (JSON.parse(JSON.stringify(this.selectedItem.leviesMaster)));
              tempArray[i] = this.detailList.items[i];

            }
            this.loader.show();
            if (!(AppUtility.isValidVariable(ClientLeviePage._exchangeid)))
              ClientLeviePage._exchangeid = this.selectedItem.leviesMaster.exchange.exchangeId;
            this.listingService.saveLevies(tempArray).subscribe(
              data => {
                this.loader.hide();

                if (AppUtility.isEmpty(this.itemsList))
                  this.itemsList = new wjcCore.CollectionView;
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                this.dialogCmp.showAlartDialog('Success');

                this.populateClientLevieMasterList();
                if (AppUtility.isValidVariable(this.itemsList))
                  this.itemsList.refresh();
                AppUtility.moveSelectionToLastItem(this.itemsList);
                this.flex.refresh();

              },
              err => {
                this.loader.hide();
                this.clearFields(false, true);
                this.hideForm = true;
                this.errorMessage = err;
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');

              }
            );
            this.selectedDetailItem.traansactionTypesExchange = this.transactionTypeList[0];

          }
          else {
            // alert('Atleast 1 item is required in Client Levy Detail.');
            if (this.lang === 'pt') {
              this.dialogCmp.statusMsg = 'Pelo menos 1 item é necessário no detalhe de taxa do cliente.';
            }
            else {
              this.dialogCmp.statusMsg = 'At least 1 item is required in Client Levy Detail.';
            }
            this.dialogCmp.showAlartDialog('Warning');

            this.clearFields(false, true);
          }
        }
      }
    }
    else {
      if (isValid) {
        let b1: boolean = this.addingNew;
        let b2: boolean = this.isEditing;
        if (!this.isDetailEditing)
          this.clearFields(false, true);
        this.addingNew = b1;
        this.isEditing = b2;

      }
    }
    this.finalSaveUpdate = false;

  }
  /***************************************
 *          Private Methods
 **************************************/

  private populateTransactionTypeList(exchangeId: Number) {
    this.loader.show();
    this.listingService.getTransactionTypeByExchange(exchangeId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (!AppUtility.isEmptyArray(restData)) {
            this.transactionTypeList = restData;
            // this.disabledCheckbox = true;
            // this.transactionTypeControl.isDisabled = true;
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error });
  }



  private populateTransactionTypeByAssetClassList(exchangeId: Number, assetId: Number) {
    this.loader.show();
    this.listingService.getTransactionTypeByAssetExchange(exchangeId, assetId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (!AppUtility.isEmptyArray(restData)) {
            this.transactionTypeList = restData;
            // this.disabledCheckbox = true;
            // this.transactionTypeControl.isDisabled = true;
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error });
  }



  /**
   * Getting the Master record for selected Exchange.
   */
  private populateClientLevieMasterList() {
    this.loader.show();
    this.listingService.getLeviesByBroker(AppConstants.participantId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.itemsList = new wjcCore.CollectionView();
            this.flex.refresh();

            // alert(this.errorMessage);
            // this.dialogCmp.statusMsg = this.errorMessage;
            // this.dialogCmp.showAlartDialog('Error');

          } else {
            this.itemsList = new wjcCore.CollectionView(restData);
            restData.sort((a: any, b: any) => {
              if (a.exchange.exchangeCode.toLowerCase() < b.exchange.exchangeCode.toLowerCase()) return -1;
              if (a.exchange.exchangeCode.toLowerCase() > b.exchange.exchangeCode.toLowerCase()) return 1;
              return 0;
            });
          }
        },
        error => {
          this.loader.hide();
          this.errorMessage = <any>error;
          this.dialogCmp.statusMsg = this.errorMessage;
          this.dialogCmp.showAlartDialog('Error');
        });
  }

  private getClientLevieDetailList(_leviesMasterId: Number) {
    this.listingService.getClientLevieDetailList(_leviesMasterId, AppConstants.participantId)
      .subscribe(
        restData => {

          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.detailList = new wjcCore.CollectionView();
            this.flexDetail.refresh();
            //alert(this.errorMessage);
          } else {

            restData.map((element: any) => {
              if (AppUtility.isValidVariable(element.asset)) {
                element.assetClassDisplay_ = element.asset.assetName;
              }

              if (AppUtility.isValidVariable(element.bondNature)) {
                element.bondNatureDisplay_ = element.bondNature.bondNatureDesc;
              }
              else {
                element.bondNatureDisplay_ = "";
              }


              if (AppUtility.isValidVariable(element.bondCategory)) {
                element.bondCategoryDisplay_ = element.bondCategory.category;
              }
              else if (AppUtility.isValidVariable(element.asset) && element.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID && !AppUtility.isValidVariable(element.bondCategory)) {
                element.bondCategoryDisplay_ = "All";
              }
              else {
                element.bondCategoryDisplay_ = "";
              }

              if (AppUtility.isValidVariable(element.bondType)) {
                element.bondTypeDisplay_ = element.bondType.bondType;
              }
              else if (AppUtility.isValidVariable(element.asset) && element.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID && !AppUtility.isValidVariable(element.bondType)) {
                element.bondTypeDisplay_ = "All";
              }
              else {
                element.bondTypeDisplay_ = "";
              }




              if (AppUtility.isValidVariable(element.valueType)) {
                if (element.valueType === 'F') {
                  element.valueTypeDisplay_ = "Fixed";
                }
                else if (element.valueType === 'PG') {
                  element.valueTypeDisplay_ = "Percentage on gross amount";
                }
                else if (element.valueType === 'PC') {
                  element.valueTypeDisplay_ = "Percentage on commission";
                }
                else if (element.valueType === 'PA') {
                  element.valueTypeDisplay_ = "Percentage on clean amount";
                }
                else if (element.valueType === 'PL') {
                  element.valueTypeDisplay_ = "Percentage on Levies";
                }
                else {
                  element.valueTypeDisplay_ = null;
                }
              }

              if (element.levyMode === 'T') {
                element.levyModeDisplay_ = 'Trade';
              }
              else if (element.levyMode === 'P') {
                element.levyModeDisplay_ = 'Payment';
              }
              else if (element.levyMode === 'V') {
                element.levyModeDisplay_ = 'Vault Transaction';
              }
              else {
                element.levyModeDisplay_ = null
              }


              if (element.appliedTo == 'S')
                element.tradingSideDisplay_ = 'Sell';
              else if (element.appliedTo == 'B')
                element.tradingSideDisplay_ = 'Buy';
              else if (element.appliedTo == 'O')
                element.tradingSideDisplay_ = 'Both';
              else if (element.appliedTo == 'C')
                element.tradingSideDisplay_ = 'Coupon';
              else if (element.appliedTo == 'R')
                element.tradingSideDisplay_ = 'Reimbursement';
              else if (element.appliedTo == 'CR')
                element.tradingSideDisplay_ = 'Coupon, Reimbursement';
              else if (element.appliedTo == 'D')
                element.tradingSideDisplay_ = 'Deposit';
              else if (element.appliedTo == 'W')
                element.tradingSideDisplay_ = 'Withdrawal';
              else if (element.appliedTo == 'DW')
                element.tradingSideDisplay_ = 'Deposit, Withdrawal';
              else
                element.tradingSideDisplay_ = null;

              if (element.slabRange == 'D')
                element.slabRangeDisplay_ = 'Days';
              else
                element.slabRangeDisplay_ = "";



            if(AppUtility.isValidVariable(element.ivaLeviesMaster)){
              element.ivaLevyDisplay_ = element.ivaLeviesMaster.levyCode;
            }
          


            })
            this.detailList = new wjcCore.CollectionView(restData);

            this.AllowingEdit();
          }
        },
        error => {
          this.errorMessage = <any>error;
        });
  }

  private populateVoucherTypeList() {
    this.loader.show();
    this.listingService.getVoucherTypeList(AppConstants.participantId)
      .subscribe(
        restData => {
          this.loader.hide();
          this.voucherTypeList = restData;
          var vt: VoucherType = new VoucherType();
          vt.voucherTypeId = AppConstants.PLEASE_SELECT_VAL;
          vt.voucherType = AppConstants.PLEASE_SELECT_STR;
          this.voucherTypeList.unshift(vt);
        },
        error => { this.loader.hide(); this.errorMessage = <any>error });
  }



  public populateLevyCategory() {
    this.listingService.getLevyCategories()
      .subscribe(
        restData => {
          this.levyCategories = restData;
          var lc: LevyCategory = new LevyCategory();
          lc.id = AppConstants.PLEASE_SELECT_VAL;
          lc.description = AppConstants.PLEASE_SELECT_STR;
          this.levyCategories.unshift(lc);
        },
        error => { this.loader.hide(); this.errorMessage = <any>error });
  }

  private populateChartOfAccountList() {
    this.loader.show();
    this.listingService.getChartOfAccountBasicInfoList(AppConstants.participantId, true)
      .subscribe(
        restData => {
          this.loader.hide();
          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
          } else {
            this.chartOfAccountList = restData;
            var vt: BasicInfo = new BasicInfo();
            vt.id = AppConstants.PLEASE_SELECT_VAL;
            vt.displayName = AppConstants.PLEASE_SELECT_STR;
            this.chartOfAccountList.unshift(vt);
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error });
  }


  private populateBondNature() {

    this.listingService.getBondNature()
      .subscribe(
        restData => {

          this.bondNatureList = restData;
          var vt: BondNature = new BondNature();
          vt.bondNatureId = AppConstants.PLEASE_SELECT_VAL;
          vt.bondNatureDesc = AppConstants.PLEASE_SELECT_STR;
          this.bondNatureList.unshift(vt);
          this.bondNatureId.isDisabled = true;
        },
        error => { this.errorMessage = <any>error });
  }


  private populateExchangeList() {
    this.loader.show();
    this.listingService.getExchangeList()
      .subscribe(
        restData => {
          this.loader.hide();
          this.exchangeNameList = restData;

          let cs: Exchange = new Exchange();
          cs.exchangeId = AppConstants.PLEASE_SELECT_VAL;
          cs.exchangeCode = AppConstants.PLEASE_SELECT_STR;
          this.exchangeNameList.unshift(cs);
          this.selectedItem.leviesMaster.exchange.exchangeId = this.exchangeNameList[0].exchangeId;
          this.selectedDetailItem.leviesMaster.exchange.exchangeId = this.exchangeNameList[0].exchangeId;
        },
        error => {
          this.loader.hide();
          this.errorMessage = <any>error;;
        });
  }

  public onExchangeChangeEvent(exId) {
    if (AppUtility.isValidVariable(exId)) {
      this.selectedExchangeId = exId;
      this.populateTransactionTypeList(exId);

    }
  }


  public onChangeAssetEvent(assetId) {

    if (AppUtility.isValidVariable(assetId)) {
      this.populateTransactionTypeByAssetClassList(this.selectedExchangeId, assetId)
      if (assetId === AppConstants.ASSET_CLASS_BONDS_ID) {
        this.bondCategoryId.isDisabled = false;
        this.bondTypeId.isDisabled = false;
        this.bondNatureId.isDisabled = false;
        this.isBondFieldsRequired = true;

        this.selectedDetailItem.asset = new AssetClass();
        this.selectedDetailItem.bondNature = new BondNature();
        this.selectedDetailItem.bondCategory = new BondCategory();
        this.selectedDetailItem.bondType = new BondType();
        //  this.myForm.get('bondCategoryId').addValidators(Validators.required);
        this.myForm.get('bondNatureId').addValidators(Validators.required);
      }

      if (assetId !== AppConstants.ASSET_CLASS_BONDS_ID) {
        this.bondCategoryId.isDisabled = true;
        this.bondTypeId.isDisabled = true;
        this.bondNatureId.isDisabled = true;
        this.isBondFieldsRequired = false;

        this.selectedDetailItem.asset = new AssetClass();
        this.selectedDetailItem.bondNature = new BondNature();
        this.selectedDetailItem.bondCategory = new BondCategory();
        this.selectedDetailItem.bondType = new BondType();

        // this.myForm.get('bondCategoryId').clearValidators();
        this.myForm.get('bondNatureId').clearValidators();
      }
    }
    else {
      this.bondCategoryId.isDisabled = true;
      this.bondTypeId.isDisabled = true;
      this.bondNatureId.isDisabled = true;
      this.isBondFieldsRequired = false;

      this.selectedDetailItem.asset = new AssetClass();
      this.selectedDetailItem.bondNature = new BondNature();
      this.selectedDetailItem.bondCategory = new BondCategory();
      this.selectedDetailItem.bondType = new BondType();


      this.populateTransactionTypeList(this.selectedExchangeId);
      //  this.myForm.get('bondCategoryId').clearValidators();
      this.myForm.get('bondNatureId').clearValidators();
      this.myForm.get('transactionType').clearValidators();
    }
  }



  private addFormValidations() {
    this.myForm = this._fb.group({
      levyCode: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternString)])],
      voucherTypeId: ['', Validators.compose([Validators.required])],
      levyDescription: ['', Validators.compose([Validators.required])],
      vouNaration: ['', Validators.compose([Validators.required,])],
      chartOfAccountId: ['', Validators.compose([Validators.required])],
      exchangeName: ['', Validators.compose([Validators.required])],
      levyType: [''],
      transactionType: [''],
      effectiveDate: ['', Validators.compose([Validators.required])],
      levyRate: ['', Validators.compose([Validators.required])],
      appliesTo: [''],
      active: [''],
      levyCategory: ['', Validators.compose([Validators.required])],

      name: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternString)])],
      level: ['', Validators.compose([Validators.required])],
      recurrence: ['', Validators.compose([Validators.required])],
      marketName: [''],
      SecurityType: [''],
      effectiveToDate: ['', Validators.compose([Validators.required])],

      assetId: [''],
      bondCategoryId: [''],
      bondTypeId: [''],
      bondNatureId: [''],
      levyModeId: [''],
      valueTypeId: ['', Validators.compose([Validators.required])],
      levyFloor: [''],
      levyCeiling: [''],
      rangeFrom: [''],
      rangeTo: [''],
      slabRange: [''],

      levyId : [''],


    });
  }

  public hideModal() {
    jQuery('#add_new').modal('hide');   // hiding the modal on save/updating the record
  }

  public getNotification(btnClicked) {
    if (btnClicked == 'Success')
      this.hideModal();
  }



}
