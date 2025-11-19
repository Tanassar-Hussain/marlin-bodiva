'use strict';
import { Component, OnInit, AfterViewInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter, ElementRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';

import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility, } from 'app/app.utility';
import { Exchange } from 'app/models/exchange';

import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';


import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { IPagedCollectionView, } from '@grapecity/wijmo';
import { CommissionSlabDetail } from 'app/models/commission-slab-detail';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { TraansactionTypesExchange } from 'app/models/traansaction-type-exchange';
import { CommissionSlabMaster } from 'app/models/commission-slab-master';
import { Participant } from 'app/models/participant';
import { AssetClass } from 'app/models/asset_class';
import { BondNature } from 'app/models/bondNature';
import { BondCategory } from 'app/models/bond-category';
import { BondType } from 'app/models/bond-type';
import { ComboItem } from 'app/models/combo-item';
import { MatGridTileHeaderCssMatStyler } from '@angular/material/grid-list';

declare var jQuery: any;
@Component({
  selector: 'commission-slab-page',
  templateUrl: './commission-slab-page.html',
})

export class CommissionSlabPage implements OnInit, AfterViewInit {

  public static upperRangeMax: Number = 9999999999;
  public myForm: FormGroup;
  itemsList: wjcCore.CollectionView;
  slabDetailList: wjcCore.CollectionView;
  selectedItem: CommissionSlabDetail;
  selectedDetailItem: CommissionSlabDetail;

  commissionSlabList: any[];
  exchangesList: any[];
  transactionTypeList: any[];
  commissionModeList: any[];
  deliveryFPList: any[];
  commissionSlabDetailList: CommissionSlabDetail[];

  errorMessage: string;
  public recExist: boolean;
  public hideForm = false;
  public alertMessage: String;
  public isSubmitted: boolean;
  public disabled: boolean = true;
  public isDisabled: boolean;
  public isEditing: boolean;
  public showButton: boolean;
  public isSearched: boolean;
  public upperRangeError: boolean;
  public lowerRangeError: boolean;
  public deliveryCommError: Boolean;
  public differenceCommError: Boolean;
  public maxCommAmountError: Boolean;
  public isDetailEditing: boolean;
  public static _slabid: Number;
  public static _commissiontype: String;
  public searchButtonClass: boolean = true;
  public searchButtonTooltip: String;
  public addingNew: boolean;
  public finalSaveUpdate: boolean;
  public traansactionTypeExchangeId: Number

  public commisionRateLabelPageDisplay: String;
  public compulsoryError: boolean;
  private _pageSize = 0;

  public minValueDel: Number = 0.0000;
  public maxValueDel: Number = 9999999999.9999;

  public minValueDif: Number = 0.0000;
  public maxValueDif: Number = 9999999999.9999;
  //claims: any;

  @ViewChild('flex') flex: wjcGrid.FlexGrid;
  @ViewChild('flexDetail') flexDetail: wjcGrid.FlexGrid;
  @ViewChild('slabName') slabName: wjcInput.InputMask;
  @ViewChild('dialogCmp') dialogCmp: DialogCmp;
  @ViewChild('updateBtn') updateBtn: ElementRef;
  @ViewChild('saveBtn') saveBtn: ElementRef;
  @ViewChild('cmbTransactionType') cmbTransactionType: wjcInput.ComboBox;
  @ViewChild('cmbExchange') cmbExchange: wjcInput.ComboBox;
  @ViewChild('cmbCommissionMode') cmbCommissionMode: wjcInput.ComboBox;
  @ViewChild('cmbCommissionAppliedTo') cmbCommissionAppliedTo: wjcInput.ComboBox;
  @ViewChild('deliveryComm') txtDeliveryComm: wjcInput.InputNumber;
  @ViewChild('differenceComm') txtDifferenceComm: wjcInput.InputNumber;
  @ViewChild('slabGrid') slabGrid: wjcGrid.FlexGrid;
  @ViewChild('transactionType') transactionTypeControl: wjcInput.MultiSelect;


  @ViewChild('bondCategoryId') bondCategoryId: wjcInput.ComboBox;
  @ViewChild('bondTypeId') bondTypeId: wjcInput.ComboBox;
  @ViewChild('bondNatureId') bondNatureId: wjcInput.ComboBox;
  @ViewChild('cmbValueType') cmbValueType: wjcInput.ComboBox;


  allTransTypes: Boolean = false;
  lang: string;

  isBondFieldsRequired: boolean = false;
  assetClassList: any;
  bondNatureList: any;
  bondTypeList: any[];
  bondCategoryList: any[];
  appliesToList: any[];
  commModeListTrade: any[];
  commModeListPayment: any[];
  commModeListVault: any[];
  appliesTo: any;
  selectedExchangeId: any;
  isNotUnique: boolean;
  hideFieldsValidation: boolean = false;
  appliedOnList: any[] = [];
  valueTypeValuesArray: any[];
  valueTypeListData: any[];
  isAllTransactionType: boolean = false;
  valueTypeListDataRepo: any[] = [];
  isRepo: boolean = false;
  isDebt: boolean = true;

  public tabFocusChanged() {
    if (this.isEditing)
      this.updateBtn.nativeElement.focus();
    else
      this.saveBtn.nativeElement.focus();
  }

  constructor(private appState: AppState, private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2, private translate: TranslateService, private loader: FuseLoaderScreenService) {
    this.clearFields();
    this.hideForm = false;
    this.isSubmitted = false;
    this.isEditing = false;
    this.disabled = true;



    this.deliveryFPList = [
      {
        'value': AppConstants.NO_STRING,
        'abbreviation': AppConstants.FIXED_ABBREVIATION
      },
      {
        'value': AppConstants.YES_STRING,
        'abbreviation': AppConstants.PERCENTAGE_ABBREVIATION
      }
    ];


    // this.appliedToList = [
    //   {
    //     'value': AppConstants.PLEASE_SELECT_STR,
    //     'abbreviation': AppConstants.PLEASE_SELECT_VAL
    //   },
    //   {
    //     'value': AppConstants.CLEAN_SETTLEMENT_STRING,
    //     'abbreviation': AppConstants.CLEAN_SETTLEMENT_ABBRV
    //   },
    //   {
    //     'value': AppConstants.DIRTY_SETTLEMENT_STRING,
    //     'abbreviation': AppConstants.DIRTY_SETTLEMENT_ABBRV
    //   },
    // ];

    //this.claims = authService.claims;    
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________
  }

  public ngAfterViewInit() {
    var self = this;
    $('#add_new').on('shown.bs.modal', function () {
      self.slabName.focus();
      wjcGrid.FlexGrid.invalidateAll();
    });

    this.flexDetail.invalidate();
  }

  ngOnInit() {

    jQuery('.parsleyjs').parsley();

    // Populate Commission Slab List in DropDown in search option.
    this.populateCommissionSlabList();
    this.loadAssetClassList();
    this.populateBondNature();
    this.populateBondTypeList();
    this.populateBondCategoryList();
    // populate exchangesList
    this.populateExchangeList();

    this.getCommModeListTrade();
    this.getCommModeListPayment();
    this.getcommModeListVault();
   // this.getValueType();

    this.getAppliedOnList();
    this.getValueTypeBondsRepo();

    this.clearFields();

    // Add Form Validations
    this.addFormValidations();
  }

  /*********************************
 *      Public & Action Methods
 *********************************/

