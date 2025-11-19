import { Component, OnInit, ViewChild } from '@angular/core';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';

import { Subject } from "rxjs";
import * as wjcInput from '@grapecity/wijmo.input';

import { TranslateService } from "@ngx-translate/core";
import { takeUntil } from "rxjs/operators";
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { ListingService } from 'app/services/listing.service';
import { StateManagementService } from 'app/services/state-management.service';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { Participant } from 'app/models/participant';
import { AppConstants, AppUtility } from 'app/app.utility';

@Component({
    selector: 'app-order-limits',
    templateUrl: './order-limits.component.html',
    styleUrls: ['./order-limits.component.scss']
})
export class OrderLimitsComponent implements OnInit {

    orderLimits: wjcCore.CollectionView;
    participants: Partial<Participant>[] = [];
    participantId: number = null;
    exchangeCode : string = AppConstants.exchangeCode;
    modal = true;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
      @ViewChild('deleteDialog', { static: false }) deleteDialog: wjcInput.Popup;

    private _pageSize = 0;
    private readonly _destroy$ = new Subject<void>();
    riskId: Number = null;

    constructor(private readonly _splashService: FuseLoaderScreenService,
        private readonly _listingService: ListingService,
        private readonly _translate: TranslateService,
        private readonly _stateService: StateManagementService) {
    }

    ngOnInit(): void {
        this._initializeData();
        this.populateParticipants();
    }

    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        if (this._pageSize !== value) {
            this._pageSize = value;
            if (this.flexGrid) {
                (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
            }
        }
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    get isUserAdmin() {
        return AppConstants.userType === AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE || AppConstants.userType === AppConstants.USER_TYPE_MARLIN_ADMIN_CODE;
    }

    onRefresh(showEmptyMsg = false): void {
        this._fetchOrderLimits(this.participantId, showEmptyMsg);
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------------- Private Methods ---------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _fetchOrderLimits(participantId: number, showEmptyMsg = false) {
        const exchangeId = AppConstants.exchangeId;
        if (!exchangeId || !participantId) return;

        this._splashService.show();

        this._listingService.getOrderLimits(exchangeId, participantId).pipe(takeUntil(this._destroy$)).subscribe({
            next: (orderLimits) => {
                if (AppUtility.isValidVariable(orderLimits)) {
                    this.orderLimits = new wjcCore.CollectionView(orderLimits);
                } else {
                    this.orderLimits = new wjcCore.CollectionView([]);
                    if (showEmptyMsg) this._showErrorMessage('No data found');
                }
                this._splashService.hide();
            },
            error: (err) => {
                this._showErrorMessage(err);
                this._splashService.hide();
            }
        });
    }

    private _initializeData() {
        const lang = localStorage.getItem("lang") ?? 'en';
        this._translate.use(lang);
    }
 




    private populateParticipants() {
        this._listingService.getParticipantListByExchagne(AppConstants.exchangeId).subscribe(restData => {

            if (AppUtility.isEmpty(restData)) {
                this.participants = [];
            } else {
                this.participants = restData;
                if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                    setTimeout(() => {
                        this.participantId = AppConstants.participantId;
                        this._fetchOrderLimits(this.participantId);
                    }, 500);
                
                } else {
                    let participant: Participant = new Participant();
                    participant.participantId = AppConstants.PLEASE_SELECT_VAL;
                    participant.participantCode = AppConstants.PLEASE_SELECT_STR;
                    this.participants.unshift(participant);
                    this.participantId = null;
                }
            }
        },
            error => {
                  
            });
    }




    public deleteOrdersLimits() {
        this._splashService.show();
        this._listingService.deleteOrderLimits(this.riskId ,AppConstants.exchangeId, AppConstants.participantId).subscribe(restData => {
                 if(AppUtility.isValidVariable(restData)){
                    this._splashService.hide();
                    this.onRefresh();
                    this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_DELETED;
                    this.dialogCmp.showAlartDialog('Success');
                 }
        },
            error => {
                this._splashService.hide();
                if(error.message){
                    this.dialogCmp.statusMsg = error.message;
                }else{
                    this.dialogCmp.statusMsg = error;
                }
               
                this.dialogCmp.showAlartDialog('Error');
            });
    }





 showDeleteDialog = () => {
    let selectedDetailItem = (JSON.parse(JSON.stringify(this.orderLimits.currentItem)));
    this.riskId = selectedDetailItem.riskParamId;
    this.showDialog(this.deleteDialog);
 }



  showDialog(dlg: wjcInput.Popup) {
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
  };




    private _showErrorMessage(err: string) {
        this._splashService.hide();
        this.dialogCmp.statusMsg = err;
        this.dialogCmp.showAlartDialog('Error');
    }

}
