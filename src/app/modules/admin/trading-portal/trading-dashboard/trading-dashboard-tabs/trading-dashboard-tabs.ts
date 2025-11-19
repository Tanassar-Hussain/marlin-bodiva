import { Component, ViewEncapsulation, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AppState } from 'app/app.service';

import { AuthService } from 'app/services-oms/auth-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';

import { AuthService2 } from 'app/services/auth2.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';

import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { DashboardService } from 'app/modules/admin/dashboard/dashboard.service';
import { ListingService } from 'app/services/listing.service';
import { SecurityMarketDetails } from 'app/models/security-market-details';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';

@Component({
    selector: 'trading-dashboard-tabs',
    templateUrl: './trading-dashboard-tabs.html',
    encapsulation: ViewEncapsulation.None,
})
export class TradingDashboardTabsComponent implements OnInit, OnChanges {
    lang: string;
    type: any = "trades"
    symbolDetailsWithID: any;
    isBond: boolean = false;
    @Input() inheritedSecurityCode = '';
    @Output() bondType = new EventEmitter<any>();


    sharedOrderData: any;
    symbol: Symbol;

    exchangeId: number = 0;
    marketId: number = 0;
    securityID: number = 0;
    exchangeCode: string = '';
    marketCode: string = '';
    securityCode: string = '';
    symbols: any[];
    errorMsg: any;
    markets: any[];
    exchanges: any[];
    errorMessage: string = '';
    securityMarketDetails: SecurityMarketDetails;
    updateSecurityDetails: any[];


    constructor(private appState: AppState, public authService: AuthService2, private dataService: DataServiceOMS,
        private listingService: ListingService, private orderService: OrderService,
        private _fb: FormBuilder, private translate: TranslateService,
        public auth2Service: AuthService2, private router: Router, public cdr: ChangeDetectorRef
        , private dashboardService: DashboardService, public splash: FuseLoaderScreenService,) {

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

    }
    ngOnChanges(): void {
        this.getSymbolDetail();
    }

    ngOnInit(): void {

    }

    getSymbolDetail() {
        if (AppUtility.isValidVariable(this.inheritedSecurityCode)) {
            this.listingService.getSecurityId(this.inheritedSecurityCode).subscribe(res => {
                this.symbolDetailsWithID = res
                if (this.symbolDetailsWithID.assetClass.assetId == AppConstants.ASSET_CLASS_BONDS_ID) {
                    this.isBond = true
                }

                this.listingService.getSecurityDetailsByCode(this.inheritedSecurityCode).subscribe(res => {
                    this.sharedOrderData = res[0]
                    this.loadExchanges();
                }, (error => {

                }))
            })
        }
    }
    // ...................................................................For OverView Component ...........................
    loadExchanges() {

        this.splash.show();
        this.listingService.getExchangeList()
            .subscribe(restData => {
                this.splash.hide();
                if (AppUtility.isValidVariable(restData)) {

                    this.exchanges = restData;
                    this.exchanges.map(res => {
                        if (res.exchangeCode == this.sharedOrderData.exchangeCode) {
                            this.exchangeId = res.exchangeId
                            this.loadMarkets(this.exchangeId)
                        }
                    })
                }
            },
                error => {
                    this.splash.hide();
                    this.errorMessage = <any>error;
                });
    }

    loadMarkets(exchangeId: number) {

        this.markets = [];
        this.marketId = 0;
        if (this.exchangeId > 0) {
            this.splash.show();
            this.listingService.getMarketListByExchange(exchangeId).subscribe(restData => {
                this.splash.hide();
                if (AppUtility.isValidVariable(restData)) {
                    this.markets = restData
                    this.markets.map(res => {
                        if (res.marketCode == this.sharedOrderData.marketCode) {
                            this.marketId = res.marketId
                            this.loadData();
                        }
                    })
                }
            },
                error => { this.splash.hide(); this.errorMessage = <any>error });
        }
    }

    loadData() {

        this.exchangeCode = this.sharedOrderData.exchangeCode;
        this.marketCode = this.sharedOrderData.marketCode
        this.securityCode = this.sharedOrderData.securityCode.toUpperCase();
        this.securityID = this.symbolDetailsWithID.securityId
        this.authService.socket.emit('symbol_sub', { 'exchange': this.exchangeCode, 'market': this.marketCode, 'symbol': this.securityCode });

        // Get bond details
        this.securityMarketDetails = new SecurityMarketDetails();
        this.splash.show();
        if (this.exchangeId > 0 && this.marketId > 0 && this.securityCode.trim().length > 0) {
            this.listingService.getSymbolMarket(this.exchangeId, this.marketId, this.securityID).subscribe(data => {
                this.splash.hide();
                if (AppUtility.isValidVariable(data)) {
                    this.updateSecurityDetails = data
                    this.bondType.emit(data)
                }
            }, error => {
                this.splash.hide();
                this.errorMessage = <any>error;
            });
        }

    }




}
