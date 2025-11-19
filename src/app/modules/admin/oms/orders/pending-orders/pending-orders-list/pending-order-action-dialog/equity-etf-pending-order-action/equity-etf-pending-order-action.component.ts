import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {AppConstants, AppUtility} from "../../../../../../../../app.utility";
import {AppState} from "../../../../../../../../app.service";
import {ToastrService} from "ngx-toastr";
import {OrderService} from "../../../../../../../../services-oms/order-oms.service";
import {Order} from "../../../../../../../../models/order";
import * as wjcInput from '@grapecity/wijmo.input';
import {SymbolStats} from "../../../../../../../../models/symbol-stats";
 
import {PendingOrderAction} from "../../../pending-orders.component";
import {AlertMessage} from "../../../../../../../../models/alert-message";
import {AuthService} from "../../../../../../../../services-oms/auth-oms.service";
import {MappedOrder} from "../order-mapping-utils";
import {MappedPendingOrder} from "../map-pending-order-utli";
import { PendingOrdersService } from 'app/services/pending-orders.service';

declare var jQuery: any;

@Component({
    selector: 'app-equity-etf-pending-order-action',
    templateUrl: './equity-etf-pending-order-action.component.html',
    styleUrls: ['./equity-etf-pending-order-action.component.scss']
})
export class EquityEtfPendingOrderActionComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() order = new Order();
    @Input() action: PendingOrderAction = PendingOrderAction.APPROVE;
    @Input() modalId: string = '';
    @Output() hide = new EventEmitter<boolean>();
    @Output() refresh = new EventEmitter<boolean>();

    userType = AppConstants.userType;
    dateFormat = AppConstants.DATE_FORMAT;

    orderForm: FormGroup;
    initialFormValues = {};
    isSubmitted = false;
    symbolStats = new SymbolStats();
    alertMessage = new AlertMessage();
    pendingOrderAction = PendingOrderAction;
    protected readonly AlertMessage = AlertMessage;

    private readonly _subscriptions: Subscription[] = [];
    invalidRejected: boolean = false;

    constructor(private readonly _appState: AppState,
                private readonly _toastService: ToastrService,
                private readonly _orderService: OrderService,
                private readonly _pendingOrdersService: PendingOrdersService,
                private readonly _authServiceOMS: AuthService) {
    }

    ngOnInit(): void {
        this._initializeForm();
        if (this.order.order_no) {
            this._getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
            this.orderForm.patchValue(this.order);
            this.initialFormValues = this.orderForm.getRawValue();
            this.onDisableForm();
        }

    }

    ngAfterViewInit() {
        this._authServiceOMS.socket.on('order_confirmation',
            (res: any) => {
            this.showOrderConfirmationMsg(res);
        });
    }

    ngOnDestroy() {
        this._subscriptions.forEach(sub => sub.unsubscribe());
    }

    showDialog(dlg: wjcInput.Popup) {
         
        if(this.action === this.pendingOrderAction.REJECT){
            if (this.orderForm.get('comments').invalid) {
                this.invalidRejected = true;
                return false;
              }
        }
     

        if (dlg) {
            let inputs = <NodeListOf<HTMLInputElement>>dlg.hostElement.querySelectorAll('input');
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i].type !== 'checkbox') {
                    inputs[i].value = '';
                }
            }

            dlg.modal = true;
            dlg.hideTrigger = dlg.modal ? wjcInput.PopupTrigger.None : wjcInput.PopupTrigger.Blur;

            dlg.show();
        }
    };

    onClose(): void {
        jQuery(`#${this.modalId}`).modal('hide');
        this.hide.emit(true);
    }

    onRefresh() {
        this.refresh.emit(true);
    }

    onAlertClose(): void {
        this.alertMessage = new AlertMessage();
    }

    onVolumePriceChange() {
        let volume = this.orderForm.controls['volume'].value;
        let price = this.orderForm.controls['price_'].value;
        this.orderForm.controls['value'].setValue(volume * price);
    }

    onConfirm() {

        this.orderForm.disable();
        this.isSubmitted = true;

        switch (this.action) {
            case PendingOrderAction.APPROVE:
                this._approveOrder();
                break;

            case PendingOrderAction.EDIT:
                this._editPendingOrder();
                break;

            case PendingOrderAction.REJECT:
                this._rejectOrder();
                break;

            case PendingOrderAction.CANCEL:
                this._cancelPendingOrder();
                break;

            default:
                console.error('Unhandled action type:', this.action);
                break;
        }
    }

    onDisableForm(){
        switch (this.action) {
            case PendingOrderAction.APPROVE:
                this.orderForm.enable();
                break;

            case PendingOrderAction.EDIT:
                this.orderForm.enable();
                break;

            case PendingOrderAction.REJECT:
                this.orderForm.disable();
                this.orderForm.controls['comments'].enable();
                break;

            case PendingOrderAction.CANCEL:
                this.orderForm.disable();
                break;

            default:
                console.error('Unhandled action type:', this.action);
                break;
        }
    }


    // ---------------------------------------------------------------------------------------------------
    // ------------------------------ Utility Private Methods --------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeForm() {
        this.orderForm = new FormGroup({
            order_no: new FormControl(''),
            symbol: new FormControl(''),
            volume: new FormControl(''),
            price_: new FormControl(''),
            value: new FormControl(''),
            account: new FormControl(''),
            username: new FormControl(''),
            type_: new FormControl(''),
            triggerPrice_: new FormControl(''),
            tifOption: new FormControl(''),
            gtd: new FormControl(''),
            qualifier: new FormControl(''),
            disclosedVolume: new FormControl(''),
            comments: new FormControl('' , Validators.required)
        });
    }

    private _updateBestMarketAndSymbolStats(stats: any): void {
        if (!AppUtility.isValidVariable(stats) || AppUtility.isEmpty(stats)) {
            return;
        }

        const symbolSummary = stats.symbol_summary;
        const symbolStats = symbolSummary?.stats;

        if (!AppUtility.isValidVariable(symbolStats)) {
            return;
        }

        if (this.order.exchange !== symbolStats.exchange ||
            this.order.market !== symbolStats.market ||
            this.order.symbol.toString().toUpperCase() !== symbolSummary.symbol.code.toString().toUpperCase()) {
            return;
        }

        symbolStats.symbol = symbolSummary.symbol.code;

        if (this.order.symbol === symbolStats.symbol) {
            this.symbolStats.updateSymbolStatsForOrderWindow(symbolStats);
        }
    }

    private _createAlert(type: 'success' | 'danger', message: string) {
        this.alertMessage = new AlertMessage();
        this.alertMessage.type = type;
        this.alertMessage.message = message;
        setTimeout(() => {
            this.alertMessage = new AlertMessage();
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
    }

    isFormModified(): boolean {
        return JSON.stringify(this.initialFormValues) !== JSON.stringify(this.orderForm.getRawValue());
    }

    showOrderConfirmationMsg(res: any): void {
        const order = new Order();
        this.alertMessage = order.formatOrderConfirmationMsg(res, 'Equity');
        setTimeout(() => {
            this.alertMessage = new AlertMessage();
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------ Fetch Private Methods ----------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _getBestMarketAndSymbolSummary(exchangeCode: string, marketCode: string, securityCode: string) {
        if (AppUtility.isValidVariable(exchangeCode) && AppUtility.isValidVariable(marketCode) && AppUtility.isValidVariable(securityCode)) {
            this._appState.showLoader = true;
            this._subscriptions.push(this._orderService.getBestMarketAndSymbolStats(exchangeCode, marketCode, securityCode)
                .subscribe({
                    next: (stats: any) => {
                        this._appState.showLoader = false;
                        if (AppUtility.isValidVariable(stats)) {
                            this._updateBestMarketAndSymbolStats(stats);
                        }
                    },
                    error: (err: any) => {
                        this._appState.showLoader = false;
                        this._toastService.error(err.message);
                    }
                }))
        }
    }

    private _rejectOrder() {
        const data = {
            orderNo: Number(this.order.order_no),
            comments: this.orderForm.controls['comments'].value
        };
        this._subscriptions.push(this._pendingOrdersService.rejectPendingOrders(data).subscribe({
            next: () => {
                this.onRefresh();
                this._createAlert('success', 'Order have been rejected successfully.');
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong');
            }
        }));
    }

    private _cancelPendingOrder() {
        this._subscriptions.push(this._pendingOrdersService.deletePendingOrder(Number(this.order.order_no)).subscribe({
            next: () => {
                this.onRefresh();
                this._createAlert('success', 'Order has been canceled successfully.');
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong.');
            }
        }));
    }

    private _editPendingOrder(){
        let orderForm = this.orderForm.getRawValue();
        const order = {
            orderNo: Number(orderForm.order_no),
            volume: orderForm.volume,
            price: orderForm.price_,
            value: orderForm.value,
            accruedProfit: null,
            yield: null,
            comments: null,
        }
        this._subscriptions.push(this._pendingOrdersService.updatePendingOrder(order).subscribe({
            next: (res : any) => {
                    this.onRefresh();
                    if(AppUtility.isValidVariable(res) && (res.statusCode === 202 || res.statusCode === 205)){
                        this._createAlert('success', res.message);
                    }
                    else{
                        this._createAlert('danger', res.message);
                    }
                   
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong.');
            }
        }))
    }

    private _approveOrder() {
        let orderForm = this.orderForm.getRawValue();
        const order = {
            orderNo: Number(orderForm.order_no),
            volume: orderForm.volume,
            price: orderForm.price_,
            value: orderForm.value,
            accruedProfit: null,
            yield: null,
            comments: null,
        }
        this._subscriptions.push(this._pendingOrdersService.acceptPendingOrders(order).subscribe({
            next: (order) => {
                this.onRefresh();
               // this._submitOrder(order);
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong.');
            }
        }));
    }

    private _submitOrder(order: Order){
        const refinedOrder = MappedPendingOrder(order);
        this._subscriptions.push(this._orderService.submitOrder(refinedOrder as Order).subscribe({
            next: () => {
                this.onRefresh();
                this._createAlert('success', 'Order forwarded to trading system.');
            },
            error: (error: any) => {
                let alertMessage = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error)).error));
                this._createAlert('danger', alertMessage ?? 'Something went wrong.');
                this.onRefresh();
            }
        }))
    }

}
