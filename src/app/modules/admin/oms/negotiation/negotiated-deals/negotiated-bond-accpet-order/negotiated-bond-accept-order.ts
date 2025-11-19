import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';

import { AppConstants, AppUtility } from 'app/app.utility';
import { AlertMessage } from 'app/models/alert-message';
import { BestMarket } from 'app/models/best-market';
import { ComboItem } from 'app/models/combo-item';
import { Order } from 'app/models/order';
import { OrderConfirmation } from 'app/models/order-confirmation';
import { SecurityMarketDetails } from 'app/models/security-market-details';
import { SymbolStats } from 'app/models/symbol-stats';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { AuthService2 } from 'app/services/auth2.service';
import { WebSocketService } from 'app/services/socket/web-socket.service';
import { ShareOrderService } from '../../../order/order.service';

declare var jQuery: any;
// import * as jQuery from 'jquery';

@Component({
  selector: '[negotiated-bond-accept-order]',
  templateUrl: './negotiated-bond-accept-order.html',
})

export class NegotiatedBondAcceptOrderComponent {
  public myForm: FormGroup;
  public isSubmitted: boolean;
  public checkClientCode;
  dateFormat = AppConstants.DATE_FORMAT;
  claims: any;

  sharedSide: string;
  @Input() itemFromParent: any
  @Input() sharedIndex: number
  @Input() orderState: string

  order: Order;
  securityMarketDetails: SecurityMarketDetails;
  bestMarket: BestMarket;
  symbolStats: SymbolStats;
  orderConfirmation: OrderConfirmation;

  exchangeData: any[];
  traders: any[] = [];
  markets = [];
  symbols = [];
  exchange: string;
  market: string;
  symbolExchMktList: any[];
  // traders: any[];
  custodians: any[];
  orderSides: any;
  orderTypes: any[];
  orderTypesTemp: any[];
  tifOptions: any[];
  qualifiers: any[];
  fromClientList: any[] = [];

  exchangeId: number = 0;
  marketId: number = 0;
  securityId: number = 0;

  userType: string;
  side: string = '';
  errorMessage: string;
  statusMsg: string;
  orderConfirmMsg: string = '';
  submitted = false;
  alertMessage: AlertMessage;

  modal = true;
  dialogIsVisible: boolean = false;
  triggerPriceDisable: boolean = true;
  isPriceDisable: boolean = false;
  isBondPricingMechanismPercentage: boolean = true;
  isBondPricingModelDirty: boolean = false;
  triggerPriceCollapse: string = 'collapse';

  isFirstSubmission: boolean = false;
  isConfirmationSuccess: boolean = false;
  isConfirmationRejected: boolean = false;
  lang: any
  AccruedInterest: number = 0
  dirtyPrice: number = 0
  loggedInBrokerCode: string = '';
  public sybmolMarketExchange: string;
  public orderSide: string;
  isCustodianModel = AppConstants.CUSTODIAN_MODEL;
  tradeType: string = '';

  @ViewChild('orderSubmittedDlg', { static: false }) orderSubmittedDlg: wjcInput.Popup;
  @ViewChild('cmbSymbol', { static: false }) cmbSymbol: wjcInput.ComboBox;
  @ViewChild('cmbOrderType', { static: false }) cmbOrderType: wjcInput.ComboBox;
  @ViewChild('cmbOrderSide', { static: false }) cmbOrderSide: wjcInput.ComboBox;
  @ViewChild('inputVolume', { static: false }) inputVolume: wjcInput.InputNumber;
  @ViewChild('inputPrice', { static: false }) inputPrice: wjcInput.InputNumber;
  @ViewChild('inputYield', { static: false }) inputYield: wjcInput.InputNumber;
  @ViewChild('account', { static: false }) account: wjcInput.InputMask;
  @ViewChild('subCategory', { static: false }) subCategory: wjcInput.InputMask;
  @ViewChild('inputTriggerPrice', { static: false }) inputTriggerPrice: wjcInput.InputNumber;
  @ViewChild('counterBroker', { static: false }) counterBroker: wjcInput.InputMask;
  @ViewChild('counterClient', { static: false }) counterClient: wjcInput.InputMask;
  currencyCode : String = AppConstants.LOCAL_CURRENCY_AOA_CODE;

  // ---------------------------------------------------------------------------

  constructor(private appState: AppState, public authService: AuthService2, public authServiceOMS: AuthService, private dataService: DataServiceOMS,
    private listingService: ListingService, private orderService: OrderService,
    private changeDetectorRef: ChangeDetectorRef, private _fb: FormBuilder,
    private translate: TranslateService, public appUtility2: AppUtility,
    public socket: WebSocketService, public shareOrderService: ShareOrderService, public cdr: ChangeDetectorRef,) {
    this.claims = this.authService.claims;
    this.addFromValidations();
    this.userType = AppConstants.userType;

    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________
    this.currencyCode = AppConstants.LOCAL_CURRENCY_AOA_CODE;

  }

