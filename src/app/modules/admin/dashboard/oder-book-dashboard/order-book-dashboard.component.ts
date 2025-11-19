import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from 'app/core/user/user.service';
import { Observable, Subject } from 'rxjs';
import { WebSocketService } from '../../../../services/socket/web-socket.service';
import { MBOData, MBPData } from './order-book-dashboard';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { DashboardService } from '../dashboard.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AppConstants, AppUtility } from 'app/app.utility';

import * as wjcInput from '@grapecity/wijmo.input';
import { Order } from 'app/models/order';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { fuseAnimations } from '@fuse/animations';
import { TranslateService } from '@ngx-translate/core';

export interface Commodities {
    name: string;
    background: string;
}

@Component({
    selector: 'order-book-dashboard',
    templateUrl: './order-book-dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})
export class OrderBookDashBoardComponent implements OnChanges, OnInit, AfterViewInit {

    myControl1 = new FormControl('');
    myControl = new FormControl('');
    options: any[] = [];
    optionsALL: any[] = [];
    filteredOptions!: Observable<string[]>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    mboDataSource: MatTableDataSource<any> = new MatTableDataSource();
    mbpDataSource: MatTableDataSource<any> = new MatTableDataSource();
    mtDataSource: MatTableDataSource<any> = new MatTableDataSource();

    mboDataColumns: string[] = [
        'buy_volume',
        'buy_price',
        'sell_price',
        'sell_volume',
    ];
    mbpDataColumns: string[] = [
        'buy_volume',
        'buy_price',
        'sell_price',
        'sell_volume',
    ];

    mtDataColumns: string[] = [
        'time',
        'price',
        'qualtity'
    ];

    selectedAssetClass: string = AppConstants.ASSET_CLASS_EQUITIES;
    selectedEquityClass: string = 'best_order';
    searchSymbolValue: string = '';
    symbolExangeMarketWiseList: any[];
    symbolExangeMarketList: any[];
    mboDataArr: MBOData[] = new Array();
    mbpDataArr: MBPData[] = new Array();
    errorMsg: string = '';

    mbpDataFilter: any[];
    mboDataFilter: any[];
    highestChangedDataEq: any;
    highestChangedSymbol: string = '';
    order: Order;
    hasData: Boolean = false;
    topSymbol: string = ''

    @ViewChild('singleSelect', { static: false }) singleSelect: wjcInput.ComboBox;
    lang: string;
    assetClassStorage: any;
    @Input() inheritedSecurityDetail: any;
    @Input() isGraphComp: boolean = false;
    @Input() marketCode: any;
    @Input() marketStatus: any;
    @Input() symbolCode: string
    activeColor: String;
    date: any = new Date()
    counter = 0;
    dateTimeFormat: string = AppConstants.TIME_FORMAT;
    utcLocaleHours: string = AppConstants.UTC_LOCALE_HOURS;

    constructor(
        private socket: WebSocketService,
        private userService: UserService,
        private fb: FormBuilder,
        private sanitizer: DomSanitizer,
        private dashboardService: DashboardService,
        private listingSvc: ListingService,
        public splash: FuseLoaderScreenService,
        private dataService: DataServiceOMS,
        private translate: TranslateService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
        this.getSymbolData();
    }

    ngOnChanges() {
        if (this.marketStatus == "Open") {
            this.activeColor = AppConstants.buyColor
        }
        else this.activeColor = AppConstants.sellColor

        if (this.isGraphComp) {
            if (AppUtility.isValidVariable(this.symbolCode)) {
                this.date = AppUtility.formatDate_YYYY_MM_DD(this.date)
                if (this.counter === 0)
                    this.symbolMarketTrades(this.symbolCode, this.date)
            }
        }
    }



    ngOnInit(): void {

        this.order = new Order();
        this.onFetchMBOData();

        this.dashboardService.selectedAssetClass$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((ParentAssetClass) => {

                if (ParentAssetClass === null) {
                    this.populateSymbolExangeMarketList();
                }
                else {
                    this.selectedAssetClass = ParentAssetClass
                    this.populateSymbolExangeMarketList();
                }

            });

        this.mboDataSource.data = this.mboDataArr;

        this.userService.highestChangeData$.subscribe((res: any) => {
            this.highestChangedDataEq = res;
            this.highestChangedSymbol =
                res?.securityStatsDTO.securityCode +
                ' ' +
                '(' +
                res?.securityStatsDTO.marketCode +
                ')' +
                '-' +
                res?.securityStatsDTO.exchangeCode;
        });

    }

    ngAfterViewInit(): void {
        this.onFetchMBOData();
        this.onFetchMBPData();
    }



    searchSymbol(event) {
        const value = event.toUpperCase();
        if (value == '') {
            this.options = this.optionsALL
            return
        }
        let filteredSecurities = []

        this.optionsALL.filter((security) => {

            let symbol = security.toUpperCase()
            if (symbol.includes(value)) {
                filteredSecurities.push(symbol)
            }
        });
        this.options = filteredSecurities

    }



    onSymbolSelect(event) {
        try {
            this.mboDataSource.data = []
            let strArr: any[];
            if (event != null && event.length > 0) {


                this.dashboardService.setTopSecurity(event);

                strArr = AppUtility.isSplitSymbolMarketExchange(event);
                this.order.symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
                this.order.market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
                this.order.exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];


                if (this.selectedEquityClass === "best_order") {
                    this.onFetchMBOData();
                    this.socket.fetchFromChannel("best_orders", { exchange: this.order.exchange, market: this.order.market, symbol: this.order.symbol });
                }
                else if (this.selectedEquityClass === "best_price") {
                    this.onFetchMBPData();
                    this.socket.fetchFromChannel("best_prices", { exchange: this.order.exchange, market: this.order.market, symbol: this.order.symbol });
                }
            }
        }
        catch (error) {
        }
    }

    onFetchMBOData(): void {

        this.socket.onFetchDataFromChannel('best_orders').subscribe((data: any) => {
            if (AppUtility.isValidVariable(data) && this.order.exchange === data.exchange && this.order.market === data.market && this.order.symbol === data.symbol) {
                let mboArrIndex = 0;
                this.mboDataArr = new Array<MBOData>();
                //this.mboData = <MBOData> data;
                let mboData = null;

                if (data == null || data.buy_orders == null && data.sell_orders == null) {
                    this.mboDataArr = null;
                    this.mboDataArr = new Array<MBOData>();
                    let mboData = null;
                    this.hasData = false;
                }
                // mbo buy_orders
                if (data !== null && data.buy_orders != null && data.buy_orders !== undefined && Array.isArray(data.buy_orders)) {
                    this.hasData = true;
                    data.buy_orders?.forEach((element) => {
                        mboData = new MBOData();
                        mboData.buy_volume = element.volume;
                        mboData.buy_price = element.price;
                        this.mboDataArr.push(mboData);
                    });
                }

                //   mbo sell_orders
                if (data !== null && data.sell_orders != null && data.sell_orders !== undefined && Array.isArray(data.sell_orders)) {
                    let mboArrIndex = 0;
                    this.hasData = true;
                    data.sell_orders.forEach((element) => {

                        mboData = new MBOData();
                        mboData.sell_volume = element.volume;
                        mboData.sell_price = element.price;
                        if (this.mboDataArr[mboArrIndex] == null || this.mboDataArr[mboArrIndex] == undefined) {
                            this.mboDataArr[mboArrIndex] = mboData;
                        }
                        this.mboDataArr[mboArrIndex].sell_price = mboData.sell_price;
                        this.mboDataArr[mboArrIndex].sell_volume = mboData.sell_volume;
                        ++mboArrIndex;
                        // this.mboDataArr.push(mboData);
                    });
                }

                this.mboDataFilter = Array.isArray(data) ? data : [data];
                this.mboDataSource.data = this.mboDataArr;
                this._changeDetectorRef.detectChanges();
            }

        });
    }

    onFetchMBPData(): void {
        this.socket.onFetchDataFromChannel('best_prices').subscribe((data: any) => {

            let mbpArrIndex = 0;
            this.mbpDataArr = new Array<MBPData>();

            let mbpData = null;

            if (data == null || data.buy_prices == null && data.sell_prices == null) {
                this.mbpDataArr = null;
                this.mbpDataArr = new Array<MBPData>();
                let mbpData = null;
                this.hasData = false;
            }
            // mbp buy_prices
            if (data !== null && data.buy_prices != null && data.buy_prices !== undefined && Array.isArray(data.buy_prices)) {
                this.hasData = true;
                data.buy_prices?.forEach((element) => {
                    mbpData = new MBPData();
                    mbpData.buy_volume = element.volume;
                    mbpData.buy_price = element.price;
                    mbpData.buy_count = element.count;
                    this.mbpDataArr.push(mbpData);
                });
            }

            //   mbp sell_prices
            if (data !== null && data.sell_prices != null && data.sell_prices !== undefined && Array.isArray(data.sell_prices)) {
                let mbpArrIndex = 0;
                this.hasData = true;
                data.sell_prices.forEach((element) => {

                    mbpData = new MBPData();
                    mbpData.sell_volume = element.volume;
                    mbpData.sell_price = element.price;
                    mbpData.sell_count = element.count;
                    if (this.mbpDataArr[mbpArrIndex] == null || this.mbpDataArr[mbpArrIndex] == undefined) {
                        this.mbpDataArr[mbpArrIndex] = mbpData;
                    }
                    this.mbpDataArr[mbpArrIndex].sell_price = mbpData.sell_price;
                    this.mbpDataArr[mbpArrIndex].sell_volume = mbpData.sell_volume;
                    this.mbpDataArr[mbpArrIndex].sell_count = mbpData.sell_count;
                    ++mbpArrIndex;

                });
            }

            this.mbpDataFilter = Array.isArray(data) ? data : [data];
            this.mbpDataSource.data = this.mbpDataArr;
            this._changeDetectorRef.detectChanges();
        });
    }

    private populateSymbolExangeMarketList() {
        this.splash.show();


        this.listingSvc.getexchangeCodeSecurityExchanges().subscribe(restData => {
            this.splash.hide();
            if (!AppUtility.isValidVariable(restData))
                return;

            let data: any = restData;
            let symbols: any[] = [];
            if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
                for (let i = 0; i < data.length; i++) {
                    symbols[i] = data[i];
                    symbols[i].id = data[i].exchangeMarketSecurityId;
                    symbols[i].value = data[i].displayName_;
                }
            }
            this.symbolExangeMarketWiseList = symbols;
            this.assetClassWiseSymbolList();

            this.setTopSymbol();
        },
            error => {
                this.splash.hide();
                this.errorMsg = <any>error;
            });
    }

    setTopSymbol() {

        this.dashboardService.selectedTopSecurity$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((topSymbol) => {

                let symbol = AppUtility.symbolMarketExchangeComb(topSymbol.securityCode, topSymbol.marketCode, topSymbol.exchangeCode)
                this.topSymbol
                if (this.options.includes(symbol)) {
                    this.topSymbol = symbol
                    this.onFetchMBOData();
                    this.socket.fetchFromChannel("best_orders", { exchange: topSymbol.exchangeCode, market: topSymbol.marketCode, symbol: topSymbol.securityCode });
                    this._changeDetectorRef.detectChanges();
                }
            });
    }

    public assetClassWiseSymbolList() {

        this.options = [];
        this.optionsALL = [];

        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            if (AppUtility.isValidVariable(this.symbolExangeMarketWiseList) && !AppUtility.isEmptyArray(this.symbolExangeMarketWiseList)) {
                for (let i = 0; i < this.symbolExangeMarketWiseList.length; i++) {
                    if (this.symbolExangeMarketWiseList[i].securityType == AppConstants.SECURITY_TYPE_EQUITIES) {

                        this.options.push(
                            AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode)
                        )
                        this.optionsALL.push(AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode))
                    }
                }
            }
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            if (AppUtility.isValidVariable(this.symbolExangeMarketWiseList) && !AppUtility.isEmptyArray(this.symbolExangeMarketWiseList)) {
                for (let i = 0; i < this.symbolExangeMarketWiseList.length; i++) {
                    if (this.symbolExangeMarketWiseList[i].securityType === AppConstants.SECURITY_TYPE_BONDS) {

                        this.options.push(
                            AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode)
                        )
                        this.optionsALL.push(AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode))
                    }
                }

            }
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            if (AppUtility.isValidVariable(this.symbolExangeMarketWiseList) && !AppUtility.isEmptyArray(this.symbolExangeMarketWiseList)) {
                for (let i = 0; i < this.symbolExangeMarketWiseList.length; i++) {
                    if (this.symbolExangeMarketWiseList[i].marketCode === AppConstants.SECURITY_TYPE_ETF) {

                        this.options.push(
                            AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode)
                        )
                        this.optionsALL.push(AppUtility.symbolMarketExchangeComb(this.symbolExangeMarketWiseList[i].securityCode, this.symbolExangeMarketWiseList[i].marketCode, this.symbolExangeMarketWiseList[i].exchangeCode))

                    }
                }

            }
        }

    }

    getValueInlineSearch = () => {

        if (this.myControl1.value === '') {
            if (this.selectedEquityClass == 'best_order') {

                this.mboDataFilter?.map((element) => {
                    element.searchString = element.symbol + ' ' + '(' + element.market + ')' + '-' + element.exchange;
                });
                this.mboDataFilter?.forEach((data) => {
                    if (this.highestChangedSymbol === data.searchString) {
                        let mboArrIndex = 0;
                        this.mboDataArr = new Array<MBOData>();
                        //this.mboData = <MBOData> data;
                        let mboData = null;
                        // mbo buy_orders
                        if (
                            data.buy_orders != null &&
                            data.buy_orders !== undefined &&
                            Array.isArray(data.buy_orders)
                        ) {
                            data.buy_orders.forEach((element) => {
                                mboData = new MBOData();
                                mboData.buy_volume = element.volume;
                                mboData.buy_price = element.price;
                                this.mboDataArr.push(mboData);
                            });
                        }
                        // mbo sell_orders
                        if (
                            data.sell_orders != null &&
                            data.sell_orders !== undefined &&
                            Array.isArray(data.sell_orders)
                        ) {
                            data.sell_orders.forEach((element) => {
                                mboData = new MBOData();
                                mboData.sell_volume = element.volume;
                                mboData.sell_price = element.price;
                                this.mboDataArr[mboArrIndex].sell_volume = mboData.sell_volume;
                                this.mboDataArr[mboArrIndex].sell_price = mboData.sell_price;
                                ++mboArrIndex;
                            });
                        }

                        this.mboDataSource.data = this.mboDataArr;
                    }
                });
            }

            if (this.selectedEquityClass == 'best_price') {

                this.mbpDataFilter?.map((element) => {
                    element.searchString =
                        element.symbol +
                        ' ' +
                        '(' +
                        element.market +
                        ')' +
                        '-' +
                        element.exchange;
                });

                this.mbpDataFilter.forEach((data) => {
                    if (this.highestChangedSymbol === data.searchString) {
                        let mbpArrIndex = 0;
                        this.mbpDataArr = new Array<MBPData>();
                        //this.mbpData = <MBPData> data;
                        let mbpData = null;

                        //mbp buy_price
                        if (
                            data.buy_price != null &&
                            data.buy_price !== undefined &&
                            Array.isArray(data.buy_price)
                        ) {
                            data.buy_price.forEach((element) => {
                                mbpData = new MBPData();
                                mbpData.buy_volume = element.volume;
                                mbpData.buy_price = element.price;
                                mbpData.buy_count = element.count;
                                this.mbpDataArr.push(mbpData);
                            });
                        }
                        //mbp sell_price
                        if (
                            data.sell_price != null &&
                            data.sell_price !== undefined &&
                            Array.isArray(data.sell_price)
                        ) {
                            data.sell_price.forEach((element) => {
                                mbpData = new MBPData();
                                mbpData.sell_price = data.price;
                                mbpData.sell_volume = data.volume;
                                mbpData.sell_count = data.count;
                                this.mbpDataArr[mbpArrIndex].sell_price = mbpData.sell_price;
                                this.mbpDataArr[mbpArrIndex].sell_volume = mbpData.sell_volume;
                                this.mbpDataArr[mbpArrIndex].sell_count = mbpData.sell_count;
                                ++mbpArrIndex;
                            });
                        }

                        this.mbpDataSource.data = this.mbpDataArr;
                    }
                });
            }
        }

        //When Search Symbol From Input
        if (this.myControl1.value !== '' && this.myControl1.value !== null && this.myControl1.value !== undefined) {

            this.searchSymbolValue = this.myControl1.value;
            if (this.selectedEquityClass == 'best_order') {
                this.mboDataFilter.map((element) => {
                    element.searchString =
                        element.symbol +
                        ' ' +
                        '(' +
                        element.market +
                        ')' +
                        '-' +
                        element.exchange;
                });
                this.mboDataFilter.forEach((data) => {
                    if (this.searchSymbolValue === data.searchString) {
                        let mboArrIndex = 0;
                        this.mboDataArr = new Array<MBOData>();
                        //this.mboData = <MBOData> data;
                        let mboData = null;
                        // mbo buy_orders
                        if (
                            data.buy_orders != null &&
                            data.buy_orders !== undefined &&
                            Array.isArray(data.buy_orders)
                        ) {
                            data.buy_orders.forEach((element) => {
                                mboData = new MBOData();
                                mboData.buy_volume = element.volume;
                                mboData.buy_price = element.price;
                                this.mboDataArr.push(mboData);
                            });
                        }
                        // mbo sell_orders
                        if (
                            data.sell_orders != null &&
                            data.sell_orders !== undefined &&
                            Array.isArray(data.sell_orders)
                        ) {
                            data.sell_orders.forEach((element) => {
                                mboData = new MBOData();
                                mboData.sell_volume = element.volume;
                                mboData.sell_price = element.price;
                                this.mboDataArr[mboArrIndex].sell_volume = mboData.sell_volume;
                                this.mboDataArr[mboArrIndex].sell_price = mboData.sell_price;
                                ++mboArrIndex;
                            });
                        }

                        this.mboDataSource.data = this.mboDataArr;
                    }
                });
            }

            if (this.selectedEquityClass == 'best_price') {
                this.mbpDataFilter.map((element) => {
                    element.searchString =
                        element.symbol +
                        ' ' +
                        '(' +
                        element.market +
                        ')' +
                        '-' +
                        element.exchange;
                });
                this.mbpDataFilter.forEach((data) => {
                    if (this.searchSymbolValue === data.searchString) {
                        let mbpArrIndex = 0;
                        this.mbpDataArr = new Array<MBPData>();
                        //this.mbpData = <MBPData> data;
                        let mbpData = null;

                        //mbp buy_price
                        if (
                            data.buy_price != null &&
                            data.buy_price !== undefined &&
                            Array.isArray(data.buy_price)
                        ) {
                            data.buy_price.forEach((element) => {
                                mbpData = new MBPData();
                                mbpData.buy_volume = element.volume;
                                mbpData.buy_price = element.price;
                                mbpData.buy_count = element.count;
                                this.mbpDataArr.push(mbpData);
                            });
                        }
                        //mbp sell_price
                        if (
                            data.sell_price != null &&
                            data.sell_price !== undefined &&
                            Array.isArray(data.sell_price)
                        ) {
                            data.sell_price.forEach((element) => {
                                mbpData = new MBPData();
                                mbpData.sell_price = data.price;
                                mbpData.sell_volume = data.volume;
                                mbpData.sell_count = data.count;
                                this.mbpDataArr[mbpArrIndex].sell_price = mbpData.sell_price;
                                this.mbpDataArr[mbpArrIndex].sell_volume = mbpData.sell_volume;
                                this.mbpDataArr[mbpArrIndex].sell_count = mbpData.sell_count;
                                ++mbpArrIndex;
                            });
                        }

                        this.mbpDataSource.data = this.mbpDataArr;
                    }
                });
            }
        }
    }

    getSymbolData() {

        let a = sessionStorage.getItem('symbolData');
        if (a !== null && a !== "null" && a !== undefined && a !== "undefined") {
            var data = JSON.parse(a);
        }

        if (AppUtility.isValidVariable(data)) {
            let symbol = AppUtility.symbolMarketExchangeComb(data.securityCode, data.marketCode, data.exchangeCode)
            this.topSymbol = symbol;
            if(AppUtility.isValidVariable(data.assetClass)){
                this.assetClassStorage = data.assetClass.assetName;
            }
         
            if (this.assetClassStorage === "Equities") {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
            }
            else if (this.assetClassStorage === "Bond") {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            }
            else if (this.assetClassStorage === "ETF") {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_ETF;
            }
        }
    }

    onChangeMB(type: string) {
        this.selectedEquityClass = type
        if (this.selectedEquityClass === "best_order") {
            this.onFetchMBOData();
            this.socket.fetchFromChannel("best_orders", { exchange: this.order.exchange, market: this.order.market, symbol: this.order.symbol });
        }
        else if (this.selectedEquityClass === "best_price") {
            this.onFetchMBPData();
            this.socket.fetchFromChannel("best_prices", { exchange: this.order.exchange, market: this.order.market, symbol: this.order.symbol });
        }
    }

    symbolMarketTrades(securityCode, date) {
        this.counter++;
        this.splash.show();
        this.listingSvc.securityMarketTrades(securityCode, date).subscribe(res => {
            
            res.forEach((element:any) => {
                element.entryDateTime = element.entryDateTime + "Z";
            })
            this.mtDataSource.data = res;
            this.splash.hide();
        }, error => {
            this.splash.hide();
            this.errorMsg = <any>error;
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.counter = 0;
    }
}
