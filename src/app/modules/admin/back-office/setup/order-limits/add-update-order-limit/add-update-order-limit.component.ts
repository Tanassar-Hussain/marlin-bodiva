import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
 
import {Subject} from "rxjs";
 
 
 
 
 
 
import {takeUntil} from "rxjs/operators";
 
import { DialogCmp } from '../../../user-site/dialog/dialog.component';
import { Client } from 'app/models/client';
import { StateManagementService } from 'app/services/state-management.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Participant } from 'app/models/participant';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { ListingService } from 'app/services/listing.service';
import { OrderLimit } from 'app/models/order-limit.model';
import { TranslateService } from '@ngx-translate/core';
import * as wjcInput from '@grapecity/wijmo.input';
declare var jQuery: any;

@Component({
    selector: 'app-add-update-order-limit',
    templateUrl: './add-update-order-limit.component.html',
    styleUrls: ['./add-update-order-limit.component.scss']
})
export class AddUpdateOrderLimitComponent implements OnInit, OnDestroy {

    @Input() modalId = 'add-update-order-limit';
    @Output() refresh = new EventEmitter<boolean>();

    myForm: FormGroup;
    isEditable: boolean = false;
    isSubmitted: boolean = false;
    selectedItem = new OrderLimit();
    limitType: 'D' | 'C' = 'D';

    private prevParticipantId: number = null;
    private prevLimitType: 'D' | 'C' = 'D';

    // Dropdown Options
    limitTypes: any[] = [];
    selectedClients: any[] = [];
 
    participants: Partial<Participant>[] = [];
    clientList: any[] = [];

    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    @ViewChild('client') client: wjcInput.MultiSelect;
    private readonly _destroy$ = new Subject<void>();
    private clientId: number = null;
    selectPlaceHolder: any;

    constructor(private readonly _listingService: ListingService,
                private readonly _fb: FormBuilder,
                private readonly _splashService: FuseLoaderScreenService,
                private readonly _stateService: StateManagementService,
                private readonly _cd: ChangeDetectorRef,
                private readonly _translate : TranslateService) {
    }

