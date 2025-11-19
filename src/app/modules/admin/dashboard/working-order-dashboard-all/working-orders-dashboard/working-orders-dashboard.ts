import { Component, ViewEncapsulation, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, OnChanges } from '@angular/core';

import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';


import { TranslateService } from '@ngx-translate/core';
import { Order } from 'app/models/order';
import { Market } from 'app/models/market';
import { ComboItem } from 'app/models/combo-item';

import { AppState } from 'app/app.service';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { UsersOmsReports } from 'app/models/users-oms-reports';
import { Exchange } from 'app/models/exchange';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';

import { Symbol } from 'app/models/symbol';
import { Client } from 'app/models/client';
import { FormBuilder } from '@angular/forms';
import { CancelOrderAll } from 'app/modules/admin/oms/order/cancel-order-all/cancel-order-all';
import { ChangeOrderAll } from 'app/modules/admin/oms/order/change-order-all/change-order-all';
import { DialogCmpReports } from 'app/modules/admin/oms/reports/dialog-cmp-reports';
import { DashboardService } from '../../dashboard.service';
import { elementAt, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

declare var jQuery: any;
//import 'slim_scroll/jquery.slimscroll.js';
@Component({
    selector: 'working-order-dashboard',
    templateUrl: './working-orders-dashboard.html',
    encapsulation: ViewEncapsulation.None,
})
export class WorkingOrderDashboardComponent implements OnInit, AfterViewInit {

    dateTimeFormat: string = AppConstants.DATE_TIME_FORMAT;
    utcLocaleHours: string = AppConstants.UTC_LOCALE_HOURS;

    data: any = [];
    filterColumns = ['exchange', 'market', 'symbol', 'order_no', 'username', 'custodian', 'account', 'price', 'volume',
        'type_', 'qualifier', 'state_time', 'discQuantity', 'triggerPrice', 'tifOption', 'gtd'];
    lang: string;
    errorMsg: string = '';
    selectedOrder: Order;
    private _pageSize = 0;

    userType: string;
    allTraders: Boolean = true;
    traders: any[] = [];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    selectedAssetClass = AppConstants.selectedAssetClass;
    isCustodian: boolean = false;

    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild(CancelOrderAll, { static: false }) orderCancelAll: CancelOrderAll;
    @ViewChild(ChangeOrderAll, { static: false }) orderChangeAll: ChangeOrderAll;
    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;


    constructor(private appState: AppState, public authServiceOMS: AuthService, private orderSvc: OrderService,
        private listingSvc: ListingService, private _fb: FormBuilder, private translate: TranslateService, private splash: FuseLoaderScreenService,
        private dashboardService: DashboardService, private toast: ToastrService, private _changeDetectorRef: ChangeDetectorRef,) {
        this.userType = AppConstants.userType;

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

        if (AppConstants.CUSTODIAN_MODEL === true) {
            this.isCustodian = true;
        }
        else {
            this.isCustodian = false;
        }


    }


    ngOnInit(): void {
         
        this.dashboardService.selectedAssetClass$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {
                this.selectedAssetClass = data;

                if (this.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
                    this.loadTradersFromStorage();
                }
                else {
                    this.traders = [];
                    let u: any = new Object();
                    u.userName = AppConstants.loginName;
                    u.email = AppConstants.username;
                    this.traders.push(u);
                    this.traders[0].selected = true;
                    this.traders[0].$checked = true;
                    this.getWorkingOrders('', true);
                }
            });


        this.authServiceOMS.socket.on('order_confirmation', (dataorderConfirmation) => {
            this.updateorderConfirmation(dataorderConfirmation);
        });
    }



    ngAfterViewInit(): void {
        this.authServiceOMS.socket.on('order_confirmation', (dataorderConfirmation) => {
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
    updateorderConfirmation(data) {

        if (AppUtility.isValidVariable(data)) {
             
            if ((data.state === 'submitted' || data.state === 'changed' || data.state === 'cancelled' || data.state === 'trade') && (data.market !== AppConstants.MARKET_TYPE_REPO_)) {
                this.getWorkingOrders('', true);
            }
        }
    }


    // -------------------------------------------------------------------------

    // loadTraders(): void {

    //     this.splash.show();
    //     this.listingSvc.getUserList(AppConstants.participantId).subscribe(restData => {
    //         this.splash.hide();
    //         if (AppUtility.isEmptyArray(restData)) {
    //             this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
    //             this.dialogCmp.statusMsg = this.errorMsg;
    //             this.dialogCmp.showAlartDialog('Error');
    //         }
    //         else {
    //             this.updateTraders(restData);
    //             this.getWorkingOrders('', true);
    //         }
    //     },
    //         error => {
    //             this.splash.hide();
    //             this.errorMsg = <any>error;
    //             this.dialogCmp.statusMsg = this.errorMsg;
    //             this.dialogCmp.showAlartDialog('Error');
    //         });
    // }




    loadTradersFromStorage(): void {                              //Added By @Faizan and commented loadTraders() method ----- 02-05-2023
        const traders = JSON.parse(sessionStorage.getItem("traders"));
            if (AppUtility.isValidVariable(traders) && !AppUtility.isEmptyArray(traders)) {
                this.updateTraders(traders);
                this.getWorkingOrders('', true);
            }
            else{
                this.errorMsg = AppConstants.MSG_NO_TRADERS_DATA_FOUND;
               // this.toast.error(this.errorMsg , 'Error');
            }
    }




    updateTraders(data) {
        if (!AppUtility.isValidVariable(data)) {
            return;
        }
        this.traders = [];
        if (this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
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
                // if (data[i].userName === AppConstants.loginName) {
                //     this.traders[i].selected = true;
                //     this.traders[i].$checked = true;
                // }
            }
        }

        // this.getWorkingOrders('', true);
    }



    getWorkingOrders(model: any, isValid: boolean): void {
        let usersOmsReports: UsersOmsReports = null;
        if (this.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
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

        }
        else {
            //AppConstants.claims2
            usersOmsReports = new UsersOmsReports();
            usersOmsReports.users[0] = AppConstants.username
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
        }

        if (usersOmsReports.users != null && usersOmsReports.users.length > 0) {
            this.splash.show();


            this.orderSvc.getOrders(usersOmsReports).subscribe(data => {

                this.splash.hide();

                this.updateWorkingOrders(data)


            },
                error => {

                    this.splash.hide();
                    this.errorMsg = <any>error;
                });
        }

    }



    loadChangeOrder() {

        this.selectedOrder = this.flexGrid.rows[this.flexGrid.selection.row].dataItem;
        let orderNo: string = '';
        if (!AppUtility.isValidVariable(this.selectedOrder)) {
            return;
        }
        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            orderNo = this.selectedOrder.order_no;
            this.orderChangeAll.getOrderNo(orderNo, this.selectedOrder.username);
            this.orderChangeAll.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
            this.orderChangeAll.showFromWO();
            this.orderChangeAll.clickEquityTab();
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            orderNo = this.selectedOrder.order_no;
            this.orderChangeAll.loadOrderNo(orderNo, this.selectedOrder.username);
            this.orderChangeAll.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            this.orderChangeAll.showFromWO();
            this.orderChangeAll.clickBondsTab();
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_ETF;
            orderNo = this.selectedOrder.order_no;
            this.orderChangeAll.getOrderNoETFs(orderNo, this.selectedOrder.username);
            this.orderChangeAll.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            this.orderChangeAll.showFromWO();
            this.orderChangeAll.clickETFsTab();
             
        }


    }

    // -------------------------------------------------------------------------

    loadCancelOrder() {

        this.selectedOrder = this.flexGrid.rows[this.flexGrid.selection.row].dataItem;
        let orderNo: string = '';
        if (!AppUtility.isValidVariable(this.selectedOrder)) {
            return;
        }
        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            orderNo = this.selectedOrder.order_no;
            this.orderCancelAll.getOrderNo(orderNo, this.selectedOrder.username);
            this.orderCancelAll.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
            this.orderCancelAll.showWO();
            this.orderCancelAll.clickEquityTab();

        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            orderNo = this.selectedOrder.order_no;
            this.orderCancelAll.loadOrderNo(orderNo, this.selectedOrder.username);
            this.orderCancelAll.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
            this.orderCancelAll.showWO();
            this.orderCancelAll.clickBondsTab();
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            AppConstants.selectedAssetClass = AppConstants.ASSET_CLASS_ETF;
            orderNo = this.selectedOrder.order_no;
            this.orderCancelAll.getOrderNoETFs(orderNo, this.selectedOrder.username);
            this.orderCancelAll.selectedAssetClass = AppConstants.ASSET_CLASS_ETF;
            this.orderCancelAll.showWO();
            this.orderCancelAll.clickETFsTab();
             
        }




    }





    updateWorkingOrders(workingOrders): void {
        this.data = [];

        let orders = workingOrders.orders;
        if (AppUtility.isEmpty(orders)) {
            this._changeDetectorRef.detectChanges();
            return;
        }
        if (!AppUtility.isEmpty(orders)) {

            for (let i = 0; i < orders.length; i++) {
                if(this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES){
                    if(orders[i].asset_id === AppConstants.ASSET_CLASS_ID_EQUITIES){
                        let o: Order = new Order();
                        o.setOrder(orders[i]);
                        o.type_ = AppUtility.ucFirstLetter(o.type_);
                        if (this.selectedAssetClass !== AppConstants.ASSET_CLASS_BONDS) {
                            let p = 0;
                            p = Number(orders[i].price);
                            o.settlementValue = (p) * orders[i].volume;
                        }
        
                        this.data.push(o);
                    }
                }
                else{
                    let o: Order = new Order();
                    o.setOrder(orders[i]);
                    o.type_ = AppUtility.ucFirstLetter(o.type_);
                    if (this.selectedAssetClass !== AppConstants.ASSET_CLASS_BONDS) {
                        let p = 0;
                        p = Number(orders[i].price);
                        o.settlementValue = (p) * orders[i].volume;
                    }
    
                    this.data.push(o);
                }
              
               
            }
            this.data = this.data.sort((n1, n2) => new Date(n2.state_time).getTime() - new Date(n1.state_time).getTime());
            this._changeDetectorRef.detectChanges();

        }

    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

}
