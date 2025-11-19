'use strict';
import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';

import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';




declare var jQuery: any;

@Component({

    selector: 'subscription-report',
    templateUrl: './subscription-report.html',

    encapsulation: ViewEncapsulation.None,
})

export class SubscriptionReport implements OnInit {
    public showLoader: boolean = false;

    public myForm: FormGroup;

    subscriptionList: wjcCore.CollectionView;
    errorMessage: string;

    public static searchButtonEnabled = 'btn btn-success btn-sm'
    public static searchButtonDisabled = 'btn btn-success btn-sm disabled'
    public hideForm = false;
    public buttonClass = SubscriptionReport.searchButtonEnabled;
    exchangesList: any[];
    private _pageSize = 0;
    lang: any
    fromDate: Date = new Date();
    toDate: Date = new Date();
    subscriptionTypeList: any[];
    participantList: any[];
    participantId: number = null;
    subscriptionId: any
    isSubmitted = false;

    dateFormat = AppConstants.DATE_FORMAT;
    @ViewChild('subscriptionGrid') subscriptionGrid: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    isDisabled: boolean = false;
    message: string;


    constructor(private appState: AppState, private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2,
        private translate: TranslateService, private loader: FuseLoaderScreenService) {
        this.clearFields();
        this.hideForm = false;
        //this.claims = authService.claims;
        this.subscriptionList = new wjcCore.CollectionView();

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        if (this.lang == 'pt') {
            AppConstants.PLEASE_SELECT_STR = "Selecione";
        }
        //______________________________for ng2translate__________________________________________


    }


    ngOnInit() {
        // Add Form Validations
        this.addFromValidations();
        this.getParticipantList();
        this.getSubscriptionTypes();



    }

    /*********************************
   *      Public & Action Methods
   *********************************/
    public clearFields() {
        if (AppUtility.isValidVariable(this.myForm)) {
            this.myForm.markAsPristine();
        }
        this.hideForm = false;
    }

    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        if (this._pageSize != value) {
            this._pageSize = value;
            if (this.subscriptionGrid) {
                (<wjcCore.IPagedCollectionView>this.subscriptionGrid.collectionView).pageSize = value;
            }
        }
    }

    public hideModal() {
        jQuery("#add_new").modal("hide");   //hiding the modal on save/updating the record
    }

    /***************************************
   *          Private Methods
   **************************************/


    private addFromValidations() {
        this.myForm = this._fb.group({
            participantId: ['', Validators.compose([Validators.required])],
            subscriptionType: ['', Validators.compose([Validators.required])],
            fromDate: ['', Validators.compose([Validators.required])],
            toDate: ['', Validators.compose([Validators.required])]
        });
    }

    getParticipantList() {
        this.loader.show();
        this.listingService.getAllParticipants().subscribe(res => {
            this.loader.hide();
            res.map(a => {
                if (a.participantCode == null)
                    a.participantCode = "No Name Found";
            })
            let slc = {
                'participantCode': AppConstants.PLEASE_SELECT_STR,
                'participantId': AppConstants.PLEASE_SELECT_VAL
            }
            let all = {
                'participantCode': AppConstants.ALL_STR,
                'participantId': AppConstants.ALL_VAL
            }
            res.unshift(all);
            res.unshift(slc);
            this.participantList = res

            if (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
                this.participantId = AppConstants.participantId
                this.isDisabled = true;
            }
            else if (AppConstants.userType === AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                this.isDisabled = false;
            }
        }, error => {
            this.loader.hide();
        })
    }

    getSubscriptionTypes() {

        this.loader.show();
        this.listingService.getSubsriptionsType().subscribe(res => {
            this.loader.hide();

            let all = {
                'name': AppConstants.ALL_STR,
                'subscriptionId': AppConstants.ALL_VAL
            }
            res.unshift(all);
            this.subscriptionTypeList = res;
            this.subscriptionId = this.subscriptionTypeList[0].subscriptionId;
        }, error => {
            this.loader.hide();
        })
    }

    onSearch(model: any, isValid: boolean) {
        this.isSubmitted = true
        if (isValid) {

            this.loader.show();
            let data = {
                participantId: model.participantId,
                subscriptionTypeId: model.subscriptionType,
                fromDate: AppUtility.formatDate_YYYY_MM_DD(model.fromDate),
                toDate: AppUtility.formatDate_YYYY_MM_DD(model.toDate)
            }
            this.listingService.getSubscriptionReport(data.participantId, data.subscriptionTypeId, data.fromDate, data.toDate).subscribe(res => {
                this.loader.hide();
                if (res == null) {
                    this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                    this.dialogCmp.showAlartDialog('Error');
                }
                this.subscriptionList = new wjcCore.CollectionView(res);
            }, err => {
                this.loader.hide();
                if (err.message) {
                    this.errorMessage = err.message;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
                else {
                    this.errorMessage = err;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
            })


        }
    }

    public getNotification(btnClicked) {

    }
}