    ngOnInit(): void {
        this._initializeForm();
        this._initializeData();
        this.getTranslation();
      //  this._initializeParticipants();
      this.populateParticipants();
    }

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
    }

    showModal(data: any, isEditable: boolean): void {
        this._clearFields();

        if (isEditable){
            this.isEditable = true;
            this._fillJsonToForm(this.selectedItem, data);
        }

        const modalSelector = jQuery(`#${this.modalId}`);
        modalSelector.modal({backdrop: 'static', keyboard: true});
        modalSelector.modal('show');
    }

    onClose(): void {
        jQuery(`#${this.modalId}`).modal('hide');
    }

    getNotification(event: any) {
        if (event == 'Success') {
            this.refresh.emit(true);
            this.onClose();
        }
    }

    get isUserAdmin(){
        return AppConstants.userType === AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE || AppConstants.userType === AppConstants.USER_TYPE_MARLIN_ADMIN_CODE;
    }

    onParticipantChangeEvent(id: number){
        if (AppUtility.isEmpty(id)) return;
        this.selectedItem.participantCode = this.participants.find(participant => participant.participantId === id)?.participantCode as string;
        if (this.limitType === 'C') this._fetchClients(id as number);
    }

    onClientChangeEvent(id: number){
        if (AppUtility.isEmpty(id)) return;
        if (this.clientList.length) this.selectedItem.clientCode = this.clientList.find(client => client.clientId === id)?.clientCode;
    }

    onLimitTypeChangeEvent(type: 'D' | 'C'): void {
        if (!type) return;

        const clientControl = this.myForm.controls['client'];

        if (type === 'D') {
            clientControl.clearValidators();
            this.selectedItem.clientId = null;
            this.selectedItem.clientCode = null;
        } else {
            this._fetchClients(this.selectedItem.participantId);
            clientControl.setValidators([Validators.required]);
        }

        clientControl.updateValueAndValidity();
    }

    onSubmit(){
        this.isSubmitted = true;
        if (this.myForm.valid){  
            this.selectedItem.orderLimitType = this.limitType;    
            this._splashService.show();
            if (!this.isEditable) {
                this._saveOrderLimit(this.selectedItem);
            }else {
                this._updateOrderLimit(this.selectedItem);
            }
        }
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------------- Private Methods ---------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeData(): void {
        this.limitTypes = [
            {
                label: 'Default',
                value: 'D',
            },
            {
                label: 'Client Wise',
                value: 'C',
            },
        ];

        
    }

    private _initializeForm(){
        this.myForm = this._fb.group({
            type: ['', Validators.compose([Validators.required])],
            participant: ['', Validators.compose([Validators.required])],
            client: [''],
            buyLimit: ['', Validators.compose([
                Validators.required,
                Validators.min(1),
                Validators.max(9999999999999999),
                Validators.maxLength(16)
            ])],
            sellLimit: ['', Validators.compose([
                Validators.required,
                Validators.min(1),
                Validators.max(9999999999999999),
                Validators.maxLength(16)
            ])],
            // negBuyLimit: ['', Validators.compose([
            //     Validators.required,
            //     Validators.min(1),
            //     Validators.max(9999999999999999),
            //     Validators.maxLength(16)
            // ])],
            // negSellLimit: ['', Validators.compose([
            //     Validators.required,
            //     Validators.min(1),
            //     Validators.max(9999999999999999),
            //     Validators.maxLength(16)
            // ])],
            
            applicable: ['', Validators.compose([Validators.required])],
            byPass: ['', Validators.compose([Validators.required])],
        });
    }

    private _saveOrderLimit(orderLimit: OrderLimit){
        this._listingService.saveOrderLimit(orderLimit).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this._splashService.hide();
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                this.dialogCmp.showAlartDialog('Success');
            },
            error: (err: any) => {
                this._splashService.hide();
                this._showErrorMessage(err);
            }
        })
    }

    private _updateOrderLimit(orderLimit: OrderLimit){
        this._listingService.updateOrderLimit(orderLimit).pipe(takeUntil(this._destroy$)).subscribe({
            next: () => {
                this._splashService.hide();
                this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
                this.dialogCmp.showAlartDialog('Success');
            },
            error: (err: any) => {
                this._splashService.hide();
                
                this._showErrorMessage(err);
            }
        })
    }

    private _fetchClients(participantId: number, ignoreChecks = false){
         
        const exchangeId = AppConstants.exchangeId;
        if (!exchangeId || !participantId) return;

        if (!ignoreChecks){
            if (participantId === this.prevParticipantId && this.limitType === this.prevLimitType) {
                return;
            }
        }

        this.prevParticipantId = participantId;
        this.prevLimitType = this.limitType;

        this._splashService.show();
        this._listingService.getClientListByExchangeBroker(exchangeId, participantId, true, true).pipe(takeUntil(this._destroy$)).subscribe({
            next: (clients) => {
                this._splashService.hide();
                if (!AppUtility.isEmpty(clients)) {

                    this.clientList = clients as Client[];
                    // let c: Client = new Client();
                    // c.clientId = AppConstants.PLEASE_SELECT_VAL;
                    // c.clientCode = AppConstants.PLEASE_SELECT_STR;
                    // this.clientList.unshift(c);

                    if ( this.clientId) {
                        this.selectedItem.clientId = this.clientId;
                        this._cd.detectChanges();
                    }

                }else {
                    this.clientList = [];
                }
            }, error: (err) => {
                this._showErrorMessage(err);
            }
        })
    }

    private _initializeParticipants() {
        this._stateService.participants$.subscribe((participants: Participant[]) => {
            this.participants = JSON.parse(JSON.stringify(participants));

            if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                this.selectedItem.participantId = AppConstants.participantId;
            } else {
                let participant: Participant = new Participant();
                participant.participantId = AppConstants.PLEASE_SELECT_VAL;
                participant.participantCode = AppConstants.PLEASE_SELECT_STR;
                this.participants.unshift(participant);
                this.selectedItem.participantId = null;
            }
        });
    }





    private populateParticipants() {
        this._listingService.getParticipantListByExchagne(AppConstants.exchangeId).subscribe(restData => {

            if (AppUtility.isEmpty(restData)) {
                this.participants = [];
            } else {
                this.participants = restData;
                if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                    setTimeout(() => {
                        this.selectedItem.participantId = AppConstants.participantId;
                        
                    }, 500);
                
                } else {
                    let participant: Participant = new Participant();
                    participant.participantId = AppConstants.PLEASE_SELECT_VAL;
                    participant.participantCode = AppConstants.PLEASE_SELECT_STR;
                    this.participants.unshift(participant);
                    this.selectedItem.participantId = null;
                }
            }


        },
            error => {

            });
    }







    private _clearFields(){
        this.myForm.markAsPristine();
        this.selectedItem = new OrderLimit();
        this.selectedItem.exchangeId = AppConstants.exchangeId;
        this.selectedItem.exchangeCode = AppConstants.exchangeCode;
      
        this.limitType = 'D';
        this.selectedItem.applicable = 'D';
        this.selectedItem.participantId = this.isUserAdmin ? null : AppConstants.participantId;
        this.isSubmitted = false;
        this.isEditable = false;
        this.clientId = null;
        if (this.isUserAdmin){
            this.prevParticipantId = null;
            this.prevLimitType = 'D';
            this.clientList = [];
        }
        this.selectedClients = null;
    }

    private _fillJsonToForm(ol: OrderLimit, data: any) {
        
        this.limitType = data.clientId ? 'C' : 'D';

        ol.riskParamId = data.riskParamId;
        ol.exchangeId = data.exchangeId;
        ol.exchangeCode = data.exchangeCode;
        ol.participantId = data.participantId;
        ol.participantCode = data.participantCode;
        this.clientId = data.clientId;
        ol.clientCode = data.clientCode;
      
        ol.applicable = data.applicable;
        ol.bypassLimit = data.bypassLimit;
        ol.normBuyLimit = data.normBuyLimit;
        ol.normSellLimit = data.normSellLimit;
        ol.negoBuyLimit = data.negoBuyLimit;
        ol.negoSellLimit = data.negoSellLimit;
        ol.creationDate = data.creationDate;
        ol.modifyDate = data.modifyDate;
        ol.userId = data.userId;

        if (this.limitType === 'C') this._fetchClients(data.participantId, true);

 



    }

    private _showErrorMessage(err: any) {
        this._splashService.hide();
        if(err.message){
            this.dialogCmp.statusMsg = err.message;
        }else{
            this.dialogCmp.statusMsg = err;
        }
       
        this.dialogCmp.showAlartDialog('Error');
    }



    public getTranslation=()=>{
        this._translate.get(['Translation.Select']).subscribe((res:any)=>{
           this.selectPlaceHolder = res['Translation.Select'];
        })
       } 
 
    





}
