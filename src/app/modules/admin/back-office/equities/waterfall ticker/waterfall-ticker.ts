'use strict';
import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';

import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { MarketWatch } from 'app/models/market-watch';
import { WaterFall } from 'app/models/waterfall-ticker';

@Component({

    selector: 'waterfall-ticker',
    templateUrl: './waterfall-ticker.html',
    encapsulation: ViewEncapsulation.None,
})

export class WaterFallTicker implements OnInit {

    waterFallTickerList: wjcCore.CollectionView;
    private _pageSize = 0;
    lang: any
    waterfallTemp: WaterFall;
    waterfallTempList: any[] = [];
    @ViewChild('waterFallTickerGrid') waterFallTickerGrid: wjcGrid.FlexGrid;

    constructor(private appState: AppState, private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2,
        private translate: TranslateService, private loader: FuseLoaderScreenService, public authService: AuthService2,) {

        this.waterFallTickerList = new wjcCore.CollectionView();

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        if (this.lang == 'pt') {
            AppConstants.PLEASE_SELECT_STR = "Selecione";
        }
        //______________________________for ng2translate__________________________________________

        this.authService.socket.on('best_market', (bestMarket) => { this.onBestMarket(bestMarket); });
        this.authService.socket.on('symbol_stat', (symbolStat) => { this.onSymbolStats(symbolStat); });
    }


    ngOnInit() {

    }



    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        if (this._pageSize != value) {
            this._pageSize = value;
            if (this.waterFallTickerGrid) {
                (<wjcCore.IPagedCollectionView>this.waterFallTickerGrid.collectionView).pageSize = value;
            }
        }
    }

    onBestMarket(data) {
        
        if (AppUtility.isValidVariable(data)) {
            this.waterfallTemp = new WaterFall();

            this.waterfallTemp.exchange = data.exchange;
            this.waterfallTemp.market = data.market;
            this.waterfallTemp.symbol = data.symbol;

            this.waterfallTemp.bidSize = data.buy.volume;
            this.waterfallTemp.bid = data.buy.price;

            this.waterfallTemp.askSize = data.sell.volume;
            this.waterfallTemp.ask = data.sell.price;

            this.waterfallTempList.push(this.waterfallTemp);
            this.waterFallTickerList = new wjcCore.CollectionView(this.waterfallTempList);
        }
    }

    onSymbolStats(data) {
        
        console.log(data)
    }

}