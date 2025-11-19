import { Component, ViewEncapsulation, ViewChild, Injector, Input, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';
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
    selector: 'symbol-overview',
    templateUrl: './symbol-overview.html',
    encapsulation: ViewEncapsulation.None,
})

export class SymbolOverviewComponent implements OnChanges {

    symbol: Symbol;

    exchangeId: number = 0;
    marketId: number = 0;
    securityID: number = 0;
    exchangeCode: string = '';
    marketCode: string = '';
    securityCode: string = '';

    errorMessage: string = '';
    securityMarketDetails: SecurityMarketDetails;

    lang: any
    @Input() inheritedSymbolDetails: any
    @Input() inheritedSymbolDetailWithID: any
    @Input() updatedSecurityDetails: any


    symbols: any[];
    errorMsg: any;
    markets: any[];
    exchanges: any[];

    @ViewChild('accrudeProfit', { static: false }) accrudeProfit: wjcInput.InputMask;

    constructor(private appState: AppState, public authService: AuthService, private dataService: DataServiceOMS, private orderService: OrderService,
        private listingService: ListingService, private _fb: FormBuilder, private translate: TranslateService, public splash: FuseLoaderScreenService,
        private _changeDetectorRef: ChangeDetectorRef) {

        this.securityMarketDetails = new SecurityMarketDetails();
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
    }
    ngOnChanges() {
        this.updateSecurityDetails(this.updatedSecurityDetails);
    }

    ngOnInit() {
        if (AppUtility.isValidVariable(this.inheritedSymbolDetails) && AppUtility.isValidVariable(this.inheritedSymbolDetailWithID)) {
            // this.loadExchanges()

        }
    }




    updateSecurityDetails(data) {
        this.securityMarketDetails.updateSecurityMarketData(data);
        // this.accrudeProfit.value = this.securityMarketDetails.roundToDecimalPlaces(4, this.securityMarketDetails.accrudeProfit).toString();
        AppUtility.printConsole(this.securityMarketDetails);
        this._changeDetectorRef.detectChanges();
    }

}
