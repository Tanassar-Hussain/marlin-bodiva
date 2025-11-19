import { AfterContentChecked, AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertMessage } from 'app/models/alert-message';
import { BestMarket } from 'app/models/best-market';
import { Order } from 'app/models/order';
import { OrderConfirmation } from 'app/models/order-confirmation';
import { SymbolStats } from 'app/models/symbol-stats';

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
import { NewOrderAll } from '../new-order-all/new-order-all';
import { UserService } from 'app/core/user/user.service';
import { AppConstants, AppUtility, UserTypes } from 'app/app.utility';
import { ShareOrderService } from '../order.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/socket/web-socket.service';
import { OrderBookShared } from '../order-book-shared/order-book-shared';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { Notification } from 'app/layout/layouts/classy/notifications/notification';
import { Notifications } from 'app/layout/layouts/classy/notifications/notifications.component';
import { virtualOrder } from 'app/models/virtual-order';
import { SecurityMarketDetails } from 'app/models/security-market-details';
import { UserClient } from 'app/models/user-client.model';
import { PendingOrdersService } from 'app/services/pending-orders.service';
import { RefinedOrder } from 'app/models/refined-order.model';

@Component({
  selector: '[order-new-etf]',
  templateUrl: './order-new-etf.html',
  styleUrls: ['../components.style.scss'],
  encapsulation: ViewEncapsulation.None,



})
export class OrderNewETF implements OnInit, AfterViewInit, OnDestroy {
  public myForm: FormGroup;
  public isSubmitted: boolean;
  public checkClientCode: boolean;

  @Input() sharedData: any;
  @Input() sharedSide: string;
  @Input() sharedIndex: number;

  public sybmolMarketExchange: string;
  public orderSide: string;

  public userType = UserTypes;
  loggedInUserType: string;

  vTradePayload : virtualOrder;

  claims: any;
  order: Order;
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
  orderTypes: any[];
  orderTypesTemp: any[];
  tifOptions: any[];
  qualifiers: any[];
  fromClientList: any[] = [];


  exchangeId: number = 0;
  marketId: number = 0;


  side: string = '';
  errorMessage: string;
  errorMsg: string;
  statusMsg: string;
  orderConfirmMsg: string = '';
  submitted = false;
  alertMessage: AlertMessage;

  modal = true;
  dialogIsVisible: boolean = false;
  triggerPriceDisable: boolean = true;
  isPriceDisable: boolean = false;
  triggerPriceCollapse: string = 'collapse';

  isFirstSubmission: boolean = false;
  isConfirmationSuccess: boolean = false;
  isConfirmationRejected: boolean = false;
  lang: any
  sideDisabled: boolean = false;

  @ViewChild('order-new-all', { static: false }) NewOrderAll: NewOrderAll;
  @ViewChild(OrderBookShared) orderBookShared: OrderBookShared;

  @ViewChild(Notifications) notifications: Notification;

  @ViewChild('orderSubmittedDlg', { static: false }) orderSubmittedDlg: wjcInput.Popup;
  @ViewChild('cmbSymbol', { static: false }) cmbSymbol: wjcInput.ComboBox;
  @ViewChild('cmbOrderType', { static: false }) cmbOrderType: wjcInput.ComboBox;
  @ViewChild('cmbOrderSide', { static: false }) cmbOrderSide: wjcInput.ComboBox;
  @ViewChild('inputVolume', { static: false }) inputVolume: wjcInput.InputNumber;
  @ViewChild('inputPrice', { static: false }) inputPrice: wjcInput.InputNumber;
  @ViewChild('account', { static: false }) account: wjcInput.InputMask;
  @ViewChild('inputTriggerPrice', { static: false }) inputTriggerPrice: wjcInput.InputNumber;



  tradeType: string;
  selfClientList: any[];

  quantityLabelVolume: number = 500;
  participantId: number;
  public sharedOrderData: any = null;
  actualTrade: string = "";
  virtualTrde: string = "";
  remainingBuyingPower: number = 0;
  holding : number = 0;
  disabledSubmit: boolean = false;
  securityType: string = "";
  securityMarketDetails = new SecurityMarketDetails();
  securityId: number = 0;
  currencyCode : String = AppConstants.LOCAL_CURRENCY_AOA_CODE;
  selectedClient = new UserClient();