  public clearFields() {

    
    // this.hideFieldsValidation = true;
    this.isSubmitted = false;
    if (AppUtility.isValidVariable(this.myForm)) {
      this.myForm.markAsPristine();
    }

    if (AppUtility.isValidVariable(this.itemsList)) {
      this.itemsList.cancelEdit();
      this.itemsList.cancelNew();
    }

    if (AppUtility.isValidVariable(this.slabDetailList)) {
      this.slabDetailList.cancelEdit();
      this.slabDetailList.cancelNew();
    }
    this.traansactionTypeExchangeId = null;

    this.alertMessage = '';
    this.compulsoryError = false;
    this.hideForm = false;
    this.isEditing = false;
    this.addingNew = true;
    this.isDetailEditing = false;
    this.isSearched = false;
    this.upperRangeError = false;
    this.maxCommAmountError = false;
    this.lowerRangeError = false;
    this.deliveryCommError = false;
    this.differenceCommError = false;
    // this.searchButtonClass = 'btn btn-success btn-sm disabled';
    this.searchButtonClass = true;
    this.isAllTransactionType = false;
    this.isDebt = true;
    this.isRepo = false;

    this.finalSaveUpdate = false;
    if (this.lang === 'pt') {
      this.searchButtonTooltip = 'Selecione a laje de comissão primeiro';
    } else {
      this.searchButtonTooltip = 'Select Commission Slab first';
    }


    this.selectedItem = new CommissionSlabDetail();

    this.selectedItem.traansactionTypesExchange = new TraansactionTypesExchange();
    this.selectedItem.traansactionTypesExchange.exchangeId = AppConstants.exchangeId;
    this.selectedItem.traansactionTypesExchange.exchange = null;
    this.selectedItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
    this.selectedItem.traansactionTypesExchange.transactionType = null;


    this.selectedItem.commissionSlabDetailID = null;
    this.selectedItem.lowerRange = 0;
    this.selectedItem.upperRange = this.selectedItem.lowerRange.valueOf() + 1;

    this.selectedItem.deliveryComm = 0.000000;
    this.selectedItem.differenceComm = 0.000000;
    this.selectedItem.deliveryFP = 'F';
    this.selectedItem.differenceFP = 'F';
    this.selectedItem.deliveryFPDisplay_ = 'N';
    this.selectedItem.differenceFPDisplay_ = 'N';

    this.selectedItem.commissionSlabMaster = new CommissionSlabMaster();
    this.selectedItem.commissionSlabMaster.minCommAmount = 0;
    this.selectedItem.commissionSlabMaster.maxCommAmount = 0;
    this.selectedItem.commissionSlabMaster.minMaxCommFlag = 0;

    if (!AppUtility.isEmptyArray(this.deliveryFPList)) {
      this.selectedItem.deliveryFP = this.deliveryFPList[0].abbreviation;
      this.selectedItem.differenceFP = this.deliveryFPList[0].abbreviation;
    }

    if (!AppUtility.isEmptyArray(this.commissionSlabList)) {
      this.selectedItem.commissionSlabMaster.commissionSlabId = this.commissionSlabList[0].commissionSlabId;
      this.selectedItem.commissionMode = null;
      this.selectedItem.applyDelCommission = 0;

      this.selectedItem.commissionSlabMaster.slabName = this.commissionSlabList[0].slabName;
      this.selectedItem.commissionSlabMaster.minCommAmount = 0;
      this.selectedItem.commissionSlabMaster.maxCommAmount = 0;
      this.selectedItem.commissionSlabMaster.minMaxCommFlag = 0;

      this.selectedItem.commissionSlabMaster.slabNameDisplay_ = this.commissionSlabList[0].slabNameDisplay_;
      this.selectedItem.commissionSlabMaster.participant = new Participant();
      this.selectedItem.commissionSlabMaster.participant.participantId = AppConstants.participantId;
    }


    this.clearExchangesAndTransTypes();

    this.selectedDetailItem = new CommissionSlabDetail();

    this.selectedDetailItem.traansactionTypesExchange = new TraansactionTypesExchange();
    this.selectedDetailItem.traansactionTypesExchange.exchangeId = AppConstants.exchangeId;
    this.selectedDetailItem.traansactionTypesExchange.exchange = null;
    this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = null;
    this.selectedDetailItem.traansactionTypesExchange.transactionType = null;

    this.selectedDetailItem.commissionSlabDetailID = null;
    this.selectedDetailItem.lowerRange = 0;
    this.selectedDetailItem.upperRange = 1;

    this.selectedDetailItem.deliveryComm = 0.000000;
    this.selectedDetailItem.differenceComm = 0.000000;
    this.selectedDetailItem.deliveryFP = 'F';
    this.selectedDetailItem.differenceFP = 'F';
    this.selectedDetailItem.deliveryFPDisplay_ = 'N';
    this.selectedDetailItem.differenceFPDisplay_ = 'N';

    this.selectedDetailItem.appliedToSettlement = null;

    this.selectedDetailItem.commissionSlabMaster = new CommissionSlabMaster();
    if (!AppUtility.isEmptyArray(this.deliveryFPList)) {
      this.selectedDetailItem.deliveryFP = this.deliveryFPList[0].abbreviation;
      this.selectedDetailItem.differenceFP = this.deliveryFPList[0].abbreviation;
    }

    if (!AppUtility.isEmptyArray(this.commissionSlabList)) {
      this.selectedDetailItem.commissionSlabMaster.commissionSlabId = this.commissionSlabList[0].commissionSlabId;
      this.selectedDetailItem.commissionMode = null;
      this.selectedDetailItem.applyDelCommission = 0;

      this.selectedDetailItem.commissionSlabMaster.slabName = this.commissionSlabList[0].slabName;

      this.selectedDetailItem.commissionSlabMaster.minCommAmount = 0;
      this.selectedDetailItem.commissionSlabMaster.maxCommAmount = 0;
      this.selectedDetailItem.commissionSlabMaster.minMaxCommFlag = 0;

      this.selectedDetailItem.commissionSlabMaster.slabNameDisplay_ = this.commissionSlabList[0].slabNameDisplay_;
      this.selectedDetailItem.commissionSlabMaster.participant = new Participant();
      this.selectedDetailItem.commissionSlabMaster.participant.participantId = AppConstants.participantId;
    }

    //  if (!AppUtility.isEmptyArray(this.exchangesList)) {
    //    this.selectedDetailItem.traansactionTypesExchange.exchangeId = this.exchangesList[0].exchangeId;
    //    this.selectedDetailItem.traansactionTypesExchange.exchange = this.exchangesList[0].exchangeName;
    //  }

    //  if (!AppUtility.isEmptyArray(this.transactionTypeList)) {
    //    this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.transactionTypeList[0].traansactionTypeExchangeId;
    //    this.selectedDetailItem.traansactionTypesExchange.transactionType = this.transactionTypeList[0].transactionType;
    //  }


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
    this.selectedDetailItem.valueType = "";
    this.selectedDetailItem.valueTypeRepo = "";

    this.minValueDel = 0.0000;
    this.maxValueDel = 9999999999.9999;
    this.minValueDif = 0.0000;
    this.maxValueDif = 9999999999.9999;


    this.disabled = true;
  }

