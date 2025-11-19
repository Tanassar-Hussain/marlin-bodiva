
import { Component, ViewEncapsulation, ViewChild, Injector, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';


import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { BestMarket } from 'app/models/best-market';
import { Exchange } from 'app/models/exchange';
import { Market } from 'app/models/market';
import { Symbol } from 'app/models/symbol';
import { SecurityMarketDetails } from 'app/models/security-market-details';
import { SymbolDetail } from 'app/models/symbol-detail';
import { SymbolStats } from 'app/models/symbol-stats';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';



@Component({
    selector: 'symbol-trading-details',
    templateUrl: './symbol-trading-details.html',

    encapsulation: ViewEncapsulation.None,
})

export class SymbolTradingDetailsComponent {

    public myForm: FormGroup;
    symbol: Symbol;
    symbolDetail: SymbolDetail;
    symbolStats: SymbolStats;
    bestMarket: BestMarket;

    exchanges: any[];
    markets: any[];

    exchange: string = '';
    market: string = '';

    exchangeId: number = 0;
    marketId: number = 0;
    exchangeCode: string = '';
    marketCode: string = '';
    securityCode: string = '';

    errorMessage: string = '';
    securityMarketDetails: SecurityMarketDetails;

    isMarketDisabled: boolean = true;
    isBondMarket: boolean = true;
    lang: any
    @Input() inheritedSymbolDetails: any

    isBondPricingMechanismPercentage: boolean = false;


    symbols: any[];
    errorMsg: any;

    constructor(private appState: AppState, public authService: AuthService, private dataService: DataServiceOMS, private orderService: OrderService,
        private listingService: ListingService, private _fb: FormBuilder, private translate: TranslateService, public splash: FuseLoaderScreenService,
        private _changeDetectorRef: ChangeDetectorRef) {

        this.securityMarketDetails = new SecurityMarketDetails();

        // Best Market Data Handling
        this.authService.socket.on('best_market', (dataBM) => { this.updateBestMarketData(dataBM); });
        // Symbol Stats Data Handling
        this.authService.socket.on('symbol_stat', (dataSS) => { this.updateSymbolStatsData(dataSS); });
        // Announcement update
        this.authService.socket.on('announcement', (dataAnn) => { this.updateAnnouncement(dataAnn); });
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
    }

    ngOnInit() {
        this.loadData();
    }

    updateAnnouncement(data) {
        AppUtility.printConsole('Announcement: ' + JSON.stringify(data));
        this.symbolDetail.announcement = data;
    }

    updateBestMarketData(data) {
        AppUtility.printConsole('Best Market: ' + JSON.stringify(data));
        this.bestMarket.updateBestMarketData(data);
    }
    updateSymbolStatsData(data) {


        if (this.symbolDetail.code === data.symbol) {
            this.symbolStats.updateSymbolStats(data);
        }
    }

    loadData() {
        if (AppUtility.isValidVariable(this.inheritedSymbolDetails)) {
            this.symbolDetail = new SymbolDetail();
            this.symbolStats = new SymbolStats();
            this.bestMarket = new BestMarket();

            this.exchangeCode = this.inheritedSymbolDetails.exchangeCode;
            this.marketCode = this.inheritedSymbolDetails.marketCode
            this.securityCode = this.inheritedSymbolDetails.securityCode.toUpperCase();

            this.authService.socket.emit('symbol_sub', { 'exchange': this.exchangeCode, 'market': this.marketCode, 'symbol': this.securityCode });

            this.splash.show();
            // this.getExchangeData(this.exchangeCode);
            this.orderService.getBestMarketAndSymbolStats(this.exchangeCode, this.marketCode, this.securityCode)
                .subscribe(data => {

                    this.splash.hide();
                    if (AppUtility.isValidVariable(data)) {

                        //AppUtility.printConsole("Data Received: "+ data);
                        this.updateSymbolDetails(data);

                    }
                },
                    error => { this.splash.hide(); this.errorMessage = <any>error });

            // Get bond details
        }
    }

    updateSecurityDetails(data) {
        this.securityMarketDetails.updateSecurityMarketData(data);
    }


    updateSymbolDetails(data) {
        if (AppUtility.isValidVariable(data.symbol_summary.symbol)) {
            this.symbolDetail.setDetails(data.symbol_summary.symbol);
        }
        if (AppUtility.isValidVariable(data.best_market)) {
            this.bestMarket.updateBestMarketData(data.best_market);
        }
        if (AppUtility.isValidVariable(data.symbol_summary.stats)) {
            this.symbolStats.updateSymbolStats(data.symbol_summary.stats);
        }
        this._changeDetectorRef.detectChanges();

    }


    // public getExchangeData(exchangeCode: string) {
    //     this.splash.show();
    //     this.listingService.getExchangeByExchangeCode(exchangeCode)
    //         .subscribe(restData => {
    //             this.splash.hide();
    //             if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
    //                 if (restData["bondPricingMechanism"] == 2)
    //                     this.isBondPricingMechanismPercentage = true;
    //                 else
    //                     this.isBondPricingMechanismPercentage = false;
    //             } else {
    //                 this.isBondPricingMechanismPercentage = false;
    //             }
    //         },
    //             error => { this.splash.hide(); this.errorMessage = <any>error });
    // }

}