  // -----------------------------------------------------------------

  constructor(private appState: AppState, public authService: AuthService2, public authServiceOMS: AuthService, private dataService: DataServiceOMS,
    private listingService: ListingService, private orderService: OrderService, private readonly _pendingOrderService: PendingOrdersService,
    private _fb: FormBuilder, private translate: TranslateService, private _userService: UserService, public shareOrderService: ShareOrderService,
    public cdr: ChangeDetectorRef, public router: Router, private socket: WebSocketService) {

    this.vTradePayload = new virtualOrder();
    this.claims = this.authService.claims;
    this.loggedInUserType = AppConstants.userType;
    this.authService.tradeChange.subscribe((value) => {
      this.tradeType = value;
    });
    this.order = new Order();
    this.actualTrade = AppConstants.ACTUAL_TRADE_TYPE;
    this.virtualTrde = AppConstants.VIRTUAL_TRADE_TYPE;
    this.participantId = AppConstants.participantId;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________

    this.currencyCode = AppConstants.LOCAL_CURRENCY_AOA_CODE;



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

    if (changes.sharedData || changes.sharedSide || changes.sharedIndex) {
      this.getSelectedData();

    }




  }







  // -----------------------------------------------------------------

  init() {

    this.isSubmitted = false;
    this.checkClientCode = false;
    this.order = new Order();
    this.isFirstSubmission = false;
    this.bestMarket = new BestMarket();
    this.symbolStats = new SymbolStats();
    this.orderConfirmation = new OrderConfirmation();
    this.alertMessage = new AlertMessage();

    this.remainingBuyingPower = 0;
    this.holding = 0;

    this.isConfirmationSuccess = false;
    this.isConfirmationRejected = false;

    let exchCode: string = '';
    let mktCode: string = '';

    let symbolItems: any[] = [];

    this.symbolStats = new SymbolStats();
    this.orderTypesTemp = this.orderTypes;

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
    this.getSelectedData();

   // this.isUserClient ? this.getLoggedInUserClientsList() : this.getClientsList(AppConstants.exchangeId);
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










  public onChangeClient = (event)=>{
    this.holding = 0;
    this.remainingBuyingPower = 0;
    if(AppUtility.isValidVariable(event) && this.tradeType === this.actualTrade){
      this.getClientMarginDetails(AppConstants.participantCode, this.order.exchange, event, AppConstants.username);
    }
  }

  public onChangeUserClient = (event)=>{
    this.holding = 0;
    this.remainingBuyingPower = 0;
    if(!AppUtility.isEmpty(event?.participantCode) && this.tradeType === this.actualTrade){
        this.selectedClient = event;
        this.order.account = this.selectedClient?.clientCode;
        this.getClientMarginDetails(this.selectedClient.participantCode, this.order.exchange, this.selectedClient.clientCode, AppConstants.username);
    }
   
}


  getClientMarginDetails(lBC: string, eC: string, cC: string, user: string) {
    let holdingArr = [];
    this.holding = 0;
    this.orderService.getClientMarginDetails(lBC, eC, cC, user).
      subscribe(resdata => {
        if (!AppUtility.isEmptyArray(resdata)) {
          let tempData: any = resdata;
          let holdingArr = tempData.holding;
          this.remainingBuyingPower = Number(tempData.remaining_buying_power);

          if(AppUtility.isValidVariable(holdingArr)){
          holdingArr.forEach(element => {
             if(element.security === this.order.symbol){
                this.holding = element.holding;
             }
          });
        }
        }
 
      },
      error => {
        
        console.log(error);
        
      }
      );
  }




  public refreshBuyingPower = () => {
    if(AppUtility.isValidVariable(this.order.account)  && this.tradeType === this.actualTrade){
      this.getClientMarginDetails(AppConstants.participantCode, this.order.exchange, this.order.account, AppConstants.username);
    }
  }









  public getSelectedData = () => {


    if (AppUtility.isValidVariable(this.sharedData) && AppUtility.isValidVariable(this.sharedSide)) {
      if (this.sharedSide === 'B') {
        this.sybmolMarketExchange = AppUtility.symbolMarketExchangeComb(this.sharedData.securityCode, this.sharedData.marketCode, this.sharedData.exchangeCode);
        this.order.symbolMktExch = this.sybmolMarketExchange;
        this.order.side = 'buy';
        this.order.price_ = Number(this.sharedData.offerPrice);
        this.cmbSymbol.focus();

      }
      if (this.sharedSide === 'S') {
        this.sybmolMarketExchange = AppUtility.symbolMarketExchangeComb(this.sharedData.securityCode, this.sharedData.marketCode, this.sharedData.exchangeCode);
        this.order.symbolMktExch = this.sybmolMarketExchange;
        this.order.side = 'sell';
        this.order.price_ = Number(this.sharedData.offerPrice);
        this.cmbSymbol.focus();
      }
      this.cdr.detectChanges();
    }



  }




  // -----------------------------------------------------------------

  onClose() {

    jQuery('#new-order-all-menu').modal('hide');
    jQuery('#new-order-all-market').modal('hide');
    this.init();
    this.loadSelectedSymbolFromMarketWatch();
    AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    AppConstants.isSelectedEquities = false;



  }

  // -----------------------------------------------------------------









  updateSymbolList(data) {
    
    let symbolList: any[] = [];
    let cmbItem: ComboItem;
    let mktIndex: number = 0;
    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].marketTypeCode === AppConstants.MARKET_TYPE_ETF_ || (data[i].marketTypeCode === AppConstants.MARKET_TYPE_QUOTE_)) {
      //  if (data[i].assetId === 6 ) {
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

  getOrderTypes(exchangeId, marketId) {
    // Updating order types
    this.appState.showLoader = true;
    this.listingService.getOrderTypesByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.updateOrderTypesData(restData);
      },
        error => { this.appState.showLoader = false; this.errorMessage = <any>error });
  }

  // -----------------------------------------------------------------

  getTifOptions(exchangeId, marketId) {
    this.tifOptions = [];
    this.appState.showLoader = true;
    this.listingService.getTifOptionsByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.tifOptions = restData;
        this.order.tifOption = 'DO';
      },
        error => { this.appState.showLoader = false; this.errorMessage = <any>error });
  }

  // -----------------------------------------------------------------

  getOrderQualifiers(exchangeId, marketId) {

    this.qualifiers = [];
    this.appState.showLoader = true;
    this.listingService.getOrderQualifiersByExchangeMarket(exchangeId, marketId)
      .subscribe(restData => {
        this.appState.showLoader = false;
        this.qualifiers = restData.reverse();
        this.order.qualifier = "No Qualifier";

      },
        error => { this.appState.showLoader = false; this.errorMessage = <any>error });
  }

  // -----------------------------------------------------------------

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

  // -----------------------------------------------------------------

  orderSideChanged(): void {

    this.order.side = this.cmbOrderSide.selectedValue;
    this.updateOrderTypes();
    this.getBestMarketDEtails();

  }

  // -----------------------------------------------------------------

  updateOrderTypes(): void {

    this.orderTypes = [];

    if (this.orderTypes != null && this.orderTypesTemp != null) {
      // tslint:disable-next-line:forin
      for (let key in this.orderTypesTemp) {
        let orderType = this.orderTypesTemp[key];

        // if (this.order.side === 'buy' &&
        //   !(orderType.code.toLowerCase() === 'sl' || orderType.code.toLowerCase() === 'sm')) {
        //   this.orderTypes.push(orderType);
        //   this.getBestMarketDEtails();
        // }

        if (this.order.side === 'sell' || this.order.side === 'buy') {
          this.orderTypes.push(orderType);
          this.getBestMarketDEtails();
           // this.getBestMarketDEtails();   //commented from here and added in orderSideChanged() method, Defect id 801 -- @Faizan-17-05-2023
        }
      }
    }
  }

  // -----------------------------------------------------------------

  updateBestMarketData(data) {

    //  console.log("Best Market: ========================== " + JSON.stringify(data));
  }

  // -----------------------------------------------------------------

  updateSymbolStatsData(data) {
    if (this.order.symbol === data.symbol) {
      this.symbolStats.updateSymbolStatsForOrderWindow(data);
      this.cdr.detectChanges();
    }
  }

  // -----------------------------------------------------------------

  tifOptionChanged(): void {
    if(this.order.tifOption == 'GTC'){
         this.order.gtd = null;
    }else{
      this.order.gtd = new Date();
    }
}

  // -----------------------------------------------------------------

  qualifierChanged(): void {

  }

  // -----------------------------------------------------------------

  updateorderConfirmation(data) {

    let alertMessage: AlertMessage = this.order.formatOrderConfirmationMsg(data, 'Equity');
    this.alertMessage = alertMessage;
    this.showOrderConfirmationMsg();
    this.resetForm();
  }

  // -----------------------------------------------------------------

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
    this.order.settlementValueCurrency = 0;
    this.order.type_ = 'limit';
    this.order.triggerPrice_ = 0;
    this.statusMsg = '';
    this.order.account = AppConstants.PLEASE_SELECT_STR;
    
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

    if (this.validateOrder()) {
      this.submitted = true;

      this.order.price = this.order.price_.toString();
      this.order.triggerPrice = this.order.triggerPrice_.toString();
      this.order.type = this.order.type_.toLowerCase();
      this.order.market = this.order.market.toUpperCase();
      this.statusMsg = this.order.formatOrderSubmitMsg('Equity');

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

  // -----------------------------------------------------------------


  private _submitClientOrder(){
    const order: Partial<RefinedOrder> = {
        ...this.order,
        exchangeId: this.exchangeId,
        marketId: this.marketId,
        participant: AppUtility.isNullOrEmpty(this.selectedClient.participantCode) ? AppConstants.participantCode : this.selectedClient.participantCode,
        participantId: (!AppUtility.isValidVariable(this.selectedClient.participantId) || this.selectedClient.participantId == 0 ) ? AppConstants.participantId : this.selectedClient.participantId,
        userId: AppConstants.userId,
        senderUserId: AppConstants.userId,
        username: AppConstants.username,
        symbolId: this.symbolExchMktList.find(security => security.securityCode === this.order.symbol)?.securityId,
        clientId: this.fromClientList.find(client => client.clientCode === this.order.account)?.clientId,
        asset_id: this.symbolExchMktList.find(security => security.securityCode === this.order.symbol)?.assetId,
        orderTypeMappingId: this.orderTypes.find(type => type.value === this.order.type_)?.id,
        tifOptionMappingId: this.tifOptions.find(option => option.code === this.order.tifOption)?.id,
        orderQualifierMappingId: this.qualifiers.find(qualifier => qualifier.code === this.order.qualifier)?.id,
        actual_settlement_amount: String(this.order.actual_settlement_amount) as unknown as number,
    }

    this._pendingOrderService.submitClientOrder(order).subscribe({
        next: (res) => {
            this.appState.showLoader = false;
            this.disabledSubmit = false;
            let alertMessage: AlertMessage = new AlertMessage();
            alertMessage.message = res.message || 'Order forward to the participant.';
            alertMessage.type = 'success';
            this.alertMessage = alertMessage;
            this.showOrderConfirmationMsg();
            this.onAlertOk();
        },
        error: (err) => {
            this.appState.showLoader = false;
            this.disabledSubmit = false;
            let alertMessage: AlertMessage = new AlertMessage();
            alertMessage.message = err.error.message;
            alertMessage.type = 'danger';
            this.alertMessage = alertMessage;
            this.showOrderConfirmationMsg();
        }
    })
}

  get isUserClient(){
      return AppConstants.USER_TYPE_CLIENT_CODE === AppConstants.userType;
  }

  getLoggedInUserClientsList() {
      this.appState.showLoader = true;
      this.selectedClient = new UserClient();
      this.selectedClient.clientCode = AppConstants.PLEASE_SELECT_STR;
      this.fromClientList = [];

      this.listingService.getClientList().subscribe({
          next: (clients) => {
              this.appState.showLoader = false;

              if (AppUtility.isValidVariable(clients) && !AppUtility.isEmpty(clients)) {
                  // Create the default client object
                  const defaultClient = new UserClient();
                  defaultClient.displayValue = AppConstants.PLEASE_SELECT_STR;
                  defaultClient.clientCode = AppConstants.PLEASE_SELECT_STR;

                  // Add the default client to the list
                  AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE ? (this.fromClientList = clients) : [];
                  this.fromClientList.unshift(defaultClient);

                  // Set the first client as selected based on tradeType
                  this.selectedClient = new UserClient();
                  this.selectedClient.clientCode = this.fromClientList[0].clientCode;
              }

              this.cdr.detectChanges();
          },
          error: (error) => {
              this.appState.showLoader = false;
              this.errorMessage = <any>error;
          }
      });
  }








  submitOrder() {
    // this.dialogIsVisible=false;
    this.appState.showLoader = true;
    this.disabledSubmit = true;
    if (AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE) {
      if(AppConstants.userType !== AppConstants.USER_TYPE_CLIENT_CODE) {
        this.orderService.submitOrder(this.order).subscribe(
            data => {
                this.disabledSubmit = false;
                this.appState.showLoader = false;
            },
            error => {
                this.disabledSubmit = false;
                this.appState.showLoader = false;
                let alertMessage: AlertMessage = new AlertMessage();
                alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error)).error));

                if (alertMessage.message.length > 0) {
                    alertMessage.type = 'danger';
                } else {
                    alertMessage.type = 'success';
                }

                this.alertMessage = alertMessage;
                this.showOrderConfirmationMsg();

            });
    }
    else 
   {
        this._submitClientOrder();
   }

      this.onAlertOk();
    }
    // ================================ Vtrade Order ============================= //
    if (AppConstants.tradeType === AppConstants.VIRTUAL_TRADE_TYPE) {
      this.vTradePayload = new virtualOrder();
      this.vTradePayload.exchangeCode = this.order.exchange;
      this.vTradePayload.marketCode = this.order.market;
      this.vTradePayload.price = this.order.price_;
      this.vTradePayload.quantity = this.order.volume;
      this.vTradePayload.tradeValue = this.order.value;
      if (this.order.side == 'buy') {
        this.vTradePayload.buySell = 'B';
      }
      if (this.order.side == 'sell') {
        this.vTradePayload.buySell = 'S';
      }
      this.vTradePayload.securityCode = this.order.symbol;
      this.vTradePayload.userId = AppConstants.userId;
      console.log(this.vTradePayload);
      this.orderService.postBuySellOrder(this.vTradePayload).subscribe((res) => {
        this.disabledSubmit = false;
        if (res.response == true) {
          this._userService.userHoldings(AppConstants.userId);
          this.appState.showLoader = false;
          let alertMessage: AlertMessage = new AlertMessage();
          alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(res)).message));
          if (alertMessage.message.length > 0) {

            let notification: Notification = new Notification();
            notification.content = alertMessage.message;
            alertMessage.type = 'success';
            // this.shareOrderService.setOrderConfirmationMessages(notification);
          }

          this.alertMessage = alertMessage;
          this.showOrderConfirmationMsg();
        }
        if (res.response == false) {
          this.appState.showLoader = false;
          let alertMessage: AlertMessage = new AlertMessage();
          alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(res)).message));
          if (alertMessage.message.length > 0) {

            let notification: Notification = new Notification();
            notification.content = alertMessage.message;
            alertMessage.type = 'danger';
            // this.shareOrderService.setOrderConfirmationMessages(notification);
          }
          this.alertMessage = alertMessage;
          this.showOrderConfirmationMsg();
        }
      })
    
    }
    // ================================ Vtrade Order ============================= //

  }



  // -----------------------------------------------------------------

  updateExchangeMarketIds() {


    if (AppUtility.isValidVariable(this.symbolExchMktList) && !AppUtility.isEmpty(this.symbolExchMktList)) {
      for (let i = 0; i < this.symbolExchMktList.length; i++) {
        if (this.symbolExchMktList[i].exchangeCode === this.order.exchange &&
          this.symbolExchMktList[i].marketCode === this.order.market &&
          this.symbolExchMktList[i].securityCode === this.order.symbol) {
          this.exchangeId = this.symbolExchMktList[i].exchangeId;
          this.marketId = this.symbolExchMktList[i].marketId;
          this.securityId = this.symbolExchMktList[i].securityId;
          this.securityType = this.symbolExchMktList[i].securityType;
        }
      }

      this.getOrderTypes(this.exchangeId, this.marketId);
      this.getTifOptions(this.exchangeId, this.marketId);
      this.getOrderQualifiers(this.exchangeId, this.marketId);
      this.getExchangeCustodians(this.exchangeId);
      this.getClientsList(this.exchangeId);
    }
  }

  // -----------------------------------------------------------------

  public getBestMarketDEtails = () => {

    this.orderService.getBestMarketAndSymbolStats(this.order.exchange, this.order.market, this.order.symbol).subscribe((res: any) => {

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

          this.shareOrderService.setExchange(this.order.exchange);
          this.shareOrderService.setMarket(this.order.market);
          this.shareOrderService.setSymbol(this.order.symbol);
          this.socket.fetchFromChannel("best_orders", { exchange: this.order.exchange, market: this.order.market, symbol: this.order.symbol });


          this.getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
          this.updateExchangeMarketIds();
          this.getBestMarketDEtails();


          if(this.securityType.toUpperCase() === AppConstants.SECURITY_TYPE_EQUITIES_UPPERCASE && this.authService.isAuhtorized(this.authService.OM_EQUITY_ORDER_NEW)){
            //  this.isEquityValidate = true;
            //  this.isBondValidate = false;
            this.disabledSubmit = false;
          }else if(this.securityType.toUpperCase() === AppConstants.SECURITY_TYPE_BONDS_UPPERCASE && this.authService.isAuhtorized(this.authService.OM_BOND_ORDER_NEW)){
            // this.isEquityValidate = false;
            // this.isBondValidate = true;
            this.disabledSubmit = false;
         }else{
          // this.isEquityValidate = false;
          // this.isBondValidate = false;
          this.disabledSubmit = true;
         }

        }
      }
    }
    catch (error) {
    }
  }

  // -----------------------------------------------------------------

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
    this.getBondDetails();


  }





  getBondDetails() {
     
    this.securityMarketDetails = new SecurityMarketDetails();
    if (this.exchangeId > 0 && this.marketId > 0 && this.securityId > 0) {
      this.appState.showLoader = true;
      this.listingService.getSymbolMarket(this.exchangeId, this.marketId, this.securityId)
        .subscribe(data => {

          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(data)) {
            this.securityMarketDetails.updateSecurityMarketData(data);

          }
        },
          error => {

            this.appState.showLoader = false;
            this.errorMessage = <any>error;

          });
    }
  }
 






  // -----------------------------------------------------------------

  onVolumeChange(): void {
    this.order.value = Number(this.inputVolume.value) * Number(this.inputPrice.value);
    this.order.settlementValueCurrency = Number(this.order.value) * Number(this.securityMarketDetails.currencyRate);
  }

  // -----------------------------------------------------------------

  orderTypeChanged(): void {
    if (this.cmbOrderType.selectedValue === null)
      return;

    AppUtility.printConsole('Order type: ' + this.cmbOrderType.selectedValue);
    this.order.type_ = this.cmbOrderType.selectedValue;

    if (this.order.type_.toLowerCase() === 'market' || this.order.type_.toLowerCase() === 'sm') {
      this.order.price_ = 0;
      this.isPriceDisable = true;
      let price : number = Number(this.symbolStats.last_trade_price) !== Number('0.0000') ? Number(this.symbolStats.last_trade_price) : Number(this.symbolStats.last_day_close_price);
      setTimeout(() => {
        this.onPriceChangeMarketType(price);
      }, 100);
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
      let price : number = Number(this.symbolStats.last_trade_price) !== Number('0.0000') ? Number(this.symbolStats.last_trade_price) : Number(this.symbolStats.last_day_close_price);
      setTimeout(() => {
        this.onPriceChangeMarketType(price);
      }, 100);
    }

    // console.log("order type changed: "+ this.order.type_+", isLimitOrder"+this.isLimitOrder);
    // this.triggerPriceCollapse="collapse in";
  }

  // -----------------------------------------------------------------

  onPriceChange(): void {
    this.order.value = Number(this.inputVolume.value) * Number(this.inputPrice.value);
    this.order.settlementValueCurrency = Number(this.order.value) * Number(this.securityMarketDetails.currencyRate);
    
  }

  onPriceChangeMarketType(price : number): void {
    this.order.tempSettlementAmount = Number(this.inputVolume.value) * Number(price);
  }


  // -----------------------------------------------------------------

  validateOrder(): boolean {
    let errorMsg: string = '';
   // if (this.isUserClient) this.order.account = this.selectedClient.clientCode;
    // AppUtility.printConsole("symbol value: "+ this.cmbSymbol.selectedValue);
    if (this.cmbSymbol.text === '' || this.cmbSymbol.text === AppConstants.PLEASE_SELECT_STR) {
      // this.statusMsg="Symbol is required";
      this.cmbSymbol.focus();
      return false;
    }
    else if (!this.isValidSymbol(this.order.symbol)) {
      this.errorMsg = 'Invalid Security';
      this.cmbSymbol.focus();
      return false;
    }
    else if (this.order.side === null) {
      this.cmbOrderSide.focus();
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
     // this.statusMsg = "account is required";
      this.checkClientCode = true;
      this.account.focus();
      return false;
    }
    else if (this.order.account === AppConstants.PLEASE_SELECT_STR) {
      this.checkClientCode = true;
      this.account.focus();
      return false;
    }
    else if ((this.order.type_ === 'sl' || this.order.type_ === 'sm') && this.order.triggerPrice_ === 0) {
      // this.statusMsg="Trigger Price is required";
      this.inputTriggerPrice.focus();
      return false;
    }

    return true;
  }

  // -----------------------------------------------------------------

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
      orderValueCurrency : [''],
      // trader: [''],
      custodian: [''],
      tifOption: [''],
      gtd: [''],
      // gtc: [''],
      qualifier: [''],
      discQuantity: [''],
      yield: [''],
      triggerPrice: ['', Validators.compose([Validators.required])],
      statusMsg: ['']
    });
  }

  // -----------------------------------------------------------------

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

  // -----------------------------------------------------------------

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


  // -----------------------------------------------------------------

  clearSelectedSymbol() {
    this.order.symbolMktExch = '';
    this.cmbSymbol.selectedValue = '';
    this.cmbSymbol.text = AppConstants.PLEASE_SELECT_STR;
  }



  getClientsList(exchangeId) {

    this.appState.showLoader = true;
    this.order.account = AppConstants.PLEASE_SELECT_STR;
    this.fromClientList = [];

    if (AppConstants.participantId !== null) {
      this.listingService.getClientListByExchangeBroker(exchangeId, AppConstants.participantId, true, true)
        .subscribe(restData => {
          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
            if (AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE) {
              this.fromClientList = restData;
              if(this.fromClientList.length > 1){
                let x = { "displayValue_": AppConstants.PLEASE_SELECT_STR, "clientCode": AppConstants.PLEASE_SELECT_STR };
                this.fromClientList.unshift(x);
                this.order.account = this.fromClientList[0].clientCode;
              }
            }
            if (AppConstants.tradeType === AppConstants.VIRTUAL_TRADE_TYPE) {

              let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
              this.fromClientList.unshift(x);
              this.order.account = this.fromClientList[0].clientCode;
            }

          } else {
            this.fromClientList = [];
          }
          this.cdr.detectChanges();
        },
          error => { this.appState.showLoader = false; this.errorMessage = <any>error });
    }
    else {
      let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
      this.fromClientList.unshift(x);
      this.order.account = this.fromClientList[0].clientCode;
      this.cdr.detectChanges();
    }

  }

}

