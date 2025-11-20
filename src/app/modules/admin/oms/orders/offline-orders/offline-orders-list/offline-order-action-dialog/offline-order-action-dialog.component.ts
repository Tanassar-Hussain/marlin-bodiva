import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AppConstants} from "../../../../../../../app.utility";
import {Order} from "../../../../../../../models/order";
import {OfflineOrderAction} from "../../offline-orders.component";

declare var jQuery: any;

@Component({
    selector: 'app-offline-order-action-dialog',
    templateUrl: './offline-order-action-dialog.component.html',
    styleUrls: ['./offline-order-action-dialog.component.scss']
})
export class OfflineOrderActionDialogComponent {

    @Input() modalId = 'accept-reject-order-dialog';
    @Input() selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
    @Output() refresh = new EventEmitter<boolean>();

    tradeType = AppConstants.tradeType;
    actualTrade = AppConstants.ACTUAL_TRADE_TYPE;
    virtualTrade = AppConstants.VIRTUAL_TRADE_TYPE;

    order = new Order();
    action: OfflineOrderAction = OfflineOrderAction.APPROVE;
    isModalVisible: boolean = false;

    constructor() {}

    showModal(order: Order, action: OfflineOrderAction): void {
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
