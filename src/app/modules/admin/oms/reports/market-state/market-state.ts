import { Component, ViewChild, ViewEncapsulation, OnInit, AfterViewInit } from '@angular/core';

import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import { WjPopup } from '@grapecity/wijmo.angular2.input';
import { TranslateService } from '@ngx-translate/core';


import { AppState } from 'app/app.service';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { StorageService } from 'app/services/storage.service';




//////////////////////////////////////////////////////////////////////

@Component({
    selector: 'market-state',
    templateUrl: './market-state.html',
    encapsulation: ViewEncapsulation.None
})
export class MarketState implements OnInit, AfterViewInit {
    filterColumns = ['market', 'state'];
    marketStates: wjcCore.ObservableArray = new wjcCore.ObservableArray();

    errorMessage: string = '';
    lang: any

    @ViewChild('marketStateDlg', { static: false }) marketStateDlg: WjPopup;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;

    // -------------------------------------------------------------------------

    constructor(private appState: AppState, private authService: AuthService, private dataService: DataServiceOMS,
        private translate: TranslateService, public splash : FuseLoaderScreenService, private storageService: StorageService) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
    }

    // -------------------------------------------------------------------------

    ngOnInit() {
     //   this.marketStates.length = 0;
        this.authService.socket.on('market_state', (state) => {

            for (let i = 0; i < this.marketStates.length; ++i)
            // for ( let marketState of this.marketStates)
            {
                if (this.marketStates[i].market === (state.exchange + '-' + state.market)) {
                    this.marketStates[i].state = state.state;
                    break;
                }
            }

            const cachedData = this.storageService.getMarketStates();
            if (cachedData && cachedData.states) {
                const updatedStates = cachedData.states.map(ms => {
                    if (ms.exchangeCode === state.exchange && ms.marketCode === state.market) {
                        return { ...ms, stateCode: state.state };
                    }
                    return ms;
                });
                this.storageService.saveMarketStates(updatedStates);
            }

            this.flexGrid.invalidate();
        });

        if (AppUtility.isValidVariable(AppConstants.participantId))
            this.dataService.getParticipantExchangeMarkets(AppConstants.participantId).subscribe(
                exchangeMarkets => {

                    if (exchangeMarkets == null)
                        return;

                    const marketStatesToCache = [];

                    for (let em of exchangeMarkets) {
                        if (em.marketState != undefined && em.marketState != null) {

                            let state = {
                                'market': em.exchange.exchangeCode + '-' + em.market.marketCode,
                                'state': em.marketState.code
                            };
                            this.marketStates.push(state);
                            marketStatesToCache.push({
                                marketId: em.market.marketId,
                                marketCode: em.market.marketCode,
                                exchangeCode: em.exchange.exchangeCode,
                                stateCode: em.marketState.code
                            });

                            // subscribe for market state change notification.
                            let data: any = {
                                'exchange': em.exchange.exchangeCode,
                                'market': em.market.marketCode
                            };
                            this.authService.socket.emit('market_sub', data);
                        }
                    }


                    this.storageService.saveMarketStates(marketStatesToCache);
                },
                error => {
                    this.errorMessage = <any>error;
                });

    }

    // -------------------------------------------------------------------------

    ngAfterViewInit() {
    }

    // -------------------------------------------------------------------------

    show() {
        this.marketStateDlg.show();
        this.refreshState();
    }

    // -------------------------------------------------------------------------

    onOK() {
        this.marketStateDlg.hide();
    }

    // -------------------------------------------------------------------------





  public refreshState = () => {

    this.marketStates.length = 0;
    if (AppUtility.isValidVariable(AppConstants.participantId))
    this.dataService.getParticipantExchangeMarkets(AppConstants.participantId).subscribe(
        exchangeMarkets => {

            if (exchangeMarkets == null)
                return;

            const marketStatesToCache = [];

            for (let em of exchangeMarkets) {
                if (em.marketState != undefined && em.marketState != null) {

                    let state = {
                        'market': em.exchange.exchangeCode + '-' + em.market.marketCode,
                        'state': em.marketState.code
                    };
                    this.marketStates.push(state);

                    // Save data for localStorage
                    marketStatesToCache.push({
                        marketId: em.market.marketId,
                        marketCode: em.market.marketCode,
                        exchangeCode: em.exchange.exchangeCode,
                        stateCode: em.marketState.code
                    });

                    // subscribe for market state change notification.
                    let data: any = {
                        'exchange': em.exchange.exchangeCode,
                        'market': em.market.marketCode
                    };
                    this.authService.socket.emit('market_sub', data);
                }
            }


            this.storageService.saveMarketStates(marketStatesToCache);
        },
        error => {
            this.errorMessage = <any>error;
        });
  }










    getStateColor(state: any): string {
        switch (state) {
            case 'Loaded':
                return '#1fa7e7';

            case 'PreOpen':
                return '#d4a92d';

            case 'Suspended':
                return '#dfdfdf';

            case 'Open':
                return '#42cd41';

            case 'Close':
                return '#999999';

            case 'PostClose':
                return '#dfdfdf';

            default:
                return '#dfdfdf';
        }
    }
}
