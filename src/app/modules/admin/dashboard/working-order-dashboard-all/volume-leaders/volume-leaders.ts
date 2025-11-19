import { Component, ViewEncapsulation, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';

import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';

import { Order } from 'app/models/order';
import { AppState } from 'app/app.service';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AppConstants, AppUtility } from 'app/app.utility';
import { DialogCmpReports } from 'app/modules/admin/oms/reports/dialog-cmp-reports';
import { Subject } from 'rxjs';
import { DashboardService } from '../../dashboard.service';
import { ListingService } from 'app/services/listing.service';
import { elementAt, takeUntil } from 'rxjs/operators';
declare var jQuery: any;

@Component({
    selector: 'volume-leaders',
    templateUrl: './volume-leaders.html',
    encapsulation: ViewEncapsulation.None,
})
export class VolumeLeadersComponent implements OnInit {

    filterColumns = ['symbol', 'ldcp', 'ltp', 'change', 'changePer', 'volume', 'value'];

    data: any = [];
    data_temp: any = [];
    userType: string;
    lang: string;
    errorMsg: string = '';
    selectedOrder: Order;
    private _pageSize = 0;
    username: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    selectedAssetClass = AppConstants.selectedAssetClass
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;
    exchangeCode: string;
    marketCode: string;
    assetId: number;

    constructor(private appState: AppState, private authService: AuthService, private orderSvc: OrderService, private listingSvc: ListingService,
        private _fb: FormBuilder, private translate: TranslateService, private splash: FuseLoaderScreenService, private dashboardService: DashboardService,private _changeDetectorRef: ChangeDetectorRef) {
        this.userType = AppConstants.userType;

        //_______________________________for ngx_translate_________________________________________
        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
    }

    ngOnInit(): void {
        this.dashboardService.selectedAssetClass$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {
                this.selectedAssetClass = data
                this.getVolumeLeaders();
            });
    }

    // -------------------------------------------------------------------------
    get pageSize(): number {
        return this._pageSize;
    }

    // -------------------------------------------------------------------------
    set pageSize(value: number) {
        if (this._pageSize !== value) {
            this._pageSize = value;
            if (this.flexGrid) {
                (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
            }
        }
    }
    // -------------------------------------------------------------------------
    getVolumeLeaders() {
        this.data = []
        this.splash.show();
        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            this.exchangeCode = AppConstants.exchangeCode;
            this.marketCode = AppConstants.MARKET_CODE_MAINBOARD;
            this.assetId = AppConstants.ASSET_CLASS_ID_EQUITIES;
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            this.exchangeCode = AppConstants.exchangeCode;
            this.marketCode = AppConstants.MARKET_CODE_DEBT;
            this.assetId = AppConstants.ASSET_CLASS_ID_BONDS;
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            this.exchangeCode = AppConstants.exchangeCode;
            this.marketCode = AppConstants.MARKET_CODE_ETF;
            this.assetId = AppConstants.ASSET_CLASS_ID_ETFS;
        }


        this.listingSvc.volumeLeaders(this.exchangeCode, this.marketCode, this.assetId, AppConstants.LIMIT_GAINERS_LOOSERS_VOLUMELEADERS , AppConstants.HISTORY_DAYS_VOLUME_LEADER).subscribe(res => {
            res.map(a => {
                // for change Percentage color
                if (a.changePerc.startsWith("+")) {
                    a.changePercSide = "positive"
                }
                else if (a.changePerc.startsWith("-")) {
                    a.changePercSide = "negative"
                }
                else {
                    a.changePercSide = "positive"
                }

                // for change color

                if (a.change.startsWith("+")) {
                    a.changeSide = "positive"
                }
                else if (a.change.startsWith("-")) {
                    a.changeSide = "negative"
                }
                else {
                    a.changeSide = "positive"
                }
            })

            this.data = res;
            this.data = this.data.sort((n1, n2) => Number(n2.totalTradedQuantity) - Number(n1.totalTradedQuantity));
            this._changeDetectorRef.detectChanges();
            this.splash.hide();
        }, error => {
            this.splash.hide();
        })
    }






}