import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AppConstants} from "../../../../../../../app.utility";
import {Order} from "../../../../../../../models/order";
import {PendingOrderAction} from "../../pending-orders.component";

declare var jQuery: any;

@Component({
    selector: 'app-pending-order-action-dialog',
    templateUrl: './pending-order-action-dialog.component.html',
    styleUrls: ['./pending-order-action-dialog.component.scss']
})
export class PendingOrderActionDialogComponent {

    @Input() modalId = 'accept-reject-order-dialog';
    @Input() selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    @Output() refresh = new EventEmitter<boolean>();

    tradeType = AppConstants.tradeType;
    actualTrade = AppConstants.ACTUAL_TRADE_TYPE;
    virtualTrade = AppConstants.VIRTUAL_TRADE_TYPE;

    order = new Order();
    action: PendingOrderAction = PendingOrderAction.APPROVE;
    isModalVisible: boolean = false;

    constructor() {}

    showModal(order: Order, action: PendingOrderAction): void {
        this.order = order;
        this.action = action;
        const modalSelector = jQuery(`#${this.modalId}`);
        modalSelector.modal({backdrop: 'static', keyboard: true});
        modalSelector.modal('show');
        this.isModalVisible = true;
    }

    onClose(): void {
        jQuery(`#${this.modalId}`).modal('hide');
        this.isModalVisible = false;
    }
}
