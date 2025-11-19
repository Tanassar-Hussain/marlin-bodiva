import { Component, ViewEncapsulation, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DialogCmpReports } from 'app/modules/admin/oms/reports/dialog-cmp-reports';

import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';

import { Order } from 'app/models/order';
import { AppState } from 'app/app.service';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { FormBuilder } from '@angular/forms';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AppConstants, AppUtility } from 'app/app.utility';
import { UsersOmsReports } from 'app/models/users-oms-reports';
import { elementAt, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DashboardService } from 'app/modules/admin/dashboard/dashboard.service';


declare var jQuery: any;
//import 'slim_scroll/jquery.slimscroll.js';
@Component({
    selector: 'symbol-trades',
    templateUrl: './symbol-trades.html',
    encapsulation: ViewEncapsulation.None,
})
export class SymbolTradesComponent implements OnInit, OnChanges {


    dateTimeFormat: string = AppConstants.DATE_TIME_FORMAT;
    utcLocaleHours: string = AppConstants.UTC_LOCALE_HOURS;
    @Input() inheritedSymbolDetails: any;
    data: any = [];
    userType: string;
    allTraders: Boolean = true;
    traders: any[] = [];
    lang: string;
    errorMsg: string = '';
    selectedOrder: Order;
    private _pageSize = 0;
    selectedAssetClass = AppConstants.selectedAssetClass
    filterColumns = ['exchange', 'market', 'symbol', 'price', 'volume', 'type', 'trigger_price', 'execution_time'];

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('client', { static: false }) client: wjcInput.ComboBox;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('cmbMarket', { static: false }) cmbMarket: wjcInput.ComboBox;
    @ViewChild('cmbExchange', { static: false }) cmbExchange: wjcInput.ComboBox;
    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;
    @ViewChild('cmbTraders', { static: false }) cmbTraders: wjcInput.MultiSelect;

    constructor(private appState: AppState, public authServiceOMS: AuthService, private orderSvc: OrderService, public authService: AuthService,
        private listingSvc: ListingService,
        private _fb: FormBuilder, private translate: TranslateService, private splash: FuseLoaderScreenService,
        private dashboardService: DashboardService, private _changeDetectorRef: ChangeDetectorRef) {

        this.userType = AppConstants.userType;
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (AppUtility.isValidVariable(this.inheritedSymbolDetails)) {
            if (this.inheritedSymbolDetails.assetClass.assetId == AppConstants.ASSET_CLASS_ID_EQUITIES) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES
            }
            else if (this.inheritedSymbolDetails.assetClass.assetId == AppConstants.ASSET_CLASS_ID_BONDS) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS
            }
            else if (this.inheritedSymbolDetails.assetClass.assetId == AppConstants.ASSET_CLASS_ID_ETFS) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_ETF
            }


            this.loadTraders();
        }
    }

    ngOnInit(): void {


        // this.selectedAssetClass = data




        this.authService.socket.on('order_confirmation', (dataorderConfirmation) => {
            this.updateorderConfirmation(dataorderConfirmation);
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
    loadTraders(): void {

        this.listingSvc.getUserList(AppConstants.participantId).subscribe(restData => {

            if (AppUtility.isEmptyArray(restData)) {
                this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
                this.dialogCmp.statusMsg = this.errorMsg;
                this.dialogCmp.showAlartDialog('Error');
            }
            else {
                this.updateTraders(restData);
                // this.getWorkingOrders('' , true);
            }
        },
            error => {
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
        if (this.userType === 'PARTICIPANT ADMIN') {
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
        this.getExecutedOrders('', true);
    }

    // -------------------------------------------------------------------------
    getExecutedOrders(model: any, isValid: boolean): void {
        let usersOmsReports: UsersOmsReports = null;

        usersOmsReports = new UsersOmsReports();
        for (let i = 0; i < this.traders.length; i++) {
            usersOmsReports.users[i] = this.traders[i].email;
        }

        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
            usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES

        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_BONDS;
            usersOmsReports.marketType = AppConstants.MARKET_TYPE_BONDS;
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_ETF;
            usersOmsReports.marketType = AppConstants.MARKET_TYPE_ETF;
        }


        // else {
        //     AppConstants.claims2
        //     usersOmsReports = new UsersOmsReports();
        //     usersOmsReports.users[0] = AppConstants.username

        //     if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
        //         usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
        //         usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES
        //     }
        //     else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
        //         usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_BONDS;
        //         usersOmsReports.marketType = AppConstants.MARKET_TYPE_BONDS;
        //     }
        // }

        this.splash.show();

        this.orderSvc.getExecutedOrders(usersOmsReports).subscribe(data => {
            if (AppUtility.isEmptyArray(data)) {
                this.splash.hide();
                this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
                this.dialogCmp.statusMsg = this.errorMsg;
                this.dialogCmp.showAlartDialog('Error');
            }
            else {
                this.updateExecutedOrders(data);
                this.splash.hide();
            }

        },
            error => {

                this.splash.hide();
                this.errorMsg = <any>error;
            });
    }

    updateExecutedOrders(executedOrders): void {

        this.data = [];
        let trades = executedOrders.trades;

        if (!AppUtility.isEmpty(trades)) {
            for (let i = 0; i < trades.length; i++) {

                if (trades[i].short) {
                    trades[i].short = 'Yes';
                }
                else {
                    trades[i].short = 'No';
                }

                //   trades[i].execution_time = wjcCore.Globalize.formatDate(new Date(trades[i].execution_time), AppConstants.DATE_TIME_FORMAT);

                trades[i].execution_time = new Date(trades[i].execution_time + 'Z');
                trades[i].side = AppUtility.ucFirstLetter(trades[i].side);

                trades[i].order_no = trades[i].order_no.toString();
                trades[i].ticket_no = trades[i].ticket_no.toString();
                trades[i].volume = (trades[i].volume > 0) ? trades[i].volume : '';
                trades[i].price = (Number(trades[i].price) > 0) ? trades[i].price : '';
                trades[i].trigger_price = (Number(trades[i].trigger_price) > 0) ? trades[i].trigger_price : '';
                if (this.selectedAssetClass !== AppConstants.ASSET_CLASS_BONDS) {
                    let p = 0;
                    p = Number(trades[i].price);
                    trades[i].settlement_amount = (p) * trades[i].volume;
                }
                this.data.push(trades[i]);
            }
            this.inheritedSymbolDetails.symbol
            // this.data.sort(function(a, b) { return b.state_time - a.state_time })
            this.data = this.data.filter(a => a.symbol.includes(this.inheritedSymbolDetails.symbol));
            this.data = this.data.sort((n1, n2) => new Date(n2.execution_time).getTime() - new Date(n1.execution_time).getTime());

            this._changeDetectorRef.detectChanges();
        }
    }

    updateorderConfirmation(data) {
        if (AppUtility.isValidVariable(data)) {
            if (data.state === 'trade') {
                this.getExecutedOrders('', true);
            }
        }

    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

}