import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AppConstants, AppUtility} from "../../../../../../../app.utility";
import {Subject} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {OrderService} from "../../../../../../../services-oms/order-oms.service";
import {takeUntil} from "rxjs/operators";
import {SymbolStats} from "../../../../../../../models/symbol-stats";
import {FuseLoaderScreenService} from "../../../../../../../../@fuse/services/splash-screen";
import {AuthService} from "../../../../../../../services-oms/auth-oms.service";
import {Order} from "../../../../../../../models/order";
import {AlertMessage} from "../../../../../../../models/alert-message";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {RefinedOrder} from "../../../../../../../models/refined-order.model";
import {ListingService as OmsListingService} from "../../../../../../../services-oms/listing-oms.service";
import {SecurityMarketDetails} from "../../../../../../../models/security-market-details";
import {ListingService} from "../../../../../../../services/listing.service";
import * as wjcInput from '@grapecity/wijmo.input';
import {
    MappedOrder
} from "../../../../orders/pending-orders/pending-orders-list/pending-order-action-dialog/order-mapping-utils";
import {MappedNegOrder} from "../map-pending-negotiated-deal-util";

declare var jQuery: any;

export enum PendingOrderAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    CANCEL = 'CANCEL',
}

@Component({
  selector: 'app-accept-reject-pending-order',
  templateUrl: './accept-reject-pending-order.component.html',
})
export class AcceptRejectPendingOrderComponent implements OnInit, AfterViewInit, OnDestroy{

    @Input() modalId = 'accept-reject-negotiated-order-dialog';
    @Input() selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    @Output() refresh = new EventEmitter<boolean>();

    order = new Order();
    symbolStats = new SymbolStats();
    securityMarketDetails = new SecurityMarketDetails();
    alertMessage = new AlertMessage();
    action: PendingOrderAction = PendingOrderAction.APPROVE;
    orderForm: FormGroup;
    isSubmitted: boolean = false;
    pendingOrderAction = PendingOrderAction;

    AppConstants = AppConstants;

    private readonly _destroy$ = new Subject<void>();
    invalidRejected: boolean = false;

    constructor(private readonly _toastService: ToastrService,
                private readonly _orderService: OrderService,
                private readonly _splashService: FuseLoaderScreenService,
                private readonly _authServiceOMS: AuthService,
                private readonly _omsListingService: OmsListingService,
                private readonly _listingService: ListingService,) {}

    ngOnInit() {
        this._initializeForm();
    }

