import { Component, Inject, ViewEncapsulation, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { AuthService2 } from 'app/services/auth2.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { UsersOmsReports } from 'app/models/users-oms-reports';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { DialogCmpReports } from '../../../reports/dialog-cmp-reports';
import { Order } from 'app/models/order';
import { OrderTypes } from 'app/models/order-types';


import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import { NegotiatedDealsComponent } from '../../negotiated-deals/negotiated-deals';
import { ToastrService } from 'ngx-toastr';
import { CancelOrder } from 'app/models/Order-cancel';

@Component({
    selector: 'negotiated-investor-equity-deals-list',
    templateUrl: './negotiated-investor-equity-deals-list.html',
})

export class NegotiatedInvestorEquityDealsListComponent {


    filterColumns = ['assetClass', 'symbol', 'side', 'price', 'quantity', 'orderNo', 'sellerAccount', 'sellerBroker', 'sellerCustodian', 'sellerUser',
        'buyerAccount', 'buyerBroker', 'buyerCustodian', 'buyerUser', 'initiator', 'status', 'state'];

    lang: string;
    userType: string;
    private _pageSize = 0;
    private _pageSize2 = 0;
    dataInitiatedByMe: any = [];
    dataInitiatedForMe: any = [];
    traders: any[] = [];
    errorMsg: string = '';
    data: any = [];
    data_temp: any = [];
    orderCancel: CancelOrder;
    assetclass = AppConstants.ASSET_CLASS_ID_EQUITIES
    modal = true;

    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('flexGrid2', { static: false }) flexGrid2: wjcGrid.FlexGrid;
    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;
    @ViewChild(NegotiatedDealsComponent, { static: false }) negotiatedOrderAccpet: NegotiatedDealsComponent;
    @ViewChild('orderCancleDlg', { static: false }) orderCancleDlg: wjcInput.Popup;
    statusMsg: string;
    order: any

    constructor(private translate: TranslateService, public authService: AuthService2, private orderSvc: OrderService,
        private splash: FuseLoaderScreenService, private listingSvc: ListingService, private toast: ToastrService,) {

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

        this.userType = AppConstants.userType;
    }

    // -------------------------------------------------------------------------
    get pageSize1(): number {
        return this._pageSize;
    }
    // -------------------------------------------------------------------------
    set pageSize1(value: number) {
        if (this._pageSize !== value) {
            this._pageSize = value;
            if (this.flexGrid) {
                (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
            }
        }
    }
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    get pageSize2(): number {
        return this._pageSize2;
    }
    // -------------------------------------------------------------------------
    set pageSize2(value: number) {
        if (this._pageSize2 !== value) {
            this._pageSize2 = value;
            if (this.flexGrid2) {
                (<wjcCore.IPagedCollectionView>this.flexGrid2.collectionView).pageSize = value;
            }
        }
    }
    // -------------------------------------------------------------------------


    ngOnInit() {

        if (this.userType === 'PARTICIPANT' || this.userType === 'PARTICIPANT ADMIN') {
            this.loadTraders();
        }
        else
            this.getEventLog('', true);


        this.orderCancel = new CancelOrder();
    }
    // -------------------------------------------------------------------------

    loadTraders(): void {
        this.splash.show();
        this.listingSvc.getUserList(AppConstants.participantId).subscribe(
            users => {
                this.splash.hide();
                if (AppUtility.isEmptyArray(users)) {
                    this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
                    return;
                }

                this.traders = [];
                let u: any = new Object();
                u.userName = AppConstants.loginName;
                u.email = AppConstants.username;
                this.traders.push(u);
                this.traders[0].selected = true;
                this.traders[0].$checked = true;
                for (let i = 1; i <= users.length; i++) {
                    this.traders[i] = users[i - 1];
                    if (this.traders[i].userName === AppConstants.loginName) {
                        this.traders[i].selected = true;
                        this.traders[i].$checked = true;
                    }
                }

                this.getEventLog('', true);
            },
            error => {
                this.splash.hide();
                this.errorMsg = <any>error;
                this.dialogCmp.statusMsg = this.errorMsg;
                this.dialogCmp.showAlartDialog('Error');
            });
    }


    // -------------------------------------------------------------------------

    getEventLog(model: any, isValid: boolean): void {
        this._pageSize = 0;
        this._pageSize2 = 0;
        let usersOmsReports: UsersOmsReports = null;
        if (this.userType === 'PARTICIPANT' || this.userType === 'PARTICIPANT ADMIN') {

            usersOmsReports = new UsersOmsReports();
            for (let i = 0; i < this.traders.length; i++) {
                usersOmsReports.users[i] = this.traders[i].email;
            }
            usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
            usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES

        } else {

            usersOmsReports = new UsersOmsReports();
            console.log("event log, User name: " + AppConstants.username);
            usersOmsReports.users[0] = AppConstants.username
            usersOmsReports.symbolType = AppConstants.SYMBOL_TYPE_EQUITIES;
            usersOmsReports.marketType = AppConstants.MARKET_TYPE_EQUITIES;
        }
        AppUtility.printConsole("userOmsReports: " + usersOmsReports);
        this.splash.show();
        this.orderSvc.getEventLog(usersOmsReports).subscribe(
            data => {
                this.splash.hide();
                this.updateData(data);
            },
            error => {
                this.splash.hide();
                this.errorMsg = <any>error;
            });
    }

    // -------------------------------------------------------------------------

    updateData(eventLog): void {
        this.data = [];
        this.data_temp = [];
        let orders = eventLog.orders;

        if (orders == null) { return; }
        for (let i = 0; i < orders.length; i++) {

            if (orders[i].order_state !== 'partial_filled' && orders[i].order_state !== 'filled') {

                if (orders[i].order_state === 'canceled') {
                    orders[i].remaining_volume = orders[i].volume;
                    orders[i].volume = orders[i].actual_volume
                }

                Order.setStuffBasedOnType(orders[i], orders[i]);
                if (orders[i].order_state === 'submitted') {
                    orders[i].filled_volume = '0';
                    orders[i].remaining_volume = orders[i].volume;
                }
                orders[i].state_time = wjcCore.Globalize.formatDate(new Date(orders[i].state_time), AppConstants.DATE_TIME_FORMAT);
                orders[i].type = OrderTypes.getOrderTypeViewStr(orders[i].type);
                orders[i].order_state = AppUtility.ucFirstLetter(orders[i].order_state);
                orders[i].order_no = orders[i].order_no.toString();
                if (AppUtility.isValidVariable(orders[i].ticket_no)) {
                    orders[i].ticket_no = orders[i].ticket_no.toString();
                }
                orders[i].volume = (eventLog.orders[i].volume > 0) ? wjcCore.Globalize.format(eventLog.orders[i].volume, 'n0') : '';
                orders[i].price = (Number(eventLog.orders[i].price) > 0) ? eventLog.orders[i].price : '';
                orders[i].trigger_price = (Number(eventLog.orders[i].trigger_price) > 0) ? eventLog.orders[i].trigger_price : '';
                this.data_temp.push(orders[i]);
            }


        }

        this.data = this.data_temp.sort((n1, n2) => new Date(n1.state_time).getTime() - new Date(n2.state_time).getTime());

        //for duplicates and initiate / accept / cancle = latest  repeated order_number should be selected
        let uniqueData = this.data.filter((v, i, array) => array.findLastIndex(v2 => (v2.order_no === v.order_no)) === i)

        this.data = uniqueData

        let byMe = []
        let forMe = []
        this.data.map(a => {
            if (a.order_type == 'negotiated' && a.asset_id == AppConstants.ASSET_CLASS_ID_EQUITIES) {

                if (a.order_state === 'Canceled' || a.order_state === 'Rejected' || a.order_state === 'rejected' || a.order_state === 'canceled') {
                    a.negotiated_order_state = a.order_state
                }
                // ................................settingDataForCancel......................................
                a.is_negotiated = true
                a.counter_broker_code = a.counter_broker
                a.counter_client_code = ''
                a.counter_user_id = 0
                a.custodian = ''
                a.yield = 0
                // ................................settingDataForCancel......................................

                a.assetClass = AppConstants.ASSET_CODE_EQUITIES

                a.act_order_no = a.order_no

                if (AppConstants.username == a.counter_username) {
                    a.act_order_no = a.counter_order_no
                }

                if (a.side == 'buy') {
                    a.buyerAccount = a.actual_client_code;
                    a.buyerBroker = a.actual_broker_code;
                    a.buyerCustodian = ''
                    a.buyerUser = a.username
                    a.initiator = a.username

                    if (a.username === "dummyuser@infotechgroup.com") {
                        a.buyerUser = ""
                        a.initiator = ""
                    }

                    a.sellerAccount = a.actual_counter_client_code;
                    a.sellerBroker = a.actual_counter_broker_code;
                    a.sellerCustodian = ''
                    a.sellerUser = a.counter_username

                    if (a.counter_username === "dummyuser@infotechgroup.com") {
                        a.sellerUser = ""
                    }

                    if (AppConstants.CUSTODIAN_MODEL) {
                        if (a.actual_custodian_code != undefined && a.actual_custodian_code.length > 0)
                            a.buyerCustodian = a.actual_custodian_code

                        if (a.actual_counter_custodian_code != undefined && a.actual_counter_custodian_code.length > 0)
                            a.sellerCustodian = a.actual_counter_custodian_code
                    }
                }
                if (a.side == 'sell') {

                    a.sellerAccount = a.actual_client_code;
                    a.sellerBroker = a.actual_broker_code;
                    a.sellerCustodian = ''
                    a.sellerUser = a.username
                    a.initiator = a.username

                    if (a.username === "dummyuser@infotechgroup.com") {
                        a.sellerUser = ""
                        a.initiator = ""
                    }

                    a.buyerAccount = a.actual_counter_client_code;
                    a.buyerBroker = a.actual_counter_broker_code;
                    a.buyerCustodian = ''
                    a.buyerUser = a.counter_username

                    if (a.counter_username === "dummyuser@infotechgroup.com") {
                        a.buyerUser = ""
                    }

                    if (AppConstants.CUSTODIAN_MODEL) {
                        if (a.actual_custodian_code != undefined && a.actual_custodian_code.length > 0)
                            a.sellerCustodian = a.actual_custodian_code

                        if (a.actual_counter_custodian_code != undefined && a.actual_counter_custodian_code.length > 0)
                            a.buyerCustodian = a.actual_counter_custodian_code
                    }
                }

                if (a.negotiated_order_state === "Accept") {
                    a.negotiated_order_state = 'Accepted'
                }
                if (a.negotiated_order_state === "Reject") {
                    a.negotiated_order_state = 'Rejected'
                }


                if (a.username == AppConstants.username) {
                    byMe.push(a)
                }
                if (a.counter_username == AppConstants.username) {
                    forMe.push(a)
                }
            }
        })

        this.dataInitiatedByMe = byMe;
        this.dataInitiatedForMe = forMe;
    }

    showCancelDialog(dlg: wjcInput.Popup) {
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
    }

    //...........................................................................
    cancelOrder(payLoad) {

        if (payLoad.negotiated_order_state === 'Initiate') {
            this.statusMsg = AppUtility.orderConfirmationMsg(payLoad, 'Cancel');

            let selectedOrder
            selectedOrder = payLoad
            selectedOrder.order_no = selectedOrder.order_no.replace(',', '');
            selectedOrder.type_ = selectedOrder.type_.toLowerCase();
            selectedOrder.type = selectedOrder.type_.toLowerCase();
            if (typeof (selectedOrder.volume) === 'string') {
                var purifiedVol = selectedOrder.volume.replace(',', '')
                selectedOrder.volume = Number(purifiedVol)
            }

            this.orderCancel.order = selectedOrder;


            this.showCancelDialog(this.orderCancleDlg);
        }
    }

    // -----------------------------------------------------------------

    onAlertYes(): void {
        this.splash.show();
        this.orderSvc.cancelOrder(this.orderCancel).subscribe((res) => {
            this.splash.hide();
            this.toast.success('Order Canceled', 'Success')

        }, error => {

            this.splash.hide();
            // this.toast.error('Something Went Wrong', 'Error')
            // this.errorMsg = <any>error;
        });
    }

    // -----------------------------------------------------------------

}