  public closeAlert() {
    this.compulsoryError = false;
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

  private populateBondNature() {

    this.listingService.getBondNature()
      .subscribe(
        restData => {

          this.bondNatureList = restData;
          var vt: BondNature = new BondNature();
          vt.bondNatureId = AppConstants.PLEASE_SELECT_VAL;
          vt.bondNatureDesc = AppConstants.PLEASE_SELECT_STR;
          this.bondNatureList.unshift(vt);

        },
        error => { this.errorMessage = <any>error });
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



  public getAppliedOnList = () => {
    let appliedOnArray = [];
    this.appliedOnList = [];
    this.translate.get(['Translation.Select', 'Translation.Trade', 'Translation.Payment', 'Translation.Vault Transaction']).subscribe((res: any) => {
      appliedOnArray.push(res['Translation.Select']);
      appliedOnArray.push(res['Translation.Trade']);
      appliedOnArray.push(res['Translation.Payment']);
      appliedOnArray.push(res['Translation.Vault Transaction']);

      let commModeValueArr = [null, 'T', 'P', 'V'];
      let commModeCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < appliedOnArray.length; i++) {
        cmbItem = new ComboItem(appliedOnArray[i], commModeValueArr[i]);
        commModeCmbList[i] = cmbItem;
      }
      this.appliedOnList = commModeCmbList;


    })
  }




  public onExchangeChangeEvent(exId) {
    if (AppUtility.isValidVariable(exId)) {
      this.selectedExchangeId = exId;
      //  this.populateTransactionTypeList(exId);
    }
  }

  public onModalLoaded() {
    $('#add_new').on('shown.bs.modal', function () {
      wjcGrid.FlexGrid.invalidateAll();
    });
    this.flexDetail.invalidate();
  }
  
  
  public onCancelAction() {
    this.clearFields();
    this.getSlabCommissionDetailList(CommissionSlabPage._slabid);
    this.populateCommissionSlabList();
    this.hideForm = false;

    if (AppUtility.isValidVariable(this.itemsList))
      this.itemsList.refresh();
    this.flex.refresh();
  }


  public onNewAction() {
    this.clearFields();
    this.hideForm = true;
    if (AppUtility.isValidVariable(this.slabDetailList)) {
      while (this.slabDetailList.items.length > 0) {
        this.slabDetailList.removeAt(0);
      }
      this.onModalLoaded();
    }
    this.addingNew = true;
  }
  public onSearchAction() {
     
    this.searchCommissionSlab(this.selectedItem.commissionSlabMaster.commissionSlabId);
  }
  private searchCommissionSlab(slabId: Number) {
    this.getSlabCommissionDetailList(slabId);
    this.flex.onLoadedRows();
    if (AppUtility.isValidVariable(this.itemsList)) {
      this.itemsList.items.sort((a: CommissionSlabDetail, b: CommissionSlabDetail) =>
        a.lowerRange.valueOf() - b.lowerRange.valueOf());
    }
  }

  public loadObject(selectedDetailItem: CommissionSlabDetail, selectedItem: CommissionSlabDetail) {
    
    let temp_detail = this.slabDetailList.addNew();
    if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_EQUITIES
    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_BONDS_ID) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_BONDS
    }
    else if (selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
      temp_detail.assetClassDisplay_ = AppConstants.SECURITY_TYPE_ETF
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
    else{
      temp_detail.bondNatureDisplay_ = "";
    }



    if (AppUtility.isValidVariable(selectedDetailItem.bondCategory) && AppUtility.isValidVariable(selectedDetailItem.bondCategory.categoryId)) {
      if (selectedDetailItem.bondCategory.categoryId === AppConstants.BOND_CATEGORY_CORPORATE_ID) {
        temp_detail.bondCategoryDisplay_ = "Corporate"
      }
      else if (selectedDetailItem.bondCategory.categoryId === AppConstants.BOND_CATEGORY_GOVT_ID) {
        temp_detail.bondCategoryDisplay_ = "Government"
      }
    }
    else if (this.isBondFieldsRequired) {
      temp_detail.bondCategoryDisplay_ = "ALL";
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


    if (selectedDetailItem.appliedOn === 'T') {
      temp_detail.appliedToDisplay_ = 'Trade';
    }
    else if (selectedDetailItem.appliedOn === 'P') {
      temp_detail.appliedToDisplay_ = 'Payment';
    }
    else if (selectedDetailItem.appliedOn === 'V') {
      temp_detail.appliedToDisplay_ = 'Vault Transaction';
    }
    else {
      temp_detail.appliedToDisplay_ = null
    }


     if(AppUtility.isValidVariable(selectedDetailItem.traansactionTypesExchange)){
        if(selectedDetailItem.traansactionTypesExchange.transactionType === AppConstants.MARKET_TYPE_REPO_){
           selectedDetailItem.valueType = selectedDetailItem.valueTypeRepo;
        }
     }

    if (selectedDetailItem.valueType === 'SA') {
      temp_detail.valueTypeDisplay_ = 'Settlement Amount';
    }
    else if (selectedDetailItem.valueType === 'CA') {
      temp_detail.valueTypeDisplay_ = 'Clean Settlement Amount';
    }
    else if (selectedDetailItem.valueType === 'PP') {
      temp_detail.valueTypeDisplay_ = 'Purchase Price';
    }
    else if (selectedDetailItem.valueType === 'RP') {
      temp_detail.valueTypeDisplay_ = 'Repurchase Price';
    }
    else {
      temp_detail.valueTypeDisplay_ = "";
    }

    if (selectedDetailItem.commissionMode == 'S')
      temp_detail.commModeDisplay_ = 'Sell';
    else if (selectedDetailItem.commissionMode == 'B')
      temp_detail.commModeDisplay_ = 'Buy';
    else if (selectedDetailItem.commissionMode == 'O')
      temp_detail.commModeDisplay_ = 'Both';
    else if (selectedDetailItem.commissionMode == 'C')
      temp_detail.commModeDisplay_ = 'Coupon';
    else if (selectedDetailItem.commissionMode == 'R')
      temp_detail.commModeDisplay_ = 'Reimbursement';
    else if (selectedDetailItem.commissionMode == 'CR')
      temp_detail.commModeDisplay_ = 'Coupon, Reimbursement';
    else if (selectedDetailItem.commissionMode == 'D')
      temp_detail.commModeDisplay_ = 'Deposit';
    else if (selectedDetailItem.commissionMode == 'W')
      temp_detail.commModeDisplay_ = 'Withdrawal';
    else if (selectedDetailItem.commissionMode == 'DW')
      temp_detail.commModeDisplay_ = 'Deposit, Withdrawal';
    else
      temp_detail.commModeDisplay_ = null;



    temp_detail.commissionSlabDetailID = selectedDetailItem.commissionSlabDetailID;
    temp_detail.lowerRange = selectedDetailItem.lowerRange;
    temp_detail.upperRange = selectedDetailItem.upperRange;

    temp_detail.deliveryComm = selectedDetailItem.deliveryComm;
    temp_detail.differenceComm = selectedDetailItem.differenceComm;
    temp_detail.deliveryFP = selectedDetailItem.deliveryFP;
    temp_detail.differenceFP = selectedDetailItem.differenceFP;
    temp_detail.deliveryFPDisplay_ = selectedDetailItem.deliveryFPDisplay_;
    temp_detail.differenceFPDisplay_ = selectedDetailItem.differenceFPDisplay_;

    temp_detail.commissionSlabMaster = selectedItem.commissionSlabMaster;
    temp_detail.commissionSlabMaster.commissionSlabId = selectedItem.commissionSlabMaster.commissionSlabId;
    temp_detail.commissionSlabMaster.slabName = selectedItem.commissionSlabMaster.slabName;
    temp_detail.commissionMode = selectedDetailItem.commissionMode;
    temp_detail.valueType = selectedDetailItem.valueType;
   

    temp_detail.applyDelCommission = selectedDetailItem.applyDelCommission;
    temp_detail.commissionModeDisplay_ = selectedDetailItem.commissionModeDisplay_;
    temp_detail.commissionSlabMaster.participant = new Participant();
    temp_detail.commissionSlabMaster.participant.participantId = AppConstants.participantId;

    temp_detail.traansactionTypesExchange = new TraansactionTypesExchange();
    if (this.selectedDetailItem.traansactionTypesExchange.exchangeId) {
      temp_detail.traansactionTypesExchange.exchangeId = selectedDetailItem.traansactionTypesExchange.exchangeId;
    }
    else {
      temp_detail.traansactionTypesExchange.exchangeId = AppConstants.exchangeId;
    }

    temp_detail.traansactionTypesExchange.traansactionTypeExchangeId = selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId;
    temp_detail.traansactionTypesExchange.exchange = selectedDetailItem.traansactionTypesExchange.exchange;
    temp_detail.traansactionTypesExchange.transactionType = selectedDetailItem.traansactionTypesExchange.transactionType;

    this.slabDetailList.commitNew();
    if (!AppUtility.isEmptyArray(this.exchangesList)) {
      this.selectedDetailItem.traansactionTypesExchange.exchangeId = AppConstants.exchangeId;
      this.selectedDetailItem.traansactionTypesExchange.exchange = this.exchangesList[0].exchangeName;
    }


    if (AppUtility.isValidVariable(selectedDetailItem.asset.assetId)) {
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


    if (this.isBondFieldsRequired == true) {
      if (selectedDetailItem.bondCategory && AppUtility.isValidVariable(selectedDetailItem.bondCategory.categoryId)) {
        temp_detail.bondCategory = selectedDetailItem.bondCategory;
        temp_detail.bondCategory.categoryId = selectedDetailItem.bondCategory.categoryId;
      }
      else {
        temp_detail.bondCategory = null;
      }
    }
    else {
      temp_detail.bondCategory = null;
    }



    if (this.isBondFieldsRequired == true) {
      if (selectedDetailItem.bondType && AppUtility.isValidVariable(selectedDetailItem.bondType.bondTypeId)) {
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


    temp_detail.appliedOn = selectedDetailItem.appliedOn;




    // this.selectedDetailItem.lowerRange = 0;
    // this.selectedDetailItem.upperRange = 1;

    // this.selectedDetailItem.deliveryComm = 0.000000;
    // this.selectedDetailItem.differenceComm = 0.000000;
    // this.selectedDetailItem.deliveryFP = 'F';
    // this.selectedDetailItem.differenceFP = 'F';
    // this.selectedDetailItem.deliveryFPDisplay_ = 'N';
    // this.selectedDetailItem.differenceFPDisplay_ = 'N';
    // this.selectedDetailItem.applyDelCommission = 0;

  }

  public clearExchangesAndTransTypes() {
    
    if (AppUtility.isValidVariable(this.myForm)) {
      // const ctrl_: FormControl = (<any>this.myForm).controls.exchangeName;
      // ctrl_.setValidators(null);
      // ctrl_.updateValueAndValidity();

      const ctrl_: FormControl = (<any>this.myForm).controls.exchangeId;
      ctrl_.setValidators(null);
      ctrl_.updateValueAndValidity();

      // const ctrl: FormControl = (<any>this.myForm).controls.transactionType;
      // ctrl.setValidators(null);
      // ctrl.updateValueAndValidity();

      const ctr2: FormControl = (<any>this.myForm).controls.commissionMode;
      ctr2.setValidators(null);
      ctr2.updateValueAndValidity();

      const ctr3: FormControl = (<any>this.myForm).controls.commissionAppliedTo;
      ctr3.setValidators(Validators.required);
      ctr3.updateValueAndValidity();

    }
  }





















  public onAddNewRow() {
    
    this.finalSaveUpdate = false;
    this.hideFieldsValidation = false;
    if (AppUtility.isValidVariable(this.myForm)) {
      // const ctrl_: FormControl = (<any>this.myForm).controls.exchangeName;
      // ctrl_.setValidators(null);
      // ctrl_.updateValueAndValidity();

      const ctrl_: FormControl = (<any>this.myForm).controls.exchangeId;
      ctrl_.setValidators(Validators.required);
      ctrl_.updateValueAndValidity();

      // const ctrl: FormControl = (<any>this.myForm).controls.transactionType;
      // ctrl.setValidators(Validators.required);
      // ctrl.updateValueAndValidity();

      const ctr2: FormControl = (<any>this.myForm).controls.commissionMode;
      ctr2.setValidators(Validators.required);
      ctr2.updateValueAndValidity();

      const ctr3: FormControl = (<any>this.myForm).controls.commissionAppliedTo;
      ctr3.setValidators(Validators.required);
      ctr3.updateValueAndValidity();

       if(this.isDebt === true){
        const ctr4: FormControl = (<any>this.myForm).controls.valueType;
         ctr4.setValidators(Validators.required);
        ctr4.updateValueAndValidity();
       }

       if(this.isRepo === true){
        const ctr5: FormControl = (<any>this.myForm).controls.valueTypeRepo;
        ctr5.setValidators(Validators.required);
        ctr5.updateValueAndValidity();
       }


    }



    if (this.allTransTypes === false && this.transactionTypeControl.checkedItems.length == 0) {
      return;
    }


    if (this.allTransTypes) {
      let transList = []
      for (let i = 0; i < this.transactionTypeList.length; i++) {
        this.transactionTypeList[i].$checked = true;
        transList.push(this.transactionTypeList[i]);
      }
      this.transactionTypeControl.checkedItems = transList
      this.allTransTypes = false;
    }


    if (AppUtility.isValidVariable(this.cmbExchange.selectedValue) && this.transactionTypeControl.checkedItems.length > 0
      && AppUtility.isValidVariable(this.cmbCommissionMode.selectedValue) && (AppUtility.isValidVariable(this.cmbCommissionAppliedTo.selectedValue))) {

      this.hideFieldsValidation = true;

      for (let selectedTransactionType of this.transactionTypeControl.checkedItems) {
        this.selectedDetailItem.traansactionTypesExchange = new TraansactionTypesExchange();
        this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = selectedTransactionType.traansactionTypeExchangeId;
        this.selectedDetailItem.traansactionTypesExchange.transactionType = selectedTransactionType.transactionType;
        this.selectedDetailItem.traansactionTypesExchange.exchangeId = this.cmbExchange.selectedValue;

        if (!this.upperRangeError && !this.lowerRangeError) {
          if (this.checkValuesOverlaping()) {
            this.alertMessage = '';
            this.compulsoryError = false;
            this.isDisabled = false;
            if (this.selectedDetailItem.deliveryFP == 'P' && this.selectedDetailItem.deliveryComm > 100) {
              this.deliveryCommError = true;
            }
            else if (this.selectedDetailItem.differenceFP == 'P' && this.selectedDetailItem.differenceComm > 100) {
              this.differenceCommError = true;
            }
            else {
              this.deliveryCommError = false;
              this.differenceCommError = false;
              if (!this.isDetailEditing) {
                if (AppUtility.isValidVariable(this.slabDetailList) && this.slabDetailList.items.length) {
                  // this.selectedDetailItem.traansactionTypesExchange.transactionType = this.cmbTransactionType.text;
                  this.selectedDetailItem.traansactionTypesExchange.exchange = this.cmbExchange.text;
                  this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
                  //  this.clearExchangesAndTransTypes();
                }
                else {
                  // it is the 1st ever element to be added in the list.
                  this.onUpperRangeChange(this.selectedDetailItem.upperRange);
                  // this.onDeliveryFPChangeEvent(this.selectedDetailItem.deliveryFP);
                  // this.onDifferenceFPChangeEvent(this.selectedDetailItem.differenceFP);
                  this.slabDetailList = new wjcCore.CollectionView();
                  //  this.selectedDetailItem.traansactionTypesExchange.transactionType = this.cmbTransactionType.text;
                  this.selectedDetailItem.traansactionTypesExchange.exchange = this.cmbExchange.text;
                  this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
                  //  this.clearExchangesAndTransTypes();
                }
              }
              else {
                // this part will be executed in case of editing the detail records in Modal.
                this.deleteCurrentItem();
                this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
                this.isDetailEditing = false;
                this.clearExchangesAndTransTypes();
              }
            }
          } else {
            this.selectedDetailItem.traansactionTypesExchange.exchangeId = this.selectedExchangeId;
            switch (this.lang) {
              case 'en':
                this.errorMessage = 'Upper/Lower Range is overlapping or exceeding with existing slabs. Please Verify.';
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
                break;
              case 'pt':
                this.errorMessage = 'A faixa superior/inferior está se sobrepondo ou excedendo as lajes existentes. Por favor verifique.';
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
                break;
              default:
                this.errorMessage = 'Upper/Lower Range is overlapping or exceeding with existing slabs. Please Verify.';
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            }
            this.compulsoryError = true;
          }
        }

      }

    }
    else if (AppUtility.isValidVariable(this.cmbExchange.selectedValue) && this.transactionTypeControl.checkedItems.length == 0) {
      this.hideFieldsValidation = true;
      if (!this.upperRangeError && !this.lowerRangeError) {
        if (this.checkValuesOverlaping()) {
          this.alertMessage = '';
          this.compulsoryError = false;
          this.isDisabled = false;
          if (this.selectedDetailItem.deliveryFP == 'P' && this.selectedDetailItem.deliveryComm > 100) {
            this.deliveryCommError = true;
          }
          else if (this.selectedDetailItem.differenceFP == 'P' && this.selectedDetailItem.differenceComm > 100) {
            this.differenceCommError = true;
          }
          else {
            this.deliveryCommError = false;
            this.differenceCommError = false;
            if (!this.isDetailEditing) {
              if (AppUtility.isValidVariable(this.slabDetailList) && this.slabDetailList.items.length) {
                // this.selectedDetailItem.traansactionTypesExchange.transactionType = this.cmbTransactionType.text;
                this.selectedDetailItem.traansactionTypesExchange.exchange = this.cmbExchange.text;
                this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
                //  this.clearExchangesAndTransTypes();
              }
              else {
                // it is the 1st ever element to be added in the list.
                this.onUpperRangeChange(this.selectedDetailItem.upperRange);
                // this.onDeliveryFPChangeEvent(this.selectedDetailItem.deliveryFP);
                // this.onDifferenceFPChangeEvent(this.selectedDetailItem.differenceFP);
                this.slabDetailList = new wjcCore.CollectionView();
                // this.selectedDetailItem.traansactionTypesExchange.transactionType = this.cmbTransactionType.text;
                this.selectedDetailItem.traansactionTypesExchange.exchange = this.cmbExchange.text;
                this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
                //  this.clearExchangesAndTransTypes();
              }
            }
            else {
              // this part will be executed in case of editing the detail records in Modal.
              this.deleteCurrentItem();
              this.loadObject(JSON.parse(JSON.stringify(this.selectedDetailItem)), JSON.parse(JSON.stringify(this.selectedItem)));
              this.isDetailEditing = false;
              //  this.clearExchangesAndTransTypes();
            }
          }
        } else {
          this.selectedDetailItem.traansactionTypesExchange.exchangeId = this.selectedExchangeId;
          switch (this.lang) {
            case 'en':
              this.errorMessage = 'Upper/Lower Range is overlapping or exceeding with existing slabs. Please Verify.';
              this.dialogCmp.statusMsg = this.errorMessage;
              this.dialogCmp.showAlartDialog('Error');
              break;
            case 'pt':
              this.errorMessage = 'A faixa superior/inferior está se sobrepondo ou excedendo as lajes existentes. Por favor verifique.';
              this.dialogCmp.statusMsg = this.errorMessage;
              this.dialogCmp.showAlartDialog('Error');
              break;
            default:
              this.errorMessage = 'Upper/Lower Range is overlapping or exceeding with existing slabs. Please Verify.';
              this.dialogCmp.statusMsg = this.errorMessage;
              this.dialogCmp.showAlartDialog('Error');
          }
          this.compulsoryError = true;
        }
      }
    }



  }





  public onCommissionSlabChangeEvent(selectedSlabId): void {
    if (selectedSlabId == null) {
      // this.searchButtonClass = 'btn btn-success btn-sm disabled';
      this.searchButtonClass = true;
      if (this.lang === 'pt') {
        this.searchButtonTooltip = 'Selecione a laje de comissão primeiro';
      } else {
        this.searchButtonTooltip = 'Select Commission Slab first';
      }
    }
    else {
      // this.searchButtonClass = 'btn btn-success btn-sm';
      this.searchButtonClass = false;
      if (this.lang === 'pt') {
        this.searchButtonTooltip = 'Selecione';
      } else {
        this.searchButtonTooltip = 'Select';
      }
    }
  }

  public onTransactionTypeChangeEvent(stId) {
     
    if (AppUtility.isValidVariable(this.transactionTypeList) && AppUtility.isValidVariable(stId) && !AppUtility.isEmptyArray(stId)) {
      for (let i = 0; i < this.transactionTypeList.length; i++) {
        if (this.transactionTypeList[i].traansactionTypeExchangeId == stId) {
          this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.transactionTypeList[i].traansactionTypeExchangeId;
          this.selectedDetailItem.traansactionTypesExchange.transactionType = this.transactionTypeList[i].transactionType;
        }
      }

      if(this.selectedDetailItem.asset.assetId === AppConstants.ASSET_CLASS_ID_BONDS){
        for(let j = 0; j < stId.length; j++){
          if(stId.length == 1 && stId[j].transactionType === AppConstants.MARKET_TYPE_REPO_){
            this.myForm.get('valueTypeRepo').addValidators(Validators.required);
            this.myForm.get('valueTypeRepo').updateValueAndValidity();
            this.myForm.get('valueType').clearValidators();
            this.myForm.get('valueType').updateValueAndValidity();
                     this.isRepo = true;
                     this.isDebt = false;
          }
          else if(stId.length == 1 && stId[j].transactionType === AppConstants.MARKET_TYPE_DEBT_){
            this.myForm.get('valueTypeRepo').clearValidators();
            this.myForm.get('valueTypeRepo').updateValueAndValidity();
            this.myForm.get('valueType').addValidators(Validators.required);
            this.myForm.get('valueType').updateValueAndValidity();
                     this.isRepo = false;
                     this.isDebt = true;
          }else{
            this.myForm.get('valueTypeRepo').addValidators(Validators.required);
            this.myForm.get('valueType').addValidators(Validators.required);
            this.myForm.get('valueTypeRepo').updateValueAndValidity();
            this.myForm.get('valueType').updateValueAndValidity();
                 this.isRepo = true;
                 this.isDebt = true;
          }
       }
     }
      

    }

  }



  public changeAppliedOn = (event) => {
    this.appliesToList = [];
    if (AppUtility.isValidVariable(event)) {
      if (event === 'T') {
        this.commissionModeList = this.commModeListTrade;
      }

      if (event === 'P') {
        this.commissionModeList = this.commModeListPayment;
      }

      if (event === 'V') {
        this.commissionModeList = this.commModeListVault;
      }

    }
  }




  public getCommModeListTrade = () => {
    let commModeTradeArray = [];
    this.commModeListTrade = [];
    this.translate.get(['Translation.Select', 'Translation.Buy', 'Translation.Sell', 'Translation.Both']).subscribe((res: any) => {
      commModeTradeArray.push(res['Translation.Select']);
      commModeTradeArray.push(res['Translation.Buy']);
      commModeTradeArray.push(res['Translation.Sell']);
      commModeTradeArray.push(res['Translation.Both']);

      let commModeTradeValueArr = [null, AppConstants.BUY_ABBREVIATION, AppConstants.SELL_ABBREVIATION, AppConstants.BOTH_ABBREVIATION];
      let commModeTradeCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < commModeTradeArray.length; i++) {
        cmbItem = new ComboItem(commModeTradeArray[i], commModeTradeValueArr[i]);
        commModeTradeCmbList[i] = cmbItem;
      }
      this.commModeListTrade = commModeTradeCmbList;

    })
  }



  public getCommModeListPayment = () => {
    let commModePaymentArray = [];
    this.commModeListPayment = [];
    this.translate.get(['Translation.Select', 'Translation.Coupon', 'Translation.Reimbursement', 'Translation.Both']).subscribe((res: any) => {
      commModePaymentArray.push(res['Translation.Select']);
      commModePaymentArray.push(res['Translation.Coupon']);
      commModePaymentArray.push(res['Translation.Reimbursement']);
      commModePaymentArray.push(res['Translation.Both']);

      let levyApplyToPaymentValueArr = [null, 'C', 'R', 'CR'];
      let levyApplyToCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < commModePaymentArray.length; i++) {
        cmbItem = new ComboItem(commModePaymentArray[i], levyApplyToPaymentValueArr[i]);
        levyApplyToCmbList[i] = cmbItem;
      }
      this.commModeListPayment = levyApplyToCmbList;


    })
  }


  public getcommModeListVault = () => {
    let commModeVaultArray = [];
    this.commModeListVault = [];
    this.translate.get(['Translation.Select', 'Translation.Deposit', 'Translation.Withdrawal', 'Translation.Both']).subscribe((res: any) => {
      commModeVaultArray.push(res['Translation.Select']);
      commModeVaultArray.push(res['Translation.Deposit']);
      commModeVaultArray.push(res['Translation.Withdrawal']);
      commModeVaultArray.push(res['Translation.Both']);

      let commModeVaultValueArr = [null, 'D', 'W', 'DW'];
      let levyApplyToCmbList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < commModeVaultArray.length; i++) {
        cmbItem = new ComboItem(commModeVaultArray[i], commModeVaultValueArr[i]);
        levyApplyToCmbList[i] = cmbItem;
      }
      this.commModeListVault = levyApplyToCmbList;

    })
  }



  public getValueTypeBonds = () => {
    this.valueTypeListData = [];
    let valueTypeArray = [];
    this.valueTypeValuesArray = [];
    this.translate.get(['Translation.Select', 'Translation.Clean Settlement Amount', 'Translation.Settlement Amount']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Clean Settlement Amount']);
      valueTypeArray.push(res['Translation.Settlement Amount']);
      let valueTypeValuesArray = [null, 'CA', 'SA'];
      let valueTypeValuesList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValuesArray[i]);
        valueTypeValuesList[i] = cmbItem;
      }
      this.valueTypeListData = valueTypeValuesList;

    })
  }


  public getValueTypeBondsRepoDebt = () => {
     
    this.valueTypeListData = [];
    let valueTypeArray = [];
    this.valueTypeValuesArray = [];
    this.translate.get(['Translation.Select', 'Translation.Clean Settlement Amount', 'Translation.Settlement Amount', 'Translation.Purchase Price', 'Translation.Repurchase Price']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Clean Settlement Amount']);
      valueTypeArray.push(res['Translation.Settlement Amount']);
      valueTypeArray.push(res['Translation.Purchase Price']);
      valueTypeArray.push(res['Translation.Repurchase Price']);
      let valueTypeValuesArray = [null,'CA', 'SA', 'PP', 'RP'];
      let valueTypeValuesList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValuesArray[i]);
        valueTypeValuesList[i] = cmbItem;
      }
      this.valueTypeListData = valueTypeValuesList;

    })
  }

  public getValueTypeBondsRepo = () => {
     
    this.valueTypeListDataRepo = [];
    let valueTypeArray = [];
    this.valueTypeValuesArray = [];
    this.translate.get(['Translation.Select', 'Translation.Purchase Price', 'Translation.Repurchase Price']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Purchase Price']);
      valueTypeArray.push(res['Translation.Repurchase Price']);
      let valueTypeValuesArray = [null, 'PP', 'RP'];
      let valueTypeValuesList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValuesArray[i]);
        valueTypeValuesList[i] = cmbItem;
      }
      this.valueTypeListDataRepo = valueTypeValuesList;

    })
  }



  public getValueTypeEquities = () => {
    this.valueTypeListData = [];
    let valueTypeArray = [];
    this.valueTypeValuesArray = [];
    this.translate.get(['Translation.Select', 'Translation.Clean Settlement Amount', 'Translation.Settlement Amount']).subscribe((res: any) => {
      valueTypeArray.push(res['Translation.Select']);
      valueTypeArray.push(res['Translation.Clean Settlement Amount']);
     
       

      let valueTypeValuesArray = [null, 'CA'];
      let valueTypeValuesList = [];
      let cmbItem: ComboItem;
      for (let i = 0; i < valueTypeArray.length; i++) {
        cmbItem = new ComboItem(valueTypeArray[i], valueTypeValuesArray[i]);
        valueTypeValuesList[i] = cmbItem;
      }
      this.valueTypeListData = valueTypeValuesList;

    })
  }






  public onChangeAssetEvent(assetId) {
    
    if (AppUtility.isValidVariable(assetId)) {
      this.populateTransactionTypeByAssetList(this.selectedExchangeId, assetId);
      if (assetId === AppConstants.ASSET_CLASS_BONDS_ID) {
        this.isDebt = true;
        this.isAllTransactionType = true;
        this.getValueTypeBonds();
        this.isBondFieldsRequired = true;
        this.myForm.get('valueType').addValidators(Validators.required);
        this.selectedDetailItem.asset = new AssetClass();
        this.selectedDetailItem.bondNature = new BondNature();
        this.selectedDetailItem.bondCategory = new BondCategory();
        this.selectedDetailItem.bondType = new BondType();
        //  this.myForm.get('bondCategoryId').addValidators(Validators.required);
        this.myForm.get('bondNatureId').addValidators(Validators.required);
       // this.myForm.get('valueType').addValidators(Validators.required);
      }

      if (assetId !== AppConstants.ASSET_CLASS_BONDS_ID) {
        this.isDebt = true;
        this.isAllTransactionType = false;
        this.getValueTypeEquities();
        this.isBondFieldsRequired = false;
        this.selectedDetailItem.asset = new AssetClass();
        this.selectedDetailItem.bondNature = new BondNature();
        this.selectedDetailItem.bondCategory = new BondCategory();
        this.selectedDetailItem.bondType = new BondType();
        //   this.myForm.get('bondCategoryId').clearValidators();
        this.myForm.get('bondNatureId').clearValidators();
        this.myForm.get('valueType').clearValidators();
        this.myForm.get('valueTypeRepo').clearValidators();
      }
    }
    else {
      this.isDebt = true;
      this.isAllTransactionType = false;
      this.getValueTypeEquities();
      this.isBondFieldsRequired = false;
      this.selectedDetailItem.asset = new AssetClass();
      this.selectedDetailItem.bondNature = new BondNature();
      this.selectedDetailItem.bondCategory = new BondCategory();
      this.selectedDetailItem.bondType = new BondType();
      // this.populateTransactionTypeList(this.selectedExchangeId);
     //   this.myForm.get('bondCategoryId').clearValidators();
      this.myForm.get('bondNatureId').clearValidators();
      this.myForm.get('valueType').clearValidators();
      this.myForm.get('valueTypeRepo').clearValidators();
    }

  }








  public onEditAction() {

    
    if (!AppUtility.isEmpty(this.itemsList.currentItem)) {
      this.clearFields();

      this.hideForm = true;
      this.isEditing = true;
      this.selectedItem = JSON.parse(JSON.stringify(this.itemsList.currentItem));
      this.clearExchangesAndTransTypes();
      this.itemsList.editItem(this.selectedItem);
    }
    this.populateChildItemsList(this.itemsList);

    this.slabDetailList.refresh();
    this.addingNew = false;
  }



  public populateChildItemsList(masterDataList: wjcCore.CollectionView) {
    let detailList = JSON.parse(JSON.stringify(masterDataList.items));
    /**
     * Sending the shallow copy of detail grid to modal by sorting
     * it on basis of lowerRange.
     */


    detailList.map((element: any) => {
    
      if(AppUtility.isValidVariable(element.asset)){
       element.assetClassDisplay_ = element.asset.assetName;
      }

      if (AppUtility.isValidVariable(element.bondCategory)) {
        element.bondCategoryDisplay_ = element.bondCategory.category;
      }
      else if (AppUtility.isValidVariable(element.asset) &&  element.asset.assetName === AppConstants.SECURITY_TYPE_BONDS && !AppUtility.isValidVariable(element.bondCategory)) {
        element.bondCategoryDisplay_ = "ALL";
      }

      if (AppUtility.isValidVariable(element.bondNature)) {
        element.bondNatureDisplay_ = element.bondNature.bondNatureDesc;
      }
      

      if (AppUtility.isValidVariable(element.bondType)) {
        element.bondTypeDisplay_ = element.bondType.bondType;
      }
      else if (AppUtility.isValidVariable(element.asset) && element.asset.assetName === AppConstants.SECURITY_TYPE_BONDS && !AppUtility.isValidVariable(element.bondType)) {
        element.bondTypeDisplay_ = "ALL";
      }


      if (element.appliedOn === 'T') {
        element.appliedToDisplay_ = 'Trade';
      }
      else if (element.appliedOn === 'P') {
        element.appliedToDisplay_ = 'Payment';
      }
      else if (element.appliedOn === 'V') {
        element.appliedToDisplay_ = 'Vault Transaction';
      }
      else {
        element.appliedToDisplay_ = null
      }


      if (element.valueType === 'SA') {
        element.valueTypeDisplay_ = 'Settlement Amount';
      }
      else if (element.valueType === 'CA') {
        element.valueTypeDisplay_ = 'Clean Settlement Amount';
      }
      else if (element.valueType === 'PP') {
        element.valueTypeDisplay_ = 'Purchase Price';
      }
      else if (element.valueType === 'RP') {
        element.valueTypeDisplay_ = 'Repurchase Price';
      }
      else {
        element.valueTypeDisplay_ = "";
      }
  




      if (element.commissionMode == 'S')
        element.commModeDisplay_ = 'Sell';
      else if (element.commissionMode == 'B')
        element.commModeDisplay_ = 'Buy';
      else if (element.commissionMode == 'O')
        element.commModeDisplay_ = 'Both';
      else if (element.commissionMode == 'C')
        element.commModeDisplay_ = 'Coupon';
      else if (element.commissionMode == 'R')
        element.commModeDisplay_ = 'Reimbursement';
      else if (element.commissionMode == 'CR')
        element.commModeDisplay_ = 'Coupon, Reimbursement';
      else if (element.commissionMode == 'D')
        element.commModeDisplay_ = 'Deposit';
      else if (element.commissionMode == 'W')
        element.commModeDisplay_ = 'Withdrawal';
      else if (element.commissionMode == 'DW')
        element.commModeDisplay_ = 'Deposit, Withdrawal';
      else
        element.commModeDisplay_ = null;

    })




    detailList.sort((a: CommissionSlabDetail, b: CommissionSlabDetail) =>
      a.lowerRange.valueOf() - b.lowerRange.valueOf());
    this.selectedDetailItem.lowerRange = 0;
    this.selectedDetailItem.upperRange = 1;
    this.slabDetailList = new wjcCore.CollectionView(detailList);
  }





  public onMaxCommAmountChange(maxCommAmount: number) {
    if (maxCommAmount < this.selectedDetailItem.commissionSlabMaster.minCommAmount || maxCommAmount < 0)
      this.maxCommAmountError = true;
    else
      this.maxCommAmountError = false;
  }



  public onUpperRangeChange(upperRange: Number) {
    if (upperRange.valueOf() <= this.selectedDetailItem.lowerRange.valueOf() || upperRange.valueOf() < 0)
      this.upperRangeError = true;
    else
      this.upperRangeError = false;
  }
  public onLowerRangeChange(lowerRange: number) {
    if (lowerRange.valueOf() < 0)
      this.lowerRangeError = true;
    else
      this.lowerRangeError = false;

    if (this.selectedDetailItem.upperRange.valueOf() <= lowerRange || this.selectedDetailItem.upperRange.valueOf() < 0)
      this.upperRangeError = true;
    else
      this.upperRangeError = false;
  }
  public onDeliveryFPChangeEvent(deliveryComm: String) {
    this.selectedDetailItem.deliveryFP = deliveryComm;
    this.selectedDetailItem.deliveryFPDisplay_ = 'N';
    if (deliveryComm == 'F') {
      this.minValueDel = 0.0000;
      this.maxValueDel = 9999999999.9999;
      //this.selectedDetailItem.deliveryComm = 0;
      this.selectedDetailItem.deliveryFPDisplay_ = 'N';
    }
    else {
      this.minValueDel = 0.0000;
      this.maxValueDel = 100.0000;
      // this.selectedDetailItem.deliveryComm = 0;
      this.selectedDetailItem.deliveryFPDisplay_ = 'Y';
    }
    // this.txtDeliveryComm.value = 0;
  }
  public onDifferenceFPChangeEvent(differenceComm: String) {
    this.selectedDetailItem.differenceFP = differenceComm;
    this.selectedDetailItem.differenceFPDisplay_ = 'N';
    if (differenceComm == 'F') {
      this.minValueDif = 0.0000;
      this.maxValueDif = 9999999999.9999;
      //this.selectedDetailItem.differenceComm = 0;
      this.selectedDetailItem.differenceFPDisplay_ = 'N';
    }
    else {
      this.minValueDif = 0.0000;
      this.maxValueDif = 100.0000;
      //this.selectedDetailItem.differenceComm = 0;
      this.selectedDetailItem.differenceFPDisplay_ = 'Y';
    }
    // this.txtDifferenceComm.value = 0;
  }

  public onMinMaxCommFlagChangeEvent(minMaxCommFlag: boolean) {
    this.disabled = true;
    if (minMaxCommFlag == true) {
      this.disabled = false;
    }
    else if (minMaxCommFlag == false) {
      this.disabled = true;
      this.selectedItem.commissionSlabMaster.minCommAmount = 0;
      this.selectedItem.commissionSlabMaster.maxCommAmount = 0;
    }
    // this.txtDifferenceComm.value = 0;
  }


  public onEditDetailAction() {
     
    this.isDetailEditing = true;
    this.selectedDetailItem = JSON.parse(JSON.stringify(this.slabDetailList.currentItem));


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
    setTimeout(() => {
      if ((this.slabDetailList.currentItem.bondNature !== null && AppUtility.isValidVariable(this.slabDetailList.currentItem.bondNature.bondNatureId))) {
          this.selectedDetailItem.bondNature.bondNatureId = this.slabDetailList.currentItem.bondNature.bondNatureId;
          this.selectedDetailItem.appliedOn = this.slabDetailList.currentItem.appliedOn;
          this.traansactionTypeExchangeId = this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId;
          this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.traansactionTypeExchangeId;
      }
      else {
          this.selectedDetailItem.appliedOn = this.slabDetailList.currentItem.appliedOn;
          this.traansactionTypeExchangeId = this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId;
          this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.traansactionTypeExchangeId;
      }
    
      if((this.slabDetailList.currentItem.bondCategory !== null && AppUtility.isValidVariable(this.slabDetailList.currentItem.bondCategory.categoryId))){
          this.selectedDetailItem.bondCategory.categoryId = this.slabDetailList.currentItem.bondCategory.categoryId;
      }
  
      if((this.slabDetailList.currentItem.bondType !== null && AppUtility.isValidVariable(this.slabDetailList.currentItem.bondType.bondTypeId))){
          this.selectedDetailItem.bondType.bondTypeId = this.slabDetailList.currentItem.bondType.bondTypeId;      
      }

    }, 150);
   
    setTimeout(() => {
      if (this.lang === 'pt') {
        this.transactionTypeControl.placeholder = 'Selecione';
      } else {
        this.transactionTypeControl.placeholder = 'Select';
      }
   
      let tempArr = [];
      if(this.transactionTypeList.length > 0){
        
        for (let i = 0; i < this.transactionTypeList.length; i++) {
          this.transactionTypeList[i].$checked = false;
          if (this.selectedDetailItem.traansactionTypesExchange.transactionTypeId == this.transactionTypeList[i].traansactionTypeExchangeId) {
            this.transactionTypeList[i].$checked = true;
            this.transactionTypeControl.placeholder = this.transactionTypeList[i].transactionType;
            this.transactionTypeControl.selectedValue = this.transactionTypeList[i].traansactionTypeExchangeId;
            tempArr.push(this.transactionTypeList[i]);
            const ctrl_: FormControl = (<any>this.myForm).controls.transactionType;
            ctrl_.setValidators(null);
            ctrl_.updateValueAndValidity();
          }
        }
        this.transactionTypeControl.checkedItems = tempArr;
      }
      this.selectedDetailItem.valueTypeRepo = this.slabDetailList.currentItem.valueType;
    }, 500);

  }





  onEditDetailDelete() {
    if (this.slabDetailList.items.length > 1) {
      this.isDetailEditing = false;
      this.deleteCurrentItem();
      this.selectedDetailItem.lowerRange = 0;
      this.selectedDetailItem.upperRange = 1;
      this.selectedDetailItem.deliveryComm = 0;
      this.selectedDetailItem.deliveryFP = 'F';
      this.selectedDetailItem.differenceComm = 0;
      this.selectedDetailItem.differenceFP = 'F';
      this.clearExchangesAndTransTypes();
    }
    else {
      if (this.lang === "pt") { this.dialogCmp.statusMsg = 'Pelo menos 1 item é necessário no detalhe da laje da comissão.'; }
      else {
        this.dialogCmp.statusMsg = 'At least 1 item is required in Commission Slab Detail.';
      }
      this.dialogCmp.showAlartDialog('Warning');
    }
  }
  public deleteCurrentItem() {
    this.slabDetailList.remove(this.slabDetailList.currentItem);
  }

  public FinalSave() {

    this.finalSaveUpdate = true;
    this.isEditing = false;

    this.clearExchangesAndTransTypes();
  }
  public FinalUpdate() {
    this.clearExchangesAndTransTypes();
    this.finalSaveUpdate = true;
  }
  public onSaveAction(model: any, isValid: boolean) {
    
    if (AppUtility.isValidVariable(this.slabDetailList) && this.slabDetailList.items.length > 0) {
      isValid = true;
    }

    this.isSubmitted = true;
    if (this.maxCommAmountError) {
      isValid = false;
    }
    if (this.finalSaveUpdate) {
      if (isValid) {
        this.loader.show();
        if (this.isEditing) {
          if (AppUtility.isValidVariable(this.slabDetailList)) {
            let tempArray: CommissionSlabDetail[] = [];
            for (let i = 0; i < this.slabDetailList.items.length; i++) {
              tempArray[i] = new CommissionSlabDetail();
              this.slabDetailList.items[i].commissionSlabMaster.slabName = model.slabName;
              this.slabDetailList.items[i].commissionSlabMaster.slabNameDisplay_ = model.slabName;
              //this.slabDetailList.items[i].commissionMode = model.commissionMode;
              this.slabDetailList.items[i].commissionSlabMaster.minMaxCommFlag = model.minMaxCommFlag;
              this.slabDetailList.items[i].commissionSlabMaster.maxCommAmount = model.maxCommAmount;
              this.slabDetailList.items[i].commissionSlabMaster.minCommAmount = model.minCommAmount;
              //this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId = model.transactionType;
              //this.slabDetailList.items[i].traansactionTypesExchange.exchangeId = model.exchangeId;
              tempArray[i] = this.slabDetailList.items[i];
            }
            this.listingService.updateCommissionSlab(tempArray).subscribe(
              data => {
                
                this.loader.hide();
                this.slabDetailList.commitEdit();
                this.searchCommissionSlab(data.commissionSlabId);
                //this.itemsList = this.slabDetailList;
                this.itemsList.refresh();
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
                this.dialogCmp.showAlartDialog('Success');

                //this.populateCommissionSlabList();

                this.itemsList.items.sort((a: CommissionSlabDetail, b: CommissionSlabDetail) =>
                  a.lowerRange.valueOf() - b.lowerRange.valueOf());
                this.flex.refresh();

              },
              error => {
                
                this.loader.hide();
                if (error.message) {
                  this.errorMessage = <any>error.message;
                }
                else {
                  this.errorMessage = <any>error;
                }
                this.hideForm = true;
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
              }
            );
          }
        }
        else {
          if (AppUtility.isValidVariable(this.slabDetailList)) {
            let tempArray: CommissionSlabDetail[] = [];
            for (let i = 0; i < this.slabDetailList.items.length; i++) {
              tempArray[i] = new CommissionSlabDetail();
              this.slabDetailList.items[i].commissionSlabMaster.slabName = model.slabName;
              this.slabDetailList.items[i].commissionSlabMaster.slabNameDisplay_ = model.slabName;
              // this.slabDetailList.items[i].commissionMode = model.commissionMode;
              this.slabDetailList.items[i].commissionSlabMaster.minMaxCommFlag = model.minMaxCommFlag;
              this.slabDetailList.items[i].commissionSlabMaster.maxCommAmount = model.maxCommAmount;
              this.slabDetailList.items[i].commissionSlabMaster.minCommAmount = model.minCommAmount;
              // this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId = model.transactionType;
              // this.slabDetailList.items[i].traansactionTypesExchange.exchangeId = model.exchangeId;
              this.slabDetailList.items[i].commissionSlabMaster.commissionSlabId = null;
              this.slabDetailList.items[i].commissionSlabDetailID = null;
              tempArray[i] = this.slabDetailList.items[i];
            }
            this.listingService.saveCommissionSlab(tempArray).subscribe(
              data => {
                this.loader.hide();
                if (AppUtility.isEmpty(this.itemsList))
                  this.itemsList = new wjcCore.CollectionView;
                this.searchCommissionSlab(data.commissionSlabId);
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                this.dialogCmp.showAlartDialog('Success');
                this.populateCommissionSlabList();
                // if (AppUtility.isValidVariable(this.itemsList)) {
                //   this.itemsList = new wjcCore.CollectionView();
                //   this.itemsList.refresh();
                // }

                this.flex.refresh();
              },
              error => {
                this.loader.hide();
                this.hideForm = true;
                if (error.message) {
                  this.errorMessage = <any>error.message;
                }
                else {
                  this.errorMessage = <any>error;
                }
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
              }
            );
          }
          else {
            if (this.lang === "pt") { this.dialogCmp.statusMsg = 'Pelo menos 1 item é necessário no detalhe da laje da comissão.'; }
            else {
              this.dialogCmp.statusMsg = 'At least 1 item is required in Commission Slab Detail.';
            }

            this.dialogCmp.showAlartDialog('Warning');
          }
        }
      }
    }
    this.finalSaveUpdate = false;
  }
  /***************************************
 *          Private Methods
 **************************************/
  private checkValuesOverlaping(): boolean {

 


    if (AppUtility.isValidVariable(this.slabDetailList)) {
      if (this.isDetailEditing) {

        if (this.isBondFieldsRequired) {
          for (let i: number = 0; i < this.slabDetailList.items.length; i++) {

            let bC, bT, sBC, sBT;

            if (AppUtility.isValidVariable(this.slabDetailList.items[i].bondCategory)) {
              bC = this.slabDetailList.items[i].bondCategory.categoryId;
            }
            else {
              bC = null;
            }

            if (AppUtility.isValidVariable(this.slabDetailList.items[i].bondType)) {
              bT = this.slabDetailList.items[i].bondType.bondTypeId;
            }
            else {
              bT = null;
            }

            if (AppUtility.isValidVariable(this.selectedDetailItem.bondCategory) && !AppUtility.isValidVariable(this.selectedDetailItem.bondCategory.categoryId)) {
              sBC = null;
            }
            else if(!AppUtility.isValidVariable(this.selectedDetailItem.bondCategory)){
              sBC = null;
            }
            else {
              sBC = this.selectedDetailItem.bondCategory;
            }


            if (AppUtility.isValidVariable(this.selectedDetailItem.bondType) && !AppUtility.isValidVariable(this.selectedDetailItem.bondType.bondTypeId)) {
              sBT = null;
            }
            else if(!AppUtility.isValidVariable(this.selectedDetailItem.bondType)){
              sBC = null;
            }
            else {
              sBT = this.selectedDetailItem.bondType;
            }

            if (this.slabDetailList.items[i] != this.slabDetailList.currentItem
              && this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId == this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId
              && this.slabDetailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId
              && this.slabDetailList.items[i].appliedOn === this.selectedDetailItem.appliedOn
              && this.slabDetailList.items[i].commissionMode === this.selectedDetailItem.commissionMode
              && this.slabDetailList.items[i].bondNature.bondNatureId === this.selectedDetailItem.bondNature.bondNatureId
              && ((sBC == null) ? this.slabDetailList.items[i].bondCategory === sBC : bC === this.selectedDetailItem.bondCategory.categoryId)
              && ((sBT == null) ? this.slabDetailList.items[i].bondType === sBT : bT === this.selectedDetailItem.bondType.bondTypeId)) {

              if ((this.selectedDetailItem.lowerRange >= this.slabDetailList.items[i].lowerRange &&
                this.selectedDetailItem.lowerRange <= this.slabDetailList.items[i].upperRange) ||
                (this.selectedDetailItem.upperRange >= this.slabDetailList.items[i].lowerRange &&
                  this.selectedDetailItem.upperRange <= this.slabDetailList.items[i].upperRange))
                return false;
            }

          }
        }
        else if (!this.isBondFieldsRequired) {
          for (let i: number = 0; i < this.slabDetailList.items.length; i++) {
            if (this.slabDetailList.items[i] != this.slabDetailList.currentItem
              && this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId == this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId
              && this.slabDetailList.items[i].appliedOn === this.selectedDetailItem.appliedOn
              &&  this.slabDetailList.items[i].commissionMode === this.selectedDetailItem.commissionMode
              && this.slabDetailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId) {
              if ((this.selectedDetailItem.lowerRange >= this.slabDetailList.items[i].lowerRange &&
                this.selectedDetailItem.lowerRange <= this.slabDetailList.items[i].upperRange) ||
                (this.selectedDetailItem.upperRange >= this.slabDetailList.items[i].lowerRange &&
                  this.selectedDetailItem.upperRange <= this.slabDetailList.items[i].upperRange))
                return false;
            }

          }
        }


      }
      else {

        if (this.isBondFieldsRequired) {
          for (let i: number = 0; i < this.slabDetailList.items.length; i++) {
            let bC, bT, sBC, sBT;

            if (AppUtility.isValidVariable(this.slabDetailList.items[i].bondCategory)) {
              bC = this.slabDetailList.items[i].bondCategory.categoryId;
            }
            else {
              bC = null;
            }

            if (AppUtility.isValidVariable(this.slabDetailList.items[i].bondType)) {
              bT = this.slabDetailList.items[i].bondType.bondTypeId;
            }
            else {
              bT = null;
            }

            if (AppUtility.isValidVariable(this.selectedDetailItem.bondCategory) && !AppUtility.isValidVariable(this.selectedDetailItem.bondCategory.categoryId)) {
              sBC = null;
            }
            else if(!AppUtility.isValidVariable(this.selectedDetailItem.bondCategory)){
              sBC = null;
            }
            else {
              sBC = this.selectedDetailItem.bondCategory;
            }


            if (AppUtility.isValidVariable(this.selectedDetailItem.bondType) && !AppUtility.isValidVariable(this.selectedDetailItem.bondType.bondTypeId)) {
              sBT = null;
            }
            else if(!AppUtility.isValidVariable(this.selectedDetailItem.bondType)){
              sBC = null;
            }
            else {
              sBT = this.selectedDetailItem.bondType;
            }



            if (this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId == this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId
              && this.slabDetailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId
              && this.slabDetailList.items[i].appliedOn === this.selectedDetailItem.appliedOn
              &&  this.slabDetailList.items[i].commissionMode === this.selectedDetailItem.commissionMode
              && (this.slabDetailList.items[i].bondNature.bondNatureId === this.selectedDetailItem.bondNature.bondNatureId)
              && ((sBC == null) ? this.slabDetailList.items[i].bondCategory === sBC : bC === this.selectedDetailItem.bondCategory.categoryId)
              && ((sBT == null) ? this.slabDetailList.items[i].bondType === sBT : bT === this.selectedDetailItem.bondType.bondTypeId)) {

              if ((this.selectedDetailItem.lowerRange >= this.slabDetailList.items[i].lowerRange &&
                this.selectedDetailItem.lowerRange <= this.slabDetailList.items[i].upperRange) ||
                (this.selectedDetailItem.upperRange >= this.slabDetailList.items[i].lowerRange &&
                  this.selectedDetailItem.upperRange <= this.slabDetailList.items[i].upperRange))
                   {
                if (!AppUtility.isValidVariable(this.selectedDetailItem.bondCategory)) {
                  this.selectedDetailItem.bondCategory = new BondCategory();
                }
              if (!AppUtility.isValidVariable(this.selectedDetailItem.bondType)) {
                this.selectedDetailItem.bondType = new BondType();
              }
              return false;
            }
            }
          }
        }
        else if (!this.isBondFieldsRequired) {
          for (let i: number = 0; i < this.slabDetailList.items.length; i++) {
            if (this.slabDetailList.items[i].traansactionTypesExchange.traansactionTypeExchangeId == this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId
              && this.slabDetailList.items[i].appliedOn === this.selectedDetailItem.appliedOn
              &&  this.slabDetailList.items[i].commissionMode === this.selectedDetailItem.commissionMode
              && this.slabDetailList.items[i].asset.assetId === this.selectedDetailItem.asset.assetId) {

              if ((this.selectedDetailItem.lowerRange >= this.slabDetailList.items[i].lowerRange &&
                this.selectedDetailItem.lowerRange <= this.slabDetailList.items[i].upperRange) ||
                (this.selectedDetailItem.upperRange >= this.slabDetailList.items[i].lowerRange &&
                  this.selectedDetailItem.upperRange <= this.slabDetailList.items[i].upperRange))

                return false;
            }
          }
        }


      }
    }



    return true;
  }

  private populateTransactionTypeList(exchangeId: Number) {
    this.loader.show();
    this.transactionTypeList = null;
    this.listingService.getTransactionTypeByExchange(exchangeId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (!AppUtility.isEmptyArray(restData)) {
            this.transactionTypeList = restData;
            // let sett: TraansactionTypesExchange = new TraansactionTypesExchange();
            // sett.traansactionTypeExchangeId = AppConstants.PLEASE_SELECT_VAL;
            // sett.transactionType = AppConstants.PLEASE_SELECT_STR;
            // this.transactionTypeList.unshift(sett);

            // if (!AppUtility.isEmpty(this.traansactionTypeExchangeId)) {
            //   this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.traansactionTypeExchangeId;
            //   this.cmbTransactionType.invalidate();
            //   this.cmbTransactionType.selectedValue = this.traansactionTypeExchangeId;
            // }
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error.message });
  }




  private populateTransactionTypeByAssetList(exchangeId: Number, AssetId: Number) {
    this.loader.show();
    this.transactionTypeList = null;
    this.listingService.getTransactionTypeByAssetExchange(exchangeId, AssetId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (!AppUtility.isEmptyArray(restData)) {
            this.transactionTypeList = restData;
            // let sett: TraansactionTypesExchange = new TraansactionTypesExchange();
            // sett.traansactionTypeExchangeId = AppConstants.PLEASE_SELECT_VAL;
            // sett.transactionType = AppConstants.PLEASE_SELECT_STR;
            // this.transactionTypeList.unshift(sett);

            // if (!AppUtility.isEmpty(this.traansactionTypeExchangeId)) {
            //   this.selectedDetailItem.traansactionTypesExchange.traansactionTypeExchangeId = this.traansactionTypeExchangeId;
            //   this.cmbTransactionType.invalidate();
            //   this.cmbTransactionType.selectedValue = this.traansactionTypeExchangeId;
            // }
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error.message });
  }








  public onAllSelected(e) {
    if (e.target.checked) {
      this.transactionTypeControl.isDisabled = true;
      this.allTransTypes = true;

      if (this.lang === 'pt') {
        this.transactionTypeControl.placeholder = 'Todos';
      } else {
        this.transactionTypeControl.placeholder = 'All';
      }
    } else {
      this.transactionTypeControl.isDisabled = false;
      this.allTransTypes = false;

      if (this.lang === 'pt') {
        this.transactionTypeControl.placeholder = 'Selecione';
      } else {
        this.transactionTypeControl.placeholder = 'Select';
      }

    }
  }




  private populateExchangeList() {
    this.loader.show();
    this.listingService.getExchangeList()
      .subscribe(
        restData => {
          this.loader.hide();
          if (!AppUtility.isEmptyArray(restData)) {
            this.exchangesList = restData;
            let exch: Exchange = new Exchange();
            exch.exchangeId = AppConstants.PLEASE_SELECT_VAL;
            exch.exchangeCode = AppConstants.PLEASE_SELECT_STR;
            this.exchangesList.unshift(exch);
          }
        },
        error => { this.loader.hide(); this.errorMessage = <any>error.message });
  }
  private getSlabCommissionDetailList(_commissionSlabId: Number) {
    if (AppUtility.isValidVariable(_commissionSlabId)) {
      this.loader.show();
      this.listingService.getSlabCommissionDetailList(_commissionSlabId)
        .subscribe(
          restData => {
            this.loader.hide();
            CommissionSlabPage._slabid = _commissionSlabId;
            if (AppUtility.isEmptyArray(restData)) {
              this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
              this.itemsList = new wjcCore.CollectionView();
              this.flex.refresh();
            } else {
              this.itemsList = new wjcCore.CollectionView(restData);

              this.itemsList.items.map(element => {
                if (element.commissionMode == 'S')
                element.commissionModeDisplay_ = 'Sell';
              else if (element.commissionMode == 'B')
                element.commissionModeDisplay_ = 'Buy';
              else if (element.commissionMode == 'O')
                element.commissionModeDisplay_ = 'Both';
              else if (element.commissionMode == 'C')
                element.commissionModeDisplay_ = 'Coupon';
              else if (element.commissionMode == 'R')
                element.commissionModeDisplay_ = 'Reimbursement';
              else if (element.commissionMode == 'CR')
                element.commissionModeDisplay_ = 'Coupon, Reimbursement';
              else if (element.commissionMode == 'D')
                element.commissionModeDisplay_ = 'Deposit';
              else if (element.commissionMode == 'W')
                element.commissionModeDisplay_ = 'Withdrawal';
              else if (element.commissionMode == 'DW')
                element.commissionModeDisplay_ = 'Deposit, Withdrawal';
              else
                element.commissionModeDisplay_ = null;


                if (element.appliedOn === 'T') {
                  element.appliedToDisplay_ = 'Trade';
                }
                else if (element.appliedOn === 'P') {
                  element.appliedToDisplay_ = 'Payment';
                }
                else if (element.appliedOn === 'V') {
                  element.appliedToDisplay_ = 'Vault Transaction';
                }
                else {
                  element.appliedToDisplay_ = null
                }


                if (element.valueType === 'SA') {
                  element.valueTypeDisplay_ = 'Settlement Amount';
                }
                else if (element.valueType === 'CA') {
                  element.valueTypeDisplay_ = 'Clean Settlement Amount';
                }
                else if (element.valueType === 'PP') {
                  element.valueTypeDisplay_ = 'Purchase Price';
                }
                else if (element.valueType === 'RP') {
                  element.valueTypeDisplay_ = 'Repurchase Price';
                }
                else {
                  element.valueTypeDisplay_ = "";
                }
            
              })
              

            }
          },
          error => {
            this.loader.hide();
            if (error.message) {
              this.errorMessage = <any>error.message;
            }
            else {
              this.errorMessage = <any>error;
            }
          });
    }
  }

  private getSlabCommissionDetailListCopyFrom(_commissionSlabId: Number) {
    if (AppUtility.isValidVariable(_commissionSlabId)) {
      this.loader.show();
      this.listingService.getSlabCommissionDetailList(_commissionSlabId)
        .subscribe(
          restData => {
            this.loader.hide();
            if (AppUtility.isEmptyArray(restData)) {
              this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
              this.itemsList = new wjcCore.CollectionView();
              this.flex.refresh();
            } else {
              this.itemsList = new wjcCore.CollectionView(restData);
              let detailList = JSON.parse(JSON.stringify(this.itemsList.items));

              detailList.sort((a: CommissionSlabDetail, b: CommissionSlabDetail) =>
                a.lowerRange.valueOf() - b.lowerRange.valueOf());
              this.selectedDetailItem.lowerRange = 0;
              this.selectedDetailItem.upperRange = 1;
              this.slabDetailList = new wjcCore.CollectionView(detailList);
            }
          },
          error => {
            this.loader.hide();
            if (error.message) {
              this.errorMessage = <any>error.message;
            }
            else {
              this.errorMessage = <any>error;
            }
          });
    }
  }

  private populateCommissionSlabList() {
    this.loader.show();
    this.listingService.getCommissionSlabList(AppConstants.participantId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.recExist = false;
          } else {
            this.commissionSlabList = restData;
            let cs: CommissionSlabMaster = new CommissionSlabMaster();
            cs.commissionSlabId = AppConstants.PLEASE_SELECT_VAL;
            cs.slabNameDisplay_ = AppConstants.PLEASE_SELECT_STR;
            this.commissionSlabList.unshift(cs);
            this.selectedItem.commissionSlabMaster.commissionSlabId = this.commissionSlabList[0].commissionSlabId;
            this.recExist = true;
          }
        },
        error => {
          this.loader.hide();
          if (error.message) {
            this.errorMessage = <any>error.message;
          }
          else {
            this.errorMessage = <any>error;
          }
        });
  }

  public populateCommissionSlabListCallingFrom() {
    this.loader.show();
    this.listingService.getCommissionSlabDetailsList(AppConstants.participantId)
      .subscribe(
        restData => {
          this.loader.hide();
          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.recExist = false;
          } else {
            this.commissionSlabList = restData;
            this.recExist = true;
          }
        },
        error => {
          this.loader.hide();
          if (error.message) {
            this.errorMessage = <any>error.message;
          }
          else {
            this.errorMessage = <any>error;
          }
        });
  }

  public updateControls() {
    /* this.selectedItem.commissionMode = this.slabGrid.collectionView.currentItem.commissionMode;
     this.selectedItem.commissionModeDisplay_ = this.slabGrid.collectionView.currentItem.commissionModeDisplay_;
     this.selectedItem.traansactionTypesExchange.traansactionTypeExchangeId = this.slabGrid.collectionView.currentItem.traansactionTypesExchange.traansactionTypeExchangeId;
     this.selectedItem.traansactionTypesExchange.transactionType = this.slabGrid.collectionView.currentItem.traansactionTypesExchange.transactionType;    
     this.selectedItem.traansactionTypesExchange.exchange = this.slabGrid.collectionView.currentItem.traansactionTypesExchange.exchange;
     this.selectedItem.traansactionTypesExchange.exchangeId = this.slabGrid.collectionView.currentItem.traansactionTypesExchange.exchangeId;    */
    this.selectedItem.commissionSlabMaster.minMaxCommFlag = this.slabGrid.collectionView.currentItem.commissionSlabMaster.minMaxCommFlag;
    this.selectedItem.commissionSlabMaster.minCommAmount = this.slabGrid.collectionView.currentItem.commissionSlabMaster.minCommAmount;
    this.selectedItem.commissionSlabMaster.maxCommAmount = this.slabGrid.collectionView.currentItem.commissionSlabMaster.maxCommAmount;

    this.getSlabCommissionDetailListCopyFrom(this.slabGrid.collectionView.currentItem.commissionSlabMaster.commissionSlabId);
  }

  private addFormValidations() {
    this.myForm = this._fb.group({
      slabName: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternString)])],
      exchangeId: ['', Validators.compose([Validators.required])],
      transactionType: ['', Validators.compose([Validators.required])],
      commissionMode: ['', Validators.compose([Validators.required])],
      valueType: [''],
      valueTypeRepo : [''],
      commissionAppliedTo: ['', Validators.compose([Validators.required])],
      lowerRange: ['', Validators.compose([Validators.required])],
      upperRange: ['', Validators.compose([Validators.required])],
      deliveryComm: ['', Validators.compose([Validators.required])],
      deliveryFP: ['', Validators.compose([Validators.required])],
      differenceComm: ['', Validators.compose([Validators.required,])],
      differenceFP: ['', Validators.compose([Validators.required])],
      minCommAmount: ['', Validators.compose([Validators.required])],
      maxCommAmount: ['', Validators.compose([Validators.required])],
      minMaxCommFlag: ['', Validators.compose([Validators.required])],
      applyDelCommission: [''],



      assetId: ['', Validators.compose([Validators.required])],
      bondCategoryId: [''],
      bondTypeId: [''],
      bondNatureId: [''],


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