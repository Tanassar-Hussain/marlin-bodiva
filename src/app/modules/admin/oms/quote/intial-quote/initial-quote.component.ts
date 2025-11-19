
import { AfterContentChecked, AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertMessage } from 'app/models/alert-message';
import { BestMarket } from 'app/models/best-market';
import { Order } from 'app/models/order';
import { OrderConfirmation } from 'app/models/order-confirmation';
import { SymbolStats } from 'app/models/symbol-stats';
import { Quote } from 'app/models/quote';

import * as wjcInput from '@grapecity/wijmo.input';
//  import * as jQuery from 'jquery';
declare var jQuery: any;
import { AppState } from 'app/app.service';
import { AuthService2 } from 'app/services/auth2.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { TranslateService } from '@ngx-translate/core';
import { ComboItem } from 'app/models/combo-item';

import { UserService } from 'app/core/user/user.service';
import { AppConstants, AppUtility, UserTypes } from 'app/app.utility';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/socket/web-socket.service';

import { AuthService } from 'app/services-oms/auth-oms.service';
import { NewOrderAll } from '../../order/new-order-all/new-order-all';
import { OrderBookShared } from '../../order/order-book-shared/order-book-shared';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'intial-quote',
  templateUrl: './initial-quote.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class InitialQuote implements OnInit, AfterViewInit, OnDestroy {
  public myForm: FormGroup;
  public isSubmitted: boolean;
  public checkClientCode: boolean;

  @Input() modalId: string;
  public sybmolMarketExchange: string;
  public orderSide: string;

  public userType = UserTypes;
  loggedInUserType: string;


  claims: any;
  order: Order;
  quote: Quote;
  bestMarket: BestMarket;
  symbolStats: SymbolStats;
  orderConfirmation: OrderConfirmation;

  dateFormat = AppConstants.DATE_FORMAT;

  exchanges = [];
  markets = [];
  symbols = [];
  exchange: string;
  market: string;
  symbolExchMktList: any[];
  // traders: any[];
  custodians: any[];
  orderSides: any[];


  fromClientList: any[] = [];


  exchangeId: number = 0;
  marketId: number = 0;


  sellBuyPriceLimitErrorMsg: string;


  side: string = '';
  errorMessage: string;
  errorMsg: string;

  statusMsg: string;
  orderConfirmMsg: string = '';
  submitted = false;
  alertMessage: AlertMessage;

  modal = true;
  dialogIsVisible: boolean = false;


  //------------------------------------------
  triggerPriceDisable: boolean = true;
  isPriceDisable: boolean = false;
  triggerPriceCollapse: string = 'collapse';

  isFirstSubmission: boolean = false;


  //---------------------------------------------
  isConfirmationSuccess: boolean = false;
  isConfirmationRejected: boolean = false;
  lang: any


  @ViewChild('order-new-all', { static: false }) NewOrderAll: NewOrderAll;


  @ViewChild('orderSubmittedDlg', { static: false }) orderSubmittedDlg: wjcInput.Popup;
  @ViewChild('cmbSymbol', { static: false }) cmbSymbol: wjcInput.ComboBox;
  @ViewChild('inputBuyVolume', { static: false }) inputBuyVolume: wjcInput.InputNumber;
  @ViewChild('inputBuyPrice', { static: false }) inputBuyPrice: wjcInput.InputNumber;
  @ViewChild('inputSellVolume', { static: false }) inputSellVolume: wjcInput.InputNumber;
  @ViewChild('inputSellPrice', { static: false }) inputSellPrice: wjcInput.InputNumber;
  @ViewChild('account', { static: false }) account: wjcInput.InputMask;

  quantityLabelVolume: number = 500;
  participantId: number;
  isCustodian: boolean;


  // -----------------------------------------------------------------

  constructor(private appState: AppState, public authService: AuthService2, public authServiceOMS: AuthService, private dataService: DataServiceOMS, private loader: FuseLoaderScreenService,
    private listingService: ListingService, private orderService: OrderService, public datePipe : DatePipe,
    private _fb: FormBuilder, private translate: TranslateService, private _userService: UserService,
    public cdr: ChangeDetectorRef, public router: Router, private socket: WebSocketService) {
    this.claims = this.authService.claims;
    this.loggedInUserType = AppConstants.userType;

    this.order = new Order();
    this.quote = new Quote();
    this.quote.buy_order = new Order();
    this.quote.sell_order = new Order();
    this.isCustodian = AppConstants.CUSTODIAN_MODEL;
    this.participantId = AppConstants.participantId;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________




  }

  // -----------------------------------------------------------------






  ngOnDestroy(): void {



  }



  ngOnInit() {
    // Add form Validations
    this.addFromValidations();
    this.init();



  }


  ngOnChanges(changes: SimpleChanges): void {

  }



  // -----------------------------------------------------------------

  init() {
    this.sellBuyPriceLimitErrorMsg = '';
    this.isSubmitted = false;
    this.checkClientCode = false;
    this.order = new Order();
    this.quote = new Quote();
    this.quote.buy_order = new Order();
    this.quote.sell_order = new Order();
    this.isFirstSubmission = false;
    this.bestMarket = new BestMarket();
    this.symbolStats = new SymbolStats();
    this.orderConfirmation = new OrderConfirmation();
    this.alertMessage = new AlertMessage();

    this.isConfirmationSuccess = false;
    this.isConfirmationRejected = false;


    // Updating symbol list
    this.symbolExchMktList = [];
    this.fromClientList = [];
    // Getting Participant security exchanges
    if (AppUtility.isValidVariable(this.dataService.symbolsData) &&
      this.dataService.symbolsData.length > 0) {
      this.updateSymbolList(this.dataService.symbolsData);
    }
    else {
      this.appState.showLoader = true;
      if (AppUtility.isValidVariable(AppConstants.participantId)) {
        this.listingService.getParticipantSecurityExchanges(AppConstants.participantId)
          .subscribe(restData => {
            this.appState.showLoader = false;
            if (AppUtility.isValidVariable(restData)) {
              this.updateSymbolList(restData);
            }
          },
            error => { this.appState.showLoader = false; this.errorMessage = <any>error });
      }
      if (AppConstants.participantId === null) {
        this.listingService.getexchangeCodeSecurityExchanges()
          .subscribe(restData => {
            this.appState.showLoader = false;
            if (AppUtility.isValidVariable(restData)) {
              this.updateSymbolList(restData);
            }
          },
            error => { this.appState.showLoader = false; this.errorMessage = <any>error });
      }

    }

    // Getting order sides
    this.orderSides = this.listingService.getOrderSides();


    // if (this.userType === 'PARTICIPANT' || this.userType === 'PARTICIPANT ADMIN' )
    // {
    //     this.loadTraders();
    // }
  }

  // -----------------------------------------------------------------

  ngAfterViewInit(): void {

    this.authServiceOMS.socket.on('order_confirmation', (dataorderConfirmation) => { this.updateorderConfirmation(dataorderConfirmation); });
    this.authServiceOMS.socket.on('best_market', (dataBM) => { this.updateBestMarketData(dataBM); });
    this.authServiceOMS.socket.on('symbol_stat', (dataSS) => { this.updateSymbolStatsData(dataSS); });

    // this.getSelectedData();

    this.cmbSymbol.invalidate();
    this.cmbSymbol.refresh();
    this.cmbSymbol.focus();
  }

  // -----------------------------------------------------------------



  public show() {
    this.init();
    jQuery('#initialize-quote').modal({ backdrop: 'static', keyboard: true });
    jQuery('#initialize-quote').modal('show');
  }
















  // -----------------------------------------------------------------

  onClose() {

    jQuery('#initialize-quote').modal('hide');
    jQuery('#initialize-quote').modal('hide');
    this.init();
    this.loadSelectedSymbolFromMarketWatch();
    AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    AppConstants.isSelectedEquities = false;



  }

  // -----------------------------------------------------------------








  // required
  updateSymbolList(data) {
    let symbolList: any[] = [];
    let cmbItem: ComboItem;
    let mktIndex: number = 0;
     
    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].marketTypeCode.toUpperCase() === AppConstants.MARKET_TYPE_QUOTE_.toUpperCase()) {
           
          symbolList[mktIndex] = data[i];
          symbolList[mktIndex].value = data[i].displayName_;
          mktIndex++;
        }
      }

      cmbItem = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
      symbolList.unshift(cmbItem);
      this.order.symbolMktExch = '';
    }

    this.symbolExchMktList = symbolList;
  }

  // -----------------------------------------------------------------







  // -----------------------------------------------------------------
  //required
  updateBestMarketData(data) {

    console.log("Best Market: ========================== " + JSON.stringify(data));
  }

  // -----------------------------------------------------------------
  //required
  updateSymbolStatsData(data) {
    if (this.order.symbol === data.symbol) {
      this.symbolStats.updateSymbolStatsForOrderWindow(data);
      this.cdr.detectChanges();
    }
  }

  updateSymbolStatsBidAndOffer(data) {
    if (this.order.symbol === data.symbol) {
      this.symbolStats.updateStatsForBidAndOffer(data);
    }
  }
  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  //required
  updateorderConfirmation(data) {

    let alertMessage: AlertMessage = this.order.formatOrderConfirmationMsg(data, AppConstants.MARKET_TYPE_QUOTE_);
    this.alertMessage = alertMessage;
    this.showOrderConfirmationMsg();
    this.resetForm();
  }
















  // -----------------------------------------------------------------
  //required
  showOrderConfirmationMsg() {
    if (this.alertMessage.type === 'success') {
      this.isConfirmationSuccess = true;
      this.isConfirmationRejected = false;
    }
    else if (this.alertMessage.type === 'danger') {
      this.isConfirmationRejected = true;
      this.isConfirmationSuccess = false;
    }
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isConfirmationRejected = false;
      this.isConfirmationSuccess = false;
    }, AppConstants.TIME_OUT_CONFIRMATION_MSG);

  }

  // -----------------------------------------------------------------

  closeAlert() {
    this.isConfirmationSuccess = false;
    this.isConfirmationRejected = false;
  }

  // -----------------------------------------------------------------

  onAlertOk(): void {
    this.resetForm();
    this.cmbSymbol.focus();
  }

  // -----------------------------------------------------------------

  onAlertCancel(): void {
    this.cmbSymbol.focus();
  }

  // -----------------------------------------------------------------

  resetForm(): void {
    this.isSubmitted = false;
    this.checkClientCode = false;
    this.order.volume = 0;
    this.order.price_ = 0;
    this.order.value = 0;
    this.order.type_ = 'limit';
    this.order.triggerPrice_ = 0;
    this.statusMsg = '';
  }

  // -----------------------------------------------------------------

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

  // -----------------------------------------------------------------

  onSubmit(model: any, isValid: boolean) {
     
    this.isSubmitted = true;
    let date = new Date();
    if (this.validateOrder()) {
      this.submitted = true;

       if(date < this.order.gtd){
         
        this.quote.buy_order.type = 'gtd';
        this.quote.sell_order.type = 'gtd';
       }else{
         
        this.quote.buy_order.type = 'limit';
        this.quote.sell_order.type = 'limit';
       }

      this.quote.buy_order.exchange = this.order.exchange;
      this.quote.buy_order.market = this.order.market;
      this.quote.buy_order.symbol = this.order.symbol;
      this.quote.buy_order.symbolMktExch = this.order.symbolMktExch;
      this.quote.buy_order.price = this.quote.buy_order.price_.toString();
      this.quote.buy_order.account = this.order.account;
      this.quote.buy_order.custodian = this.order.custodian;
      this.quote.buy_order.side = "buy";
      this.quote.buy_order.tifOption = 'DO';
      this.quote.buy_order.qualifier = "No Qualifier";
      this.quote.buy_order.expiryDate = this.datePipe.transform(this.order.gtd , 'yyyy-MM-dd');
      this.quote.buy_order.gtd = this.order.gtd;


      this.quote.sell_order.exchange = this.order.exchange;
      this.quote.sell_order.market = this.order.market;
      this.quote.sell_order.symbol = this.order.symbol;
      this.quote.sell_order.symbolMktExch = this.order.symbolMktExch;
      this.quote.sell_order.price = this.quote.sell_order.price_.toString();
      this.quote.sell_order.account = this.order.account;
      this.quote.sell_order.custodian = this.order.custodian;
      this.quote.sell_order.side = "sell";
      this.quote.sell_order.tifOption = 'DO';
      this.quote.sell_order.qualifier = "No Qualifier";
      this.quote.sell_order.expiryDate = this.datePipe.transform(this.order.gtd , 'yyyy-MM-dd');
      this.quote.sell_order.gtd = this.order.gtd;


      this.statusMsg = "Submit Quote for " + this.order.symbol + ", " + AppUtility.ucFirstLetter(this.quote.sell_order.side) + ' ' + this.quote.sell_order.volume + "@" + this.quote.sell_order.price + ' ' + AppUtility.ucFirstLetter(this.quote.buy_order.side) + ' ' + this.quote.buy_order.volume + "@" + this.quote.buy_order.price
     
      this.showDialog(this.orderSubmittedDlg);
    }
    else {
      this.isFirstSubmission = false;
    }
  }

  submitOrder() {
    // this.dialogIsVisible=false;
    this.appState.showLoader = true;

    this.orderService.submitQuoteOrder(this.quote).subscribe((data) => {

    }, error => {
      console.log(error);
      let alertMessage: AlertMessage = new AlertMessage();
      alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error)).error));
      if (alertMessage.message.length > 0) {
        alertMessage.type = 'danger';
      }
      else {
        alertMessage.type = 'success';
      }

      this.alertMessage = alertMessage;
      this.showOrderConfirmationMsg();
    })

    this.onAlertOk();
  }

  //required
  updateExchangeMarketIds() {


    if (AppUtility.isValidVariable(this.symbolExchMktList) && !AppUtility.isEmpty(this.symbolExchMktList)) {
      for (let i = 0; i < this.symbolExchMktList.length; i++) {
        if (this.symbolExchMktList[i].exchangeCode === this.order.exchange &&
          this.symbolExchMktList[i].marketCode === this.order.market &&
          this.symbolExchMktList[i].securityCode === this.order.symbol) {
          this.exchangeId = this.symbolExchMktList[i].exchangeId;

          this.marketId = this.symbolExchMktList[i].marketId;

        }
      }
      this.getExchangeCustodians(this.exchangeId);
      this.getClientsList(this.exchangeId);
    }
  }

  // -----------------------------------------------------------------



  //required
  splitSymbolExchMkt() {


    try {

      let strArr: any[];

      if (this.cmbSymbol.selectedValue != null && this.cmbSymbol.selectedValue.length > 0) {
        strArr = AppUtility.isSplitSymbolMarketExchange(this.cmbSymbol.selectedValue);
        this.order.symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
        this.order.market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
        this.order.exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];
        if (this.dataService.isValidEquitySymbol(this.order.exchange, this.order.market, this.order.symbol)) {
          this.errorMsg = undefined;

          //for updating symbol stats
          this.getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
          // get lists for custodian and client
          this.updateExchangeMarketIds();
          this.getBestMarketDEtails();
        }
      }
    }
    catch (error) {
    }
  }

  //required
  public getBestMarketDEtails = () => {

    this.orderService.getBestMarketAndSymbolStats(this.order.exchange, this.order.market, this.order.symbol).subscribe((res: any) => {
      console.log('response', res);

      let bm = res.best_market;
      if (bm === undefined || bm === null) { return; };
      let sell_market = bm.sell;
      let buy_market = bm.buy;
      if (this.order.side === 'buy') {

        this.order.price_ = Number(sell_market.price);
      }
      if (this.order.side === 'sell') {

        this.order.price_ = Number(buy_market.price);
      }

    })
  }



  // -----------------------------------------------------------------
  //required
  onSymbolChange(): void {
    // this.showDialog(this.orderSubmittedDlg) ;
    // console.log("symbol change event called, symbol="+ this.cmbSymbol.selectedValue);
    this.market = '';
    this.exchange = '';
    this.order.symbol = '';
    this.order.market = '';
    this.order.exchange = '';
    this.statusMsg = '';
    this.symbolStats = new SymbolStats();

    this.splitSymbolExchMkt();
  }

  // -----------------------------------------------------------------

  onBuyPriceChange() {

    this.quote.buy_order.value = Number(this.inputBuyPrice.value) * Number(this.inputBuyVolume.value);
    this.quote.buy_order.settlementValue = Number(this.inputBuyPrice.value) * Number(this.inputBuyVolume.value);
    // this.quote.buy_order.price_ = Number(this.inputBuyPrice.value);
  }
  onBuyVolumeChange(): void {
    this.quote.buy_order.value = Number(this.inputBuyPrice.value) * Number(this.inputBuyVolume.value);
    this.quote.buy_order.settlementValue = Number(this.inputBuyPrice.value) * Number(this.inputBuyVolume.value);
  }

  onSellPriceChange() {
    this.quote.sell_order.value = Number(this.inputSellPrice.value) * Number(this.inputSellVolume.value);
    this.quote.sell_order.settlementValue = Number(this.inputSellPrice.value) * Number(this.inputSellVolume.value);
    // this.quote.sell_order.price_ = Number(this.inputSellPrice.value);
  }

  onSellVolumeChange() {
    this.quote.sell_order.value = Number(this.inputSellPrice.value) * Number(this.inputSellVolume.value);
    this.quote.sell_order.settlementValue = Number(this.inputSellPrice.value) * Number(this.inputSellVolume.value);
  }

  // -----------------------------------------------------------------



  // -----------------------------------------------------------------
  //required
  validateOrder(): boolean {
    let errorMsg: string = '';
    // AppUtility.printConsole("symbol value: "+ this.cmbSymbol.selectedValue);
    if (this.cmbSymbol.text === '' || this.cmbSymbol.text === AppConstants.PLEASE_SELECT_STR) {
      // this.statusMsg="Symbol is required";
      this.cmbSymbol.focus();
      return false;
    }
    // ---------------
    else if (!this.isValidSymbol(this.order.symbol)) {
      this.errorMsg = 'Invalid Security';
      this.cmbSymbol.focus();
      return false;
    }
    // --------------------
    else if (this.quote.buy_order.price_ <= 0) {
      // this.statusMsg="Volume is required";
      this.inputBuyPrice.focus();
      return false;
    }
    else if (this.quote.buy_order.volume <= 0) {
      // this.statusMsg="Volume is required";
      this.inputBuyVolume.focus();
      return false;
    }
    else if (this.quote.sell_order.price_ <= 0) {
      // this.statusMsg="Volume is required";
      this.inputSellPrice.focus();
      return false;
    }
    // if buy price is not less than sell price
    else if (this.quote.sell_order.price_ <= this.quote.buy_order.price_) {
      if (this.lang === 'pt') {
        this.sellBuyPriceLimitErrorMsg = 'O preço de compra deve ser menor que o preço de venda';
      }
      else {
        this.sellBuyPriceLimitErrorMsg = 'Buy price should be less than sell price';
      }

      return false;
    }
    else if (this.quote.sell_order.volume === 0 || this.quote.sell_order.volume < 0) {
      // this.statusMsg="Volume is required";
      this.inputSellVolume.focus();
      return false;
    }
    //if buy volume is less than sell volume
    else if (this.quote.buy_order.volume > this.quote.sell_order.volume) {
      this.inputBuyVolume.focus();

      return false;
    }
    // conditions for buy and sell price
    // for client
    else if (!this.order.account || this.order.account.trim().length === 0) {
      if (this.lang === 'pt') {
        this.statusMsg = "A conta é necessária";
      }
      else {
        this.statusMsg = "Account is required";
      }

      this.checkClientCode = true;
      this.account.focus();
      return false;
    }

    return true;
  }

  // -----------------------------------------------------------------

  addFromValidations() {
    this.myForm = this._fb.group({
      cmbSymbol: ['', Validators.compose([Validators.required])],
      buy_volume: ['', Validators.compose([Validators.required])],
      buy_price: ['', Validators.compose([Validators.required])],
      sell_volume: ['', Validators.compose([Validators.required])],
      sell_price: ['', Validators.compose([Validators.required])],
      account: ['', Validators.compose([Validators.required, Validators.minLength(1)])],
      custodian: [''],
      gtd: [''],
      // gtc: [''],
      statusMsg: ['']
    });
  }

  // -----------------------------------------------------------------
  //required
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

  // -----------------------------------------------------------------
  //required
  getExchangeCustodians(exchangeId) {
    let obj: ComboItem;
    this.appState.showLoader = true;

    this.listingService.getCustodianByExchange(exchangeId)
      .subscribe(restData => {

        this.appState.showLoader = false;
        if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
          this.custodians = restData;
          console.log('data', JSON.stringify(this.custodians));
          for (let i = 0; i < restData.length; i++) {
            this.custodians[i] = new ComboItem(this.custodians[i].participantCode, this.custodians[i].participantCode);
          }

          obj = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
          this.custodians.unshift(obj);
          // this.order.custodian= "";
        }
      },
        error => { this.appState.showLoader = false; this.errorMessage = <any>error });
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

  // -----------------------------------------------------------------
  //required
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

            AppUtility.printConsole('Data Received: ' + JSON.stringify(data));
            this.updateBestMarketAndSymbolStats(data);
          }
        },
          error => { this.appState.showLoader = false; this.errorMessage = <any>error });
    }
  }

  // -----------------------------------------------------------------
  //required
  updateBestMarketAndSymbolStats(data) {
    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
      // update symbol stats
      if (AppUtility.isValidVariable(data.best_market)) {
        if (this.order.exchange === data.best_market.exchange
          && this.order.market === data.best_market.market
          && this.order.symbol.toString().toUpperCase() === data.best_market.symbol) {
          this.updateSymbolStatsBidAndOffer(data.best_market);
        }
      }
    }

  }

  // -----------------------------------------------------------------
  //required
  loadSelectedSymbolFromMarketWatch() {
    if (this.dataService.symbolMktExch.length > 0) {
      let strArr: any[];
      //  let strArr = this.dataService.symbolMktExch.split(AppConstants.splitEMS);
      strArr = AppUtility.isSplitSymbolMarketExchange(this.dataService.symbolMktExch);
      let symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
      let market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
      let exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];
      if (this.dataService.isValidEquitySymbol(exchange, market, symbol)) {
        this.order.symbolMktExch = this.dataService.symbolMktExch;
        this.cmbSymbol.selectedValue = this.dataService.symbolMktExch;
        this.cmbSymbol.text = this.dataService.symbolMktExch;
        this.onSymbolChange();
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


  // -----------------------------------------------------------------
  //required
  clearSelectedSymbol() {
    this.order.symbolMktExch = '';
    this.cmbSymbol.selectedValue = '';
    this.cmbSymbol.text = AppConstants.PLEASE_SELECT_STR;
  }


  //required
  getClientsList(exchangeId) {

    this.loader.show();
    this.order.account = '';
    this.fromClientList = [];

    if (AppConstants.participantId !== null) {
      this.listingService.getClientListByExchangeBroker(exchangeId, AppConstants.participantId, true, true)
        .subscribe(restData => {
          this.loader.hide();
          if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {

            this.fromClientList = restData;



          } else {
            this.fromClientList = [];
          }
        },
          error => { this.loader.hide();; this.errorMessage = <any>error });
    }
    else {
      let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
      this.fromClientList.unshift(x);
      this.order.account = this.fromClientList[0].clientCode;
    }

  }

}