  // ---------------------------------------------------------------------------

  ngOnChanges(changes: SimpleChanges): void {

    if (changes.itemFromParent || changes.sharedIndex || changes.orderState) {
      this.getSelectedData();
    }
  }

  ngOnInit() {
    this.addFromValidations();
    this.init();

  }

  // ---------------------------------------------------------------------------

  init() {
    let exchCode: string = '';
    let mktCode: string = '';

    this.isConfirmationSuccess = false;
    this.isConfirmationRejected = false;

    this.isSubmitted = false;
    this.checkClientCode = false;

    this.order = new Order();

    this.order.is_negotiated = true;
    this.order.negotiated_order_state = "";
    this.order.negotiated_order_status = "Normal";

    this.securityMarketDetails = new SecurityMarketDetails();

    this.isFirstSubmission = false;
    this.bestMarket = new BestMarket();
    this.symbolStats = new SymbolStats();
    this.orderConfirmation = new OrderConfirmation();
    this.alertMessage = new AlertMessage();
    //this.symbolStats = new SymbolStats();

    let symbolItems: any[] = [];
    this.fromClientList = [];
    // this.cmbSymbol.focus();

    // Updating symbol list
    // this.symbolExchMktList = this.orderService.getExchangeMarketSymbols();
    this.symbolExchMktList = [];
    // Getting Participant security exchanges
    if (AppUtility.isValidVariable(this.dataService.symbolsData) && this.dataService.symbolsData.length > 0) {

      this.updateSymbolList(this.dataService.symbolsData);
    }
    else {
      if (AppUtility.isValidVariable(AppConstants.participantId))
        this.appState.showLoader = true;

      this.listingService.getParticipantSecurityExchanges(AppConstants.participantId)
        .subscribe(restData => {
          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(restData)) {
            this.updateSymbolList(restData);
          }
        },
          error => {
            this.appState.showLoader = false;
            this.errorMessage = <any>error
          });
    }

