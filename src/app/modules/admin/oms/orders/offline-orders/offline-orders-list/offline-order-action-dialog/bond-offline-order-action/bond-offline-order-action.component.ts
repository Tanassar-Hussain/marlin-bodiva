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
import {OfflineOrdersService} from "../../../../../../../../services/offline-orders.service";
import {OfflineOrderAction} from "../../../offline-orders.component";
import {AlertMessage} from "../../../../../../../../models/alert-message";
import {AuthService} from "../../../../../../../../services-oms/auth-oms.service";
import {ListingService} from "../../../../../../../../services-oms/listing-oms.service";
import {SecurityMarketDetails} from "../../../../../../../../models/security-market-details";
import {RefinedOrder} from "../../../../../../../../models/refined-order.model";
import {MappedOrder} from "../order-mapping-utils";
import {MappedOfflineOrder} from "../map-offline-order-utli";

declare var jQuery: any;

@Component({
    selector: 'app-bond-offline-order-action',
    templateUrl: './bond-offline-order-action.component.html',
    styleUrls: ['./bond-offline-order-action.component.scss']
})
export class BondOfflineOrderActionComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() order = new Order();
    @Input() action: OfflineOrderAction = OfflineOrderAction.APPROVE;
    @Input() modalId: string = '';
    @Output() hide = new EventEmitter<boolean>();
    @Output() refresh = new EventEmitter<boolean>();

    userType = AppConstants.userType;
    dateFormat = AppConstants.DATE_FORMAT;

    orderForm: FormGroup;
    initialFormValues = {};
    isSubmitted = false;
    isBondPricingMechanismPercentage: boolean = true;
    accruedInterest: number = 0;

    symbolStats = new SymbolStats();
    alertMessage = new AlertMessage();
    securityMarketDetails = new SecurityMarketDetails();
    pendingOrderAction = OfflineOrderAction;
    protected readonly AlertMessage = AlertMessage;

    private readonly _subscriptions: Subscription[] = [];
    invalidRejected: boolean = false;

    constructor(private readonly _appState: AppState,
                private readonly _toastService: ToastrService,
                private readonly _orderService: OrderService,
                private readonly _pendingOrdersService: OfflineOrdersService,
                private readonly _authServiceOMS: AuthService,
                private readonly _listingService: ListingService) {
    }

    ngOnInit(): void {
        this._initializeForm();
        if (this.order.order_no) {

            // this._getBestMarketAndSymbolSummary(this.order.exchange, this.order.market, this.order.symbol);
            this._fetchExchangeDetails(this.order.exchange);
            this._getBondDetails();
            this.onDisableForm();
        }

    }

    ngAfterViewInit() {
        this._authServiceOMS.socket.on('order_confirmation',
            (res: any) => {
                this._showOrderConfirmationMsg(res);
            });
    }

    ngOnDestroy() {
        this._subscriptions.forEach(sub => sub.unsubscribe());
    }

    showDialog(dlg: wjcInput.Popup) {
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

    onPriceChange(): void {
        let yieldValue = this.orderForm.controls['yield'].value;
        let price = this.orderForm.controls['price_'].value;
        let volume = this.orderForm.controls['volume'].value
        let calculatePriceToYield = this.securityMarketDetails.calculatePriceToYield(price, volume, yieldValue, this.isBondPricingMechanismPercentage);
        this.orderForm.controls['yield'].setValue(calculatePriceToYield);
        this.updateSettlementAmount();
    }

    onVolumeChange(): void {
        let volume = this.orderForm.controls['volume'].value;
        if (volume < 1) this.orderForm.controls['volume'].setValue(1);
        this.calculateAccruedInterest(volume);
        this.updateSettlementAmount();
    }

    

    updateSettlementAmount() {
    
        let price = this.orderForm.controls['price_'].value;
        let volume = this.orderForm.controls['volume'].value;

        if (Number(volume) == 0 || Number(price) == 0) {
          this.order.settlementValue = 0
          this.order.settlementValueCurrency = 0;
        }
    
        else {
          if (this.securityMarketDetails != null && this.securityMarketDetails.fisDetail != null
            && this.securityMarketDetails.fisDetail.bondType != null
            && this.securityMarketDetails.fisDetail.bondType.bondTypeId != 0) {
            if (this.isBondPricingMechanismPercentage)
              this.order.value = (Number(volume) * this.securityMarketDetails.parValue) * (Number(price) / 100);
            else
              this.order.value = (Number(volume) * this.securityMarketDetails.parValue) * (Number(price));
          } else {
            this.order.value = Number(volume) * Number(price);
          }
          this.order.settlementValue = Number(this.order.value) + Number(this.securityMarketDetails.accrudeProfit);
          this.orderForm.controls['value'].setValue(this.order.settlementValue);
          this.order.settlementValueCurrency = this.order.settlementValue *  Number(this.securityMarketDetails.currencyRate);
          
        }
    
      }



    calculateAccruedInterest(volume : number) {
        // zero coupon check 
        if (this.securityMarketDetails !== undefined && this.securityMarketDetails != null
          && this.securityMarketDetails.exchangeCode !== null
          && this.securityMarketDetails.fisDetail !== undefined
          && this.securityMarketDetails.fisDetail !== null
          && this.securityMarketDetails.fisDetail.bondType != null
          && this.securityMarketDetails.fisDetail.bondType.bondTypeId != 0) {
          this.accruedInterest = this.securityMarketDetails.calculateAccruedProfit(volume);
          this.accruedInterest = this.securityMarketDetails.toTrunc(this.accruedInterest, 4);
    
          if (AppConstants.capitalTaxPercent > 0) {
            this.addTaxExpWithAccruedProfite();
          }
    
          this.updateSettlementAmount();
    
        } else {
          this.accruedInterest = 0;
          this.securityMarketDetails.accrudeProfit = 0;
          this.updateSettlementAmount();
        }
      }



      addTaxExpWithAccruedProfite() {
        // difference
        let calculatedAccruedProfit = this.securityMarketDetails.accrudeProfit;
        let newAccruedProfit = 0;
    
        if (AppConstants.capitalTaxPercent !== undefined && AppConstants.capitalTaxPercent !== null && AppConstants.capitalTaxPercent > 0) {
    
          newAccruedProfit =
            calculatedAccruedProfit * (1 - Number(AppConstants.capitalTaxPercent / 100));
          this.accruedInterest = this.securityMarketDetails.toTrunc(newAccruedProfit, 4);
          this.securityMarketDetails.setAccruedProfit(newAccruedProfit);
        }
    
      };


    onConfirm() {

        this.orderForm.disable();
        this.isSubmitted = true;

        switch (this.action) {
            case OfflineOrderAction.APPROVE:
                this._approveOrder();
                break;

            case OfflineOrderAction.EDIT:
                this._editOfflineOrder();
                break;

            case OfflineOrderAction.REJECT:
                this._rejectOrder();
                break;

            case OfflineOrderAction.CANCEL:
                this._cancelOfflineOrder();
                break;

            default:
                console.error('Unhandled action type:', this.action);
                break;
        }
    }

    onDisableForm() {
        switch (this.action) {
            case OfflineOrderAction.APPROVE:
                this.orderForm.enable();
                break;

            case OfflineOrderAction.EDIT:
                this.orderForm.enable();
                break;

            case OfflineOrderAction.REJECT:
                this.orderForm.disable();
                this.orderForm.controls['comments'].enable();
                break;

            case OfflineOrderAction.CANCEL:
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

    isFormModified(): boolean {
        return JSON.stringify(this.initialFormValues) !== JSON.stringify(this.orderForm.getRawValue());
    }

    private _showOrderConfirmationMsg(res: any): void {
        const order = new Order();
        this.alertMessage = order.formatOrderConfirmationMsg(res, 'Bond');
        setTimeout(() => {
            this.alertMessage = new AlertMessage();
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
    }

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
             comments: new FormControl(''),
            yield: new FormControl(''),
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
            next: (response: any) => {
           
                this.onRefresh();
                this._createAlert('success', 'Order have been deleted successfully.');
                setTimeout(() => {
                    this.onClose();
                }, 1000);
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong');
            }
        }));
    }

    private _cancelOfflineOrder() {
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

    private _editOfflineOrder() {
        let orderForm = this.orderForm.getRawValue();
        const order = {
            orderNo: Number(orderForm.order_no),
            volume: orderForm.volume,
            price: orderForm.price_,
            value: orderForm.value,
            accruedProfit: this.securityMarketDetails.accrudeProfit,
            yield: orderForm.yield,
            comments: null,
        }
        this._subscriptions.push(this._pendingOrdersService.updatePendingOrder(order).subscribe({
            next: (res: any) => {
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
            accruedProfit: this.accruedInterest,
            yield: orderForm.yield,
            comments: null,
        }
        this._subscriptions.push(this._pendingOrdersService.acceptPendingOrders(order).subscribe({
            next: (order) => {
                this.onRefresh();
             //   this._submitOrder(order);
            },
            error: (error: any) => {
                this._createAlert('danger', error.error.message ?? 'Something went wrong.');
            }
        }));
    }

    private _submitOrder(order: Order) {
        const refinedOrder = MappedOfflineOrder(order);
        refinedOrder.accrudeProfit = this.accruedInterest;
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

    private _fetchExchangeDetails(code: string) {
        this._appState.showLoader = true;
        this._subscriptions.push(this._listingService.getExchangeByExchangeCode(code).subscribe({
            next: (exchangeDetails) => {
                this._appState.showLoader = false;

                if (AppUtility.isValidVariable(exchangeDetails) && !AppUtility.isEmpty(exchangeDetails)) {
                    this.isBondPricingMechanismPercentage = exchangeDetails['bondPricingMechanism'] == 2;
                } else {
                    this.isBondPricingMechanismPercentage = false;
                }

            },
            error: (err) => {
                this._toastService.success(err.error.message ?? 'Something went wrong.');
                this._appState.showLoader = false;
            }
        }))
    }

    private _getBondDetails(){
        const refinedOrder: Partial<RefinedOrder> = {...this.order};
        this._listingService.getSymbolMarket(refinedOrder.exchangeId, refinedOrder.marketId, refinedOrder.symbolId).subscribe({
            next: (details) => {
                this._appState.showLoader = false;
                if (AppUtility.isValidVariable(details)){
                    this.securityMarketDetails.updateSecurityMarketData(details);
                    this.orderForm.patchValue(this.order);
                    setTimeout(() => {
                        this.initialFormValues = this.orderForm.getRawValue();
                    });
                }
            },
            error: (err) => {
                this._toastService.success(err.error.message ?? 'Something went wrong.');
                this._appState.showLoader = false;
            }
        })
    }

}