    ngAfterViewInit() {
        this._authServiceOMS.socket.on('order_confirmation',
            (res: any) => {
                this.showOrderConfirmationMsg(res);
            });
    }

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
    }

    showModal(order: any, action: PendingOrderAction): void {
        this.order = order;
        this.action = action;
        this.isSubmitted = false;
        const modalSelector = jQuery(`#${this.modalId}`);
        modalSelector.modal({backdrop: 'static', keyboard: true});
        modalSelector.modal('show');

        this._getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
        this.orderForm.patchValue(this.order);
        this.orderForm.controls.symbol.setValue(`${this.order.symbol}(${this.order.market}/${this.order.exchange})`)
        this.orderForm.controls.side.setValue(this.order.side === 'buy' ? 'Buy' : 'Sell');
        this.onDisableForm();

        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS){
            this._getBondDetails();
        }
    }

    onClose(): void {
        jQuery(`#${this.modalId}`).modal('hide');
    }

    showOrderConfirmationMsg(res: any): void {
        const order = new Order();
        this.alertMessage = order.formatOrderConfirmationMsg(res, 'Equity');
        setTimeout(() => {
            this.alertMessage = new AlertMessage();
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
    }

    onAlertClose(): void {
        this.alertMessage = new AlertMessage();
    }

    onConfirm() {

        this.orderForm.disable();
        this.isSubmitted = true;

        switch (this.action) {
            case PendingOrderAction.APPROVE:
                this._acceptOrder();
                break;

            case PendingOrderAction.REJECT:
                this._rejectOrder();
                break;

            case PendingOrderAction.CANCEL:
                this._cancelOrder();
                break;

            default:
                console.error('Unhandled action type:', this.action);
                break;
        }
    }

    onDisableForm(){
        switch (this.action) {
            case PendingOrderAction.APPROVE:
                this.orderForm.disable();
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

    onRefresh() {
        this.refresh.emit(true);
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

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------------ Private Methods ----------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeForm() {
        this.orderForm = new FormGroup({
            side: new FormControl(''),
            symbol: new FormControl(''),
            volume: new FormControl(''),
            price_: new FormControl(''),
            value: new FormControl(''),
            account: new FormControl(''),
            counter_broker_code: new FormControl(''),
            comments: new FormControl('', Validators.required),

            // Bonds
            settlementValue: new FormControl(''),
            yield: new FormControl(''),
        });
    }

    private _getBestMarketAndSymbolSummary(exchangeCode: string, marketCode: string, securityCode: string) {
        this._splashService.show();
        if (AppUtility.isValidVariable(exchangeCode) && AppUtility.isValidVariable(marketCode) && AppUtility.isValidVariable(securityCode)) {
            this._orderService.getBestMarketAndSymbolStats(exchangeCode, marketCode, securityCode).pipe(takeUntil(this._destroy$))
                .subscribe({
                    next: (stats: any) => {
                        this._splashService.hide();
                        if (AppUtility.isValidVariable(stats)) {
                            this._updateBestMarketAndSymbolStats(stats);
                        }
                    },
                    error: (err: any) => {
                        this._splashService.hide();
                        this._toastService.error(err.message);
                    }
                })
        }
    }

    private _getBondDetails(){
        const refinedOrder: Partial<RefinedOrder> = {...this.order};
        this._splashService.show();
        this._omsListingService.getSymbolMarket(refinedOrder.exchangeId, refinedOrder.marketId, refinedOrder.symbolId).pipe(takeUntil(this._destroy$)).subscribe({
            next: (details) => {
                this._splashService.hide();
                if (AppUtility.isValidVariable(details)){
                    this.securityMarketDetails.updateSecurityMarketData(details);
                }
            },
            error: (err) => {
                this._toastService.success(err.error.message ?? 'Something went wrong!');
                this._splashService.hide();
            }
        })
    }

    private _acceptOrder() {
        this._splashService.show();
        this._listingService.acceptNegoPendingOrders(Number(this.order.order_no)).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this.onRefresh();
                this._submitOrder(this.order);
            },
            error: (error: any) => {
                this._createAlert('danger', error ?? 'Something went wrong!');
                this.isSubmitted = false;
            }
        });
    }

    private _rejectOrder() {
        const data = {
            orderNo: Number(this.order.order_no),
            comments: this.orderForm.controls['comments'].value
        };
        this._splashService.show();
        this._listingService.rejectNegoPendingOrders(data).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this.onRefresh();
                this._createAlert('success', 'Order have been rejected successfully.');
            },
            error: (error: any) => {
                this._createAlert('danger', error ?? 'Something went wrong!');
                this.isSubmitted = false;
            }
        });
    }

    private _cancelOrder() {
        this._listingService.cancelNegoPendingOrders(Number(this.order.order_no)).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this.onRefresh();
                this._createAlert('success', 'Order has been canceled successfully.');
            },
            error: (error: any) => {
                this._createAlert('danger', error ?? 'Something went wrong!');
                this.isSubmitted = false;
            }
        });
    }

    private _submitOrder(order: Order){
        const refinedOrder = MappedNegOrder(order);
        this._orderService.submitOrder(refinedOrder as Order).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this._createAlert('success', 'Order forwarded to trading system.');
            },
            error: (error: any) => {
                let alertMessage = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error)).error));
                this._createAlert('danger', alertMessage ?? 'Something went wrong!');
                this.onRefresh();
            }
        })
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
        this._splashService.hide();
        setTimeout(() => {
            this.alertMessage = new AlertMessage();
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
    }
}