    // Getting order sides
    this.orderSides = this.listingService.getOrderSides();
    this.orderTypesTemp = this.orderTypes;

  }

  // ---------------------------------------------------------------------------

  ngAfterViewInit(): void {
    // For highlight fields on validation fails
    // jQuery('.parsleyjs').parsley();

    this.authServiceOMS.socket.on('order_confirmation', (dataorderConfirmation) => { this.updateorderConfirmation(dataorderConfirmation); });
    this.authServiceOMS.socket.on('best_market', (dataBM) => { this.updateBestMarketData(dataBM); });
    this.authServiceOMS.socket.on('symbol_stat', (dataSS) => { this.updateSymbolStatsData(dataSS); });

    this.cmbSymbol.invalidate();
    this.cmbSymbol.refresh();
    this.cmbSymbol.focus(); 0
  }

  public getSelectedData = () => {

    if (AppUtility.isValidVariable(this.itemFromParent) && AppUtility.isValidVariable(this.itemFromParent)) {

      if (this.itemFromParent.side == 'buy') {
        this.sharedSide = "B"
        this.sybmolMarketExchange = AppUtility.symbolMarketExchangeComb(this.itemFromParent.symbol, this.itemFromParent.market, this.itemFromParent.exchange);
        this.order.symbolMktExch = this.sybmolMarketExchange;
        this.order.side = 'buy';
        //Price
        var purifiedPrice = this.itemFromParent.price.replace(',', '')
        this.order.price_ = Number(purifiedPrice);
        //Volume
        var purifiedVol = this.itemFromParent.volume.replace(',', '')
        this.order.volume = Number(purifiedVol)
        //Counter broker
        this.order.counter_broker_code = this.itemFromParent.counter_broker
        //Client
        this.order.account = this.itemFromParent.account
        //remaining fields
        this.order.order_no = this.itemFromParent.order_no
        this.order.ref_no = this.itemFromParent.ref_no
        this.order.username = this.itemFromParent.username
        this.order.broker = this.itemFromParent.broker
        this.order.counter_username = this.itemFromParent.counter_username
        this.order.expiryDate = this.itemFromParent.expiryDate
        this.order.order_state = this.itemFromParent.order_state
        this.order.negotiated_order_state = "Accept"
        this.order.is_negotiated = true

        //SettlementValue
        if (!AppUtility.isValidVariable(this.itemFromParent.settlement_amount)) {
          this.itemFromParent.settlement_amount = 0
        }
        else {
          var purifiedSettlementValue = this.itemFromParent.settlement_amount.toString().replace(',', '')
          this.order.settlementValue = Number(purifiedSettlementValue);
          this.order.settlementValueCurrency = Number(this.order.settlementValue) * Number(this.securityMarketDetails.currencyRate);
        }
        //yield
        // var purifiedyield = this.itemFromParent.yield.replace(',', '')
        // this.order.yield = Number(purifiedyield);
      }

      if (this.itemFromParent.side == 'sell') {
        this.sharedSide = "S"
        this.sybmolMarketExchange = AppUtility.symbolMarketExchangeComb(this.itemFromParent.symbol, this.itemFromParent.market, this.itemFromParent.exchange);
        this.order.symbolMktExch = this.sybmolMarketExchange;
        this.order.side = 'sell';
        //Price
        var purifiedPrice = this.itemFromParent.price.replace(',', '')
        this.order.price_ = Number(purifiedPrice);
        //Volume
        var purifiedVol = this.itemFromParent.volume.replace(',', '')
        this.order.volume = Number(purifiedVol)
        //Counter broker
        this.order.counter_broker_code = this.itemFromParent.counter_broker
        //Client
        this.order.account = this.itemFromParent.account
        //remaining fields
        this.order.order_no = this.itemFromParent.order_no
        this.order.ref_no = this.itemFromParent.ref_no
        this.order.username = this.itemFromParent.username
        this.order.broker = this.itemFromParent.broker
        this.order.counter_username = this.itemFromParent.counter_username
        this.order.expiryDate = this.itemFromParent.expiryDate
        this.order.order_state = this.itemFromParent.order_state
        this.order.negotiated_order_state = "Accept"
        this.order.is_negotiated = true
        //SettlementValue
        
        if (!AppUtility.isValidVariable(this.itemFromParent.settlement_amount)) {
          this.itemFromParent.settlement_amount = 0
        }
        else {
          var purifiedSettlementValue = this.itemFromParent.settlement_amount.toString().replace(',', '')
          this.order.settlementValue = Number(purifiedSettlementValue);
          this.order.settlementValueCurrency = Number(this.order.settlementValue) * Number(this.securityMarketDetails.currencyRate);
        }
        //yield
        // var purifiedyield = this.itemFromParent.yield.replace(',', '')
        // this.order.yield = Number(purifiedyield);

      }

      if (this.orderState === "Reject") {
        this.order.negotiated_order_state = "Reject"
        this.order.counter_client_code = ''
      }

      this.changeDetectorRef.detectChanges();
    }



  }



  onClose() {

    jQuery('#negotiated-bond-accpet').modal('hide');
    // jQuery('#negotiated-order-accpet').modal('hide');
    this.init();
    this.AccruedInterest = 0
    this.dirtyPrice = 0;
    this.loadSelectedSymbolFromMarketWatch();
    AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    AppConstants.isSelectedEquities = false;
    this.socket.fetchFromChannel("best_orders", { exchange: "", market: "", symbol: "" });

  }



  // ---------------------------------------------------------------------------

  updateSymbolList(data) {
    let symbolList: any[] = [];
    let cmbItem: ComboItem;
    let bondIndex: number = 0;

    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].marketTypeCode.toUpperCase() === AppConstants.MARKET_TYPE_BOND) {
          symbolList[bondIndex] = data[i];
          symbolList[bondIndex].value = data[i].displayName_;
          bondIndex++;
        }
      }

      cmbItem = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
      symbolList.unshift(cmbItem);
      this.order.symbolMktExch = '';

    }
    this.symbolExchMktList = symbolList;
  }

  // ---------------------------------------------------------------------------

  tifOptionChanged(): void {

  }

  // ---------------------------------------------------------------------------

  qualifierChanged(): void {

  }

  // ---------------------------------------------------------------------------

  getOrderTypes(exchangeId, marketId) {
    // Updating order types
    this.appState.showLoader = true;
    this.listingService.getOrderTypesByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.updateOrderTypesData(restData)
      },
        error => { this.appState.showLoader = false; this.errorMessage = <any>error });
  }

  // ---------------------------------------------------------------------------
  // TIF Options
  getTifOptions(exchangeId, marketId) {
    this.tifOptions = [];
    this.appState.showLoader = true;
    this.listingService.getTifOptionsByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.tifOptions = restData;
      },
        error => {

          this.appState.showLoader = false;
          //  this.errorMessage = <any>error
        });
  }

  // ---------------------------------------------------------------------------
  // Order Qualifiers
  getOrderQualifiers(exchangeId, marketId) {
    this.qualifiers = [];
    this.appState.showLoader = true;
    this.listingService.getOrderQualifiersByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.qualifiers = restData.reverse();
        this.order.qualifier = "No Qualifier";
      },
        error => {
          this.appState.showLoader = false;
          //  this.errorMessage = <any>error
        });
  }

  // ---------------------------------------------------------------------------

  updateOrderTypesData(orderTypesData): void {
    this.orderTypesTemp = [];
    this.orderTypes = [];

    if (!AppUtility.isEmpty(orderTypesData)) {
      for (let i = 0; i < orderTypesData.length; i++) {
        orderTypesData[i].value = orderTypesData[i].code.toLowerCase();
        this.orderTypes.push(orderTypesData[i]);
        this.orderTypesTemp.push(orderTypesData[i]);
      }
    }
  }

  // ---------------------------------------------------------------------------

  orderSideChanged(): void {
    this.order.side = this.cmbOrderSide.selectedValue;
    this.updateOrderTypes();
  }

  // ---------------------------------------------------------------------------

  updateOrderTypes(): void {
    this.orderTypes = [];

    if (this.orderTypes != null && this.orderTypesTemp != null) {
      for (let key in this.orderTypesTemp) {
        let orderType = this.orderTypesTemp[key];

        if (this.order.side === 'buy' &&
          !(orderType.code.toLowerCase() === 'sl' || orderType.code.toLowerCase() === 'sm')) {
          this.orderTypes.push(orderType);

        }

        if (this.order.side === 'sell') {
          this.orderTypes.push(orderType);

        }
      }

    }
  }

  // ---------------------------------------------------------------------------

  updateBestMarketData(data) {


  }

  // ---------------------------------------------------------------------------

  updateSymbolStatsData(data) {

    if (this.order.symbol === data.symbol) {
      this.symbolStats.updateSymbolStatsForOrderWindow(data);
      this.cdr.detectChanges();
    }
  }


  // ---------------------------------------------------------------------------

  updateorderConfirmation(data) {
    let alertMessage: AlertMessage = this.order.formatOrderConfirmationMsg(data, 'Bond');
    this.alertMessage = alertMessage;
    this.showOrderConfirmationMsg();
    this.resetForm();

  }

  // ---------------------------------------------------------------------------

  showOrderConfirmationMsg() {
    if (this.alertMessage.type === 'success') {
      this.isConfirmationSuccess = true;
      this.isConfirmationRejected = false;
    } else if (this.alertMessage.type === 'danger') {
      this.isConfirmationRejected = true;
      this.isConfirmationSuccess = false;
    }
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isConfirmationRejected = false;
      this.isConfirmationSuccess = false;
    }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
  }

  // ---------------------------------------------------------------------------

  closeAlert() {
    this.isConfirmationSuccess = false;
    this.isConfirmationRejected = false;
  }

  // ---------------------------------------------------------------------------

  onAlertOk(): void {
    this.resetForm();
    this.cmbSymbol.focus();
  }

  // ---------------------------------------------------------------------------

  onAlertCancel(): void {
    this.cmbSymbol.focus();
  }

  // ---------------------------------------------------------------------------

  resetForm(): void {
    this.isSubmitted = false;
    this.checkClientCode = false;
    this.order.volume = 0;
    this.order.price_ = 0;
    this.order.value = 0;
    this.order.side = '';
    this.order.settlementValue = 0;
    this.order.settlementValueCurrency = 0;
    this.order.type_ = 'limit';
    this.order.triggerPrice_ = 0;
    this.statusMsg = '';
    this.order.account = '';
    this.order.counter_broker_code = '';
    this.order.counter_client_code = '';

  }


  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------

  onSubmit(model: any, isValid: boolean) {
    this.isSubmitted = true;

    if (this.validateOrder()) {
      this.submitted = true;

      this.order.price = this.order.price_.toString();
      this.order.triggerPrice = this.order.triggerPrice_.toString();
      this.order.type = this.order.type_.toLowerCase();
      this.order.market = this.order.market.toUpperCase();
      this.statusMsg = this.order.formatOrderSubmitMsg('Bond');

      if (this.order.negotiated_order_state === 'Reject') {
        this.statusMsg = AppUtility.orderConfirmationMsg(this.order, 'Reject');
      }

      this.order.counter_client_code = this.order.counter_client_code.toUpperCase();

      if (this.order.qualifier === 'HO') {
        this.order.type = 'ho';
        this.order.disclosedVolume = this.order.discQuantity;
      }

      if (this.order.qualifier === 'IOC') {
        this.order.type = 'ioc';
      }

      if (this.order.qualifier === 'FOK') {
        this.order.type = 'fok';
      }

      if (this.order.tifOption === 'GTC') {
        this.order.type = 'gtc';
      }

      if (this.order.tifOption === 'GTD') {
        this.order.type = 'gtd';
        this.order.expiryDate = AppUtility.toYYYYMMDD(this.order.gtd);
      }

      this.showDialog(this.orderSubmittedDlg);
    }
    else {
      this.isFirstSubmission = false;
    }
  }

  // ---------------------------------------------------------------------------

  submitOrder() {
    this.order.counter_broker_code = this.order.counter_broker_code.toUpperCase()
    let alertMessage: AlertMessage = new AlertMessage();
    this.appState.showLoader = true;
    if (this.order.settlementValue === undefined || this.order.settlementValue === null || Number.isNaN(this.order.settlementValue)) {
      this.order.settlementValue = 0;
      this.order.settlementValueCurrency = 0;
    }
    this.orderService.submitOrder(this.order).subscribe(
      data => {
        this.appState.showLoader = false;
        AppUtility.printConsole('Data: ' + data);
      },
      error => {
        this.appState.showLoader = false;
        alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error))._body));
        if (alertMessage.message.length > 0) {
          alertMessage.type = 'danger';
        }
        else {
          alertMessage.type = 'success';
        }
        this.alertMessage = alertMessage;
        this.showOrderConfirmationMsg();

      });

    this.onAlertOk();
  }

  // ---------------------------------------------------------------------------

  updateExchangeMarketIds() {
    this.exchangeId = 0;
    this.marketId = 0;
    this.securityId = 0;
    if (AppUtility.isValidVariable(this.symbolExchMktList) && !AppUtility.isEmpty(this.symbolExchMktList)) {
      for (let i = 0; i < this.symbolExchMktList.length; i++) {
        if (this.symbolExchMktList[i].exchangeCode === this.order.exchange &&
          this.symbolExchMktList[i].marketCode === this.order.market &&
          this.symbolExchMktList[i].securityCode === this.order.symbol) {
          this.exchangeId = this.symbolExchMktList[i].exchangeId;
          this.marketId = this.symbolExchMktList[i].marketId;
          this.securityId = this.symbolExchMktList[i].securityId;
        }
      }

      this.getOrderTypes(this.exchangeId, this.marketId);
      this.getTifOptions(this.exchangeId, this.marketId);
      this.getOrderQualifiers(this.exchangeId, this.marketId);
      this.getExchangeCustodians(this.exchangeId);
      // this.getClientsList(this.exchangeId);
    }
  }

  // ---------------------------------------------------------------------------

  getBondDetails() {
    this.securityMarketDetails = new SecurityMarketDetails();
    this.securityMarketDetails.fisDetail.couponRate = 0;
    if (this.exchangeId > 0 && this.marketId > 0 && this.securityId > 0) {
      this.appState.showLoader = true;
      this.listingService.getSymbolMarket(this.exchangeId, this.marketId, this.securityId)
        .subscribe(data => {

          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(data)) {
            this.updateSecurityDetails(data);
            this.order.settlementValueCurrency = Number(this.order.settlementValue) * Number(this.securityMarketDetails.currencyRate);
          }
        },
          error => {

            this.appState.showLoader = false;
            this.errorMessage = <any>error;

          });
    }
  }

  // ---------------------------------------------------------------------------

  updateSecurityDetails(data) {


    this.securityMarketDetails.updateSecurityMarketData(data);

    
    if (data.taxPercent !== undefined && data.taxPercent !== null) {  //recomended by Sir Hassan
      AppConstants.capitalTaxPercent = data.taxPercent;
    }
    //this.subCategory.value = this.securityMarketDetails.bondSubCategory.subCategory;

    this.calculateAccruedInterest();
  }

  // ---------------------------------------------------------------------------

  splitSymbolExchMkt() {

    let strArr: any[];
    if (this.cmbSymbol.selectedValue != null && this.cmbSymbol.selectedValue.length > 0) {
      //  strArr = this.cmbSymbol.selectedValue.split(AppConstants.splitEMS);
      strArr = AppUtility.isSplitSymbolMarketExchange(this.cmbSymbol.selectedValue);
      this.order.symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
      this.order.market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
      this.order.exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];

      this.updateExchangeMarketIds();
      AppUtility.printConsole('symbol subscribed: ' + this.order.symbol);
      if (this.dataService.isValidBondSymbol(this.order.exchange, this.order.market, this.order.symbol)) {
        this.shareOrderService.setExchange(this.order.exchange);
        this.shareOrderService.setMarket(this.order.market);
        this.shareOrderService.setSymbol(this.order.symbol);
        this.socket.fetchFromChannel("best_orders", { "exchange": this.order.exchange, "market": this.order.market, "symbol": this.order.symbol });
        this.errorMessage = undefined;
        this.authServiceOMS.socket.emit('symbol_sub', { 'exchange': this.order.exchange, 'market': this.order.market, 'symbol': this.order.symbol });
        this.getExchangeData(this.order.exchange);
        this.getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
      }
    }


  }

  // ---------------------------------------------------------------------------

  onSymbolGotFocus(): void {
  }

  // ---------------------------------------------------------------------------

  onSymbolChange(): void {
    this.market = '';
    this.exchange = '';
    this.order.symbol = '';
    this.order.market = '';
    this.order.exchange = '';
    this.statusMsg = '';
    this.symbolStats = new SymbolStats();

    this.splitSymbolExchMkt();
    this.getBondDetails();

  }

  //--------------------------------------------------------------------------
  addTaxExpWithAccruedProfite() {

    // difference
    let calculatedAccruedProfit = this.securityMarketDetails.accrudeProfit;

    let newAccruedProfit = 0;

    newAccruedProfit =
      calculatedAccruedProfit * (1 - Number(AppConstants.capitalTaxPercent) / 100);
    this.AccruedInterest = this.securityMarketDetails.toTrunc(newAccruedProfit, 4);
    this.securityMarketDetails.setAccruedProfit(newAccruedProfit);

  };

  // updateSettlementAmount() {

  //   this.order.settlementValue = Number(this.order.value) + Number(this.securityMarketDetails.accrudeProfit);
  // }
  // ---------------------------------------------------------------------------

  onVolumeChange(): void {

    this.order.value = (Number(this.inputVolume.value) * this.securityMarketDetails.parValue) * (Number(this.inputPrice.value) / 100);

    this.calculateAccruedInterest();

  }

  calculateAccruedInterest() {


    if (this.securityMarketDetails !== undefined && this.securityMarketDetails != null
      && this.securityMarketDetails.exchangeCode !== null) {
      // console.log("volume: " + this.inputVolume.value);
      this.AccruedInterest = this.securityMarketDetails.calculateAccruedProfit(Number(this.inputVolume.value));

      this.AccruedInterest = this.securityMarketDetails.toTrunc(this.AccruedInterest, 4);

      if (AppConstants.capitalTaxPercent > 0) {
        this.addTaxExpWithAccruedProfite();
      }

      // this.updateSettlementAmount();
    }
  }
  // ---------------------------------------------------------------------------

  orderTypeChanged(): void {
    if (this.cmbOrderType.selectedValue != null) {
      this.order.type_ = this.cmbOrderType.selectedValue;
      if (this.order.type_.toLowerCase() === 'market' || this.order.type_.toLowerCase() === 'sm') {
        this.order.price_ = 0;
        this.isPriceDisable = true;
      }
      else {
        this.isPriceDisable = false;
      }

      if (this.order.type_.toLowerCase() === 'sl' || this.order.type_.toLowerCase() === 'sm') {
        this.triggerPriceDisable = false;
      }
      else {
        this.order.triggerPrice_ = 0;
        this.triggerPriceDisable = true;
      }

      if (this.order.type_.toLowerCase() === 'limit' || this.order.type_.toLowerCase() === 'sl') {
        this.isPriceDisable = false;
      }
      else {
        this.isPriceDisable = true;
      }
    }
  }

  // ---------------------------------------------------------------------------

  onPriceChange(): void {


    // console.log("price: " + this.inputPrice.value);

    this.order.value = (Number(this.inputVolume.value) * this.securityMarketDetails.parValue) * (Number(this.inputPrice.value) / 100);
    this.calculateAccruedInterest();
  }



  // ---------------------------------------------------------------------------

  validateOrder(): boolean {
    let errorMsg: string = '';

    if (this.cmbSymbol.text === '' || this.cmbSymbol.text === AppConstants.PLEASE_SELECT_STR) {
      // this.statusMsg="Symbol is required";
      this.cmbSymbol.focus();
      return false;
    }
    else if (!this.isValidSymbol(this.order.symbol)) {

      this.errorMessage = 'Invalid Security';
      this.cmbSymbol.focus();
      return false;
    }
    else if (this.order.volume === 0) {
      // this.statusMsg="Volume is required";
      this.inputVolume.focus();
      return false;
    }
    else if (this.order.volume < 0) {
      // this.statusMsg="Volume should be greater than zero";
      this.inputVolume.focus();
      return false;
    }
    else if ((this.order.type_ === 'limit' || this.order.type_ === 'sl') && this.order.price_ === 0) {
      // this.statusMsg="Price is required";
      this.inputPrice.focus();
      return false;
    }
    else if ((this.order.type_ === 'limit' || this.order.type_ === 'sl') && this.order.price_ < 0) {
      // this.statusMsg="Price should be greater than zero";
      this.inputPrice.focus();
      return false;
    }
    else if (!this.order.account || this.order.account.trim().length === 0) {
      // this.statusMsg="account is required";
      this.checkClientCode = true;
      this.account.focus();
      return false;
    }
    else if ((this.order.type_ === 'sl' || this.order.type_ === 'sm') && this.order.triggerPrice_ === 0) {
      // this.statusMsg="Trigger Price is required";
      this.inputTriggerPrice.focus();
      return false;
    } else if (!this.order.counter_broker_code || this.order.counter_broker_code.trim().length === 0) {

      this.counterBroker.focus();
      return false;
    } else if (!this.order.counter_client_code || this.order.counter_client_code.trim().length === 0) {
      this.statusMsg = "Counter client is required";


      if (this.orderState === 'Reject') {
        return true
      }
      else
        this.counterClient.focus();
      return false;
    }


    return true;
  }

  // ---------------------------------------------------------------------------

  addFromValidations() {
    this.myForm = this._fb.group({
      cmbSymbol: ['', Validators.compose([Validators.required])],
      side: ['', Validators.compose([Validators.required])],
      volume: ['', Validators.compose([Validators.required])],
      price: ['', Validators.compose([Validators.required])],
      account: ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      type: ['', Validators.compose([Validators.required])],
      orderType: ['', Validators.compose([Validators.required])],
      orderValue: ['', Validators.compose([Validators.required])],
      counterBroker: ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      counterClient: ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      // counterClient: [''],
      orderSettlementValue: [''],
      orderSettlementValueCurrency: [''],
      // trader: [''],
      custodian: [''],
      tifOption: [''],
      gtd: [''],
      // gtc: [''],
      qualifier: [''],
      discQuantity: [''],
      tif: [''],
      yield: [''],
      triggerPrice: ['', Validators.compose([Validators.required])],

      subCategory: [''],
      bondType: [''],
      couponRate: [''],
      settlementDate: [''],
      lastCouponDate: [''],
      nextCouponDate: [''],
      accrudeProfit: [''],
      maturityDate: [''],
      tenure: [''],
      parValue: [''],
      currency: [''],
      stlcb: [''],
      stucb: [''],
      statusMsg: ['']
    });
  }

  // ---------------------------------------------------------------------------

  isValidSymbol(symbol: string): boolean {
    let isValidSymbol: boolean = false;
    if (AppUtility.isValidVariable(symbol) && !AppUtility.isEmpty(this.symbolExchMktList)) {
      for (let i = 0; i < this.symbolExchMktList.length; i++) {
        if (this.symbolExchMktList[i].securityCode === symbol) {
          isValidSymbol = true;
        }
      }
    }
    return isValidSymbol;
  }

  // ---------------------------------------------------------------------------

  getExchangeCustodians(exchangeId) {
    let obj: ComboItem;
    this.appState.showLoader = true;
    this.listingService.getCustodianByExchange(exchangeId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
          this.custodians = restData;
          for (let i = 0; i < restData.length; i++) {
            this.custodians[i] = new ComboItem(this.custodians[i].participantCode, this.custodians[i].participantCode);
          }

          obj = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
          this.custodians.unshift(obj);
        }
      },
        error => {

          this.appState.showLoader = false;
          //  this.errorMessage = <any>error
        });
  }

  // -------------------------------------------------------------------------

  // loadTraders(): void
  // {
  //     this.listingService.getUserList(AppConstants.participantId).subscribe(
  //         restData =>
  //         {
  //             if (restData == null)
  //             {
  //                 return;
  //             }

  //             this.traders = [];
  //             for (let i = 0; i < restData.length; i++)
  //             {
  //               this.traders[i] = new ComboItem((<any>restData[i]).userName, (<any>restData[i]).email);
  //             }

  //             this.traders.unshift(new ComboItem(AppConstants.PLEASE_SELECT_STR, ''));
  //         },
  //         error =>
  //         {
  //             this.errorMessage = <any>error;
  //         });
  // }

  // ---------------------------------------------------------------------------

  getBestMarketAndSymbolSummary(exchangeCode, marketCode, securityCode) {
    if (AppUtility.isValidVariable(exchangeCode) &&
      AppUtility.isValidVariable(marketCode) &&
      AppUtility.isValidVariable(securityCode)) {
      AppUtility.printConsole('Getting best market and symbol summary');

      this.appState.showLoader = true;

      this.orderService.getBestMarketAndSymbolStats(exchangeCode, marketCode, securityCode)
        .subscribe(data => {
          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(data)) {
            this.updateBestMarketAndSymbolStats(data);
          }
        },
          error => {

            this.appState.showLoader = false; this.errorMessage = <any>error
          });
    }
  }

  // ---------------------------------------------------------------------------

  updateBestMarketAndSymbolStats(data) {
    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
      // update symbol stats
      if (AppUtility.isValidVariable(data.symbol_summary.stats)) {
        if (this.order.exchange === data.symbol_summary.stats.exchange
          && this.order.market === data.symbol_summary.stats.market
          && this.order.symbol.toString().toUpperCase() === data.symbol_summary.symbol.code.toString().toUpperCase()) {
          data.symbol_summary.stats.symbol = data.symbol_summary.symbol.code;
          this.updateSymbolStatsData(data.symbol_summary.stats);
        }
      }
    }

  }

  // ---------------------------------------------------------------------------

  loadSelectedSymbolFromMarketWatch() {
    if (this.dataService.symbolMktExch.length > 0) {
      let strArr: any[];
      //  let strArr = this.dataService.symbolMktExch.split(AppConstants.splitEMS);
      strArr = AppUtility.isSplitSymbolMarketExchange(this.dataService.symbolMktExch);
      let symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
      let market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
      let exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];

      if (this.dataService.isValidBondSymbol(exchange, market, symbol)) {
        this.order.symbolMktExch = this.dataService.symbolMktExch;
        this.cmbSymbol.selectedValue = this.dataService.symbolMktExch;
        this.cmbSymbol.text = this.dataService.symbolMktExch;

        this.onSymbolChange();

        this.cmbOrderSide.focus();
      }
      else {
        this.cmbSymbol.focus();
        this.clearSelectedSymbol();
      }
    }
    else {
      this.clearSelectedSymbol();
    }

  }

  // ---------------------------------------------------------------------------

  clearSelectedSymbol() {
    this.order.symbolMktExch = '';
    this.cmbSymbol.selectedValue = '';
    this.cmbSymbol.text = AppConstants.PLEASE_SELECT_STR;
  }
  getClientsList(exchangeId) {

    this.appState.showLoader = true;
    this.order.account = '';
    this.fromClientList = [];

    if (AppConstants.participantId !== null) {
      this.listingService.getClientListByExchangeBroker(exchangeId, AppConstants.participantId, true, true)
        .subscribe(restData => {
          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
            if (AppConstants.tradeType === 'gTrade') {
              this.fromClientList = restData;
            }
            if (AppConstants.tradeType === 'vTrade') {

              let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
              this.fromClientList.unshift(x);
              this.order.account = this.fromClientList[0].clientCode;
            }

          } else {
            this.fromClientList = [];
          }
        },
          error => { this.appState.showLoader = false; this.errorMessage = <any>error });
    }
    else {
      let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
      this.fromClientList.unshift(x);
      this.order.account = this.fromClientList[0].clientCode;
    }

  }

  public getExchangeData(exchangeCode: string) {
    this.appState.showLoader = true;

    this.listingService.getExchangeByExchangeCode(exchangeCode)
      .subscribe(restData => {
        this.appState.showLoader = false;
        if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
          this.exchangeData = restData;
          if (this.exchangeData["bondPricingMechanism"] == 2)
            this.isBondPricingMechanismPercentage = true;
          else
            this.isBondPricingMechanismPercentage = false;

          if (this.exchangeData["bondPricingModel"] == 2)
            this.isBondPricingModelDirty = true;
          else
            this.isBondPricingModelDirty = false;
        } else {
          this.exchangeData = [];
          this.isBondPricingMechanismPercentage = false;
          this.isBondPricingModelDirty = false;
        }
      },
        error => {

          this.appState.showLoader = false;
          // this.errorMessage = <any>error
        });
  }
  // -------------------------------------------------------------------------

  updateTraders(data) {
    if (!AppUtility.isValidVariable(data)) {
      return;
    }

    this.traders = [];
    let u: any = new Object();
    u.userName = AppConstants.loginName;
    u.email = AppConstants.username;
    this.traders.push(u);
    this.traders[0].selected = true;
    this.traders[0].$checked = true;
    for (let i = 1; i <= data.length; i++) {
      this.traders[i] = data[i - 1];
      if (data[i - 1].userName === AppConstants.loginName) {
        this.traders[i].selected = true;
        this.traders[i].$checked = true;
      }
    }

  }

  // -------------------------------------------------------------------------
  loadTraders(): void {
    this.appState.showLoader = true;
    this.listingService.getUserList(AppConstants.participantId).subscribe(

      restData => {
        this.appState.showLoader = false;
        if (AppUtility.isEmptyArray(restData)) {

          this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
        }
        else {
          this.updateTraders(restData);
          // this.getWorkingOrders();
        }
      },
      error => {

        this.appState.showLoader = false;
        this.errorMessage = <any>error;


      });

  }

}