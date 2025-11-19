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

import { UsersOmsReports } from 'app/models/users-oms-reports';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { DialogCmpReports } from '../../reports/dialog-cmp-reports';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

@Component({
    selector: 'cancel-quote',
    templateUrl: './cancel-quote.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class CancelQuote implements OnInit, AfterViewInit, OnDestroy {
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
    traders: any[] = [];
    eventLogsOrdersList: any[] = [];
    filteredOrderList: any[] = [];
    exchanges = [];
    markets = [];
    symbols = [];
    exchange: string;
    market: string;
    symbolExchMktList: any[];
    symbolTypeList: any[];
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
    isPriceDisable: boolean = true;
    isVolumeDisable: boolean = true;
    triggerPriceCollapse: string = 'collapse';

    isFirstSubmission: boolean = false;

    //---------------------------------------------
    isConfirmationSuccess: boolean = false;
    isConfirmationRejected: boolean = false;
    lang: any


    @ViewChild('order-new-all', { static: false }) NewOrderAll: NewOrderAll;

    @ViewChild('orderSubmittedDlg', { static: false }) orderSubmittedDlg: wjcInput.Popup;
    @ViewChild('cmbSymbol', { static: false }) cmbSymbol: wjcInput.ComboBox;
    @ViewChild('cmbSymboTypel', { static: false }) cmbSymboTypel: wjcInput.ComboBox;
    @ViewChild('inputBuyVolume', { static: false }) inputBuyVolume: wjcInput.InputNumber;
    @ViewChild('inputBuyPrice', { static: false }) inputBuyPrice: wjcInput.InputNumber;
    @ViewChild('inputSellVolume', { static: false }) inputSellVolume: wjcInput.InputNumber;
    @ViewChild('inputSellPrice', { static: false }) inputSellPrice: wjcInput.InputNumber;
    @ViewChild('account', { static: false }) account: wjcInput.InputMask;
    @ViewChild('orderNo', { static: false }) orderNo: wjcInput.InputMask;

    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;

    quantityLabelVolume: number = 500;
    participantId: number;
    isCustodian: boolean;


    // -----------------------------------------------------------------

    constructor(private appState: AppState, public authService: AuthService2, public authServiceOMS: AuthService, private dataService: DataServiceOMS, private loader: FuseLoaderScreenService,
        private listingService: ListingService, private orderService: OrderService,
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
        console.log(this.symbolStats);
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
                        error => { 
                            //this.appState.showLoader = false; this.errorMessage = <any>error 
                            });
            }

        }

        // Getting order sides
        this.orderSides = this.listingService.getOrderSides();


        // if (this.userType === 'PARTICIPANT' || this.userType === 'PARTICIPANT ADMIN' )
        // {
        //     this.loadTraders();
        // }

        this.getAssetClassList()
        this.loadTraders()
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
        jQuery('#cancel-quote').modal({ backdrop: 'static', keyboard: true });
        jQuery('#cancel-quote').modal('show');
    }


    // -----------------------------------------------------------------

    onClose() {

        jQuery('#cancel-quote').modal('hide');
        jQuery('#cancel-quote').modal('hide');
        this.init();
        this.myForm.controls['symbolType'].markAsUntouched();
        // this.loadSelectedSymbolFromMarketWatch();
        // AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
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
                if (data[i].marketTypeCode === AppConstants.MARKET_TYPE_QUOTE_) {
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

        let alertMessage: AlertMessage = this.order.formatOrderConfirmationMsg(data, 'Equity');
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
        // this.cmbSymboTypel.focus();
    }

    // -----------------------------------------------------------------

    onAlertCancel(): void {
        // this.cmbSymboTypel.focus();
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

        if (this.validateOrder()) {
            this.submitted = true;

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
            this.quote.buy_order.expiryDate = String(this.order.gtd);


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
            this.quote.sell_order.expiryDate = String(this.order.gtd);


            this.statusMsg = "Cancel Quote for " + this.order.symbol + ", " + AppUtility.ucFirstLetter(this.quote.sell_order.side) + ' ' + this.quote.sell_order.volume + "@" + this.quote.sell_order.price + ' ' + AppUtility.ucFirstLetter(this.quote.buy_order.side) + ' ' + this.quote.buy_order.volume + "@" + this.quote.buy_order.price


            this.showDialog(this.orderSubmittedDlg);
        }
        else {
            this.isFirstSubmission = false;
        }
    }

    submitOrder() {
        // this.dialogIsVisible=false;
        this.appState.showLoader = true;

        this.orderService.cancelQuoteOrder(this.quote).subscribe((data) => {

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

            if (this.order.symbolMktExch != null && this.order.symbolMktExch.length > 0) {
                strArr = AppUtility.isSplitSymbolMarketExchange(this.order.symbolMktExch);
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
            statusMsg: [''],
            symbolType: ['', Validators.compose([Validators.required])],
            orderNo: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNonZeroNumeric)])],
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
                        // this.order.account = this.filteredOrderList[0].account;

                        const accountCode = (code) => code.clientCode == this.filteredOrderList[0].account;
                        let index = this.fromClientList.findIndex(accountCode);
                        this.fromClientList[0] = this.fromClientList[index]
                         

                    } else {
                        this.fromClientList = [];
                    }
                },
                    error => { this.loader.hide(); this.errorMessage = <any>error });
        }
        else {
            let x = { "displayValue_": AppConstants.loginName, "clientCode": AppConstants.loginName };
            this.fromClientList.unshift(x);
            this.order.account = this.fromClientList[0].clientCode;
        }

    }

    getAssetClassList() {
        this.loader.show();
        let asset = {
            assetId: AppConstants.PLEASE_SELECT_VAL,
            assetName: AppConstants.PLEASE_SELECT_STR
        }

        this.listingService.getAssetClass().subscribe((res) => {
            this.loader.hide();
            if (AppUtility.isValidVariable(res)) {
                this.symbolTypeList = res
                this.symbolTypeList.unshift(asset)
            }
            else {
                this.symbolTypeList.unshift(asset)
            }


        }, error => {
            this.loader.hide();
            this.symbolTypeList.unshift(asset)
        })
    }

    onSymbolTypeChange() {
        this.order.order_no = '';
        this.myForm.controls['orderNo'].markAsUntouched();
        this.order.symbolMktExch = '';
        this.order.symbol = '';
        this.order.exchange = '';
        this.order.market = '';
        this.order.account = '';
        this.order.gtd = new Date();

        this.quote.buy_order.volume = 0;
        this.quote.sell_order.volume = 0;
        this.quote.buy_order.price_ = 0;
        this.quote.sell_order.price_ = 0;

        this.symbolStats = new SymbolStats();

        if (AppUtility.isValidVariable(this.order.symbolType)) {
            this.getEventLog('', true);
        }

    }

    getEventLog(model: any, isValid: boolean): void {
         
        let usersOmsReports: UsersOmsReports = null;
        if (AppConstants.userType === 'PARTICIPANT' || AppConstants.userType === 'PARTICIPANT ADMIN') {

            usersOmsReports = new UsersOmsReports();
            for (let i = 0; i < this.traders.length; i++) {
                usersOmsReports.users[i] = this.traders[i].email;
            }

            if (this.order.symbolType === AppConstants.ASSET_CLASS_ID_EQUITIES) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES
            }
            else if (this.order.symbolType === AppConstants.ASSET_CLASS_BONDS_ID) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_BONDS;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_BONDS;
            }
            else if (this.order.symbolType === AppConstants.ASSET_CLASS_ID_ETFS) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_ETF;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_ETF;
            }
        }
        else {
            AppConstants.claims2
            usersOmsReports = new UsersOmsReports();
            usersOmsReports.users[0] = AppConstants.username

            if (this.order.symbolType === AppConstants.ASSET_CLASS_ID_EQUITIES) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES
            }
            else if (this.order.symbolType === AppConstants.ASSET_CLASS_BONDS_ID) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_BONDS;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_BONDS;
            }
            else if (this.order.symbolType === AppConstants.ASSET_CLASS_ID_ETFS) {
                usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_ETF;
                usersOmsReports.marketType = AppConstants.MARKET_TYPE_ETF;
            }
        }
        this.loader.show();
        this.orderService.getEventLog(usersOmsReports).subscribe(data => {
            this.loader.hide();
            this.eventLogsOrdersList = data.orders

        },
            error => {

                this.loader.hide();
                this.errorMsg = <any>error.statusText;
                if (this.dialogCmp.statusMsg != undefined) { this.dialogCmp.statusMsg = this.errorMsg; }
                this.dialogCmp.showAlartDialog('Error');
            });
    }

    loadTraders(): void {
        this.loader.show();
        if ( AppUtility.isValidVariable(AppConstants.participantId))
        this.listingService.getUserList(AppConstants.participantId).subscribe(
            users => {
                this.loader.hide();
                if (AppUtility.isEmptyArray(users)) {
                    this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
                    return;
                }
                this.updateTraders(users);
            },
            error => {

                this.loader.hide();
                this.errorMsg = <any>error;
                this.dialogCmp.statusMsg = this.errorMsg;
                this.dialogCmp.showAlartDialog('Error');
            });
    }

    updateTraders(data) {
        if (!AppUtility.isValidVariable(data)) {
            return;
        }

        this.traders = [];
        if (AppConstants.userType === 'PARTICIPANT ADMIN') {
            this.traders = data
        }
        else {
            let u: any = new Object();
            u.userName = AppConstants.loginName;
            u.email = AppConstants.username;
            this.traders.push(u);
            this.traders[0].selected = true;
            this.traders[0].$checked = true;
            for (let i = 1; i <= data.length; i++) {
                this.traders[i] = data[i - 1];
            }
        }
    }

    getOrderDetails(orderNo: any) {
        this.filteredOrderList = []
        if (AppUtility.isValidVariable(orderNo.value)) {
            let include = this.eventLogsOrdersList.some(order => order.order_no == orderNo.value);
            if (include) {
                let arr = []
                const orderNumber = (order) => order.order_no == orderNo.value;
                let index = this.eventLogsOrdersList.findIndex(orderNumber);
                arr.push(this.eventLogsOrdersList[index])
                arr[0].quote_id

                this.eventLogsOrdersList.map((res) => {
                    if (res.quote_id === arr[0].quote_id) {
                        this.filteredOrderList.push(res)
                    }
                })

                this.filteredOrderList.map((res) => {
                    if (res.order_state !== 'partial_filled' && res.order_state !== 'filled') {

                        if (res.side == "sell") {
                            this.quote.sell_order.volume = Number(res.volume);
                            this.quote.sell_order.price_ = Number(res.price);
                            this.quote.sell_order.ref_no = res.ref_no
                            this.quote.sell_order.order_no = res.order_no.toString()
                        }
                        else if (res.side == "buy") {
                            this.quote.buy_order.volume = Number(res.volume);
                            this.quote.buy_order.price_ = Number(res.price);
                            this.quote.buy_order.ref_no = res.ref_no
                            this.quote.buy_order.order_no = res.order_no.toString()
                        }

                        let displayName = res.symbol + "(" + res.market + "/" + res.exchange + ")"
                        this.order.symbolMktExch = displayName
                    }

                })
                if (AppUtility.isValidVariable(this.filteredOrderList)) {
                    this.order.exchange = this.filteredOrderList[0].exchange
                    this.order.market = this.filteredOrderList[0].market
                    this.order.symbol = this.filteredOrderList[0].symbol
                }


            }
            else {
                let str = {
                    type: "danger",
                    message: "Invalid Order Number"
                };
                this.alertMessage = str;
                this.showOrderConfirmationMsg();
                this.resetForm();
            }
        }


    }

}

