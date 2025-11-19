
'use strict';
import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { IPagedCollectionView, } from '@grapecity/wijmo';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { WelcomeMg } from 'app/models/welcomeMsgBo';

declare var jQuery: any;

@Component({

    selector: 'welcome-note-setup',
    templateUrl: './welcome-note-setup.html',
})
export class WelcomeNoteSetupComponent implements OnInit {
    public myForm: FormGroup;

    itemsList: wjcCore.CollectionView;
    errorMessage: string;


    public isSubmitted: boolean;
    public isEditing: boolean;

    private _pageSize = 0;

    @ViewChild('flex') flex: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    lang: string;
    participantId: number;
    selectedItem: WelcomeMg
    selectedIndex: number;
    tagsList: any[];
    selectedTag: any

    constructor(private appState: AppState, private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2, private translate: TranslateService, private loader: FuseLoaderScreenService) {
        this.isSubmitted = false;
        this.isEditing = false;
        this.itemsList = new wjcCore.CollectionView();
        this.participantId = AppConstants.participantId
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________

    }

    ngOnInit() {
        this.clearFields();
        this.addFromValidations();
        this.getWelcomeMsgsByParticipant();
        this.getAllTags();
        // this.customTags();
    }

    ngAfterViewInit() {
    }

    /*********************************
   *      Public & Action Methods
   *********************************/


    public clearFields() {
        if (AppUtility.isValidVariable(this.myForm)) {
            this.myForm.markAsPristine();
        }
        if (AppUtility.isValidVariable(this.itemsList)) {
            this.itemsList.cancelEdit();
            this.itemsList.cancelNew();
        }
        this.selectedItem = new WelcomeMg()

        this.participantId = AppConstants.participantId

        this.selectedIndex = 0;
        this.isSubmitted = false;
        this.isEditing = false;

        this.selectedTag = AppConstants.PLEASE_SELECT_VAL
    }

    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        if (this._pageSize != value) {
            this._pageSize = value;
            if (this.flex) {
                (<IPagedCollectionView><unknown>this.flex.collectionView).pageSize = value;
            }
        }
    }

    public onCancelAction() {
        this.clearFields();
    }
    public onNewAction() {
        this.clearFields();
    }

    public onEditAction() {
        if (!AppUtility.isEmpty(this.itemsList.currentItem)) {

            this.clearFields();
            this.isEditing = true;
            this.selectedIndex = this.flex.selection.row;
            // this.itemsList.editItem(this.itemsList.currentItem);
            // this.selectedItem = JSON.parse(JSON.stringify(this.flex.rows[this.selectedIndex].dataItem));
            this.selectedItem = this.itemsList.currentItem
        }
    }

    public onSaveAction(model: any, isValid: boolean) {

        this.myForm
        this.isSubmitted = true;

        if (isValid) {

            this.loader.show();
            if (this.isEditing) {

                this.selectedItem.participantId = this.participantId;
                this.listingService.updateWelcomeMsgsByPrticipant(this.selectedItem).subscribe(res => {
                    this.loader.hide();


                    this.flex.rows[this.selectedIndex].dataItem = this.selectedItem;
                    // this.itemsList.commitEdit();
                    // this.flex.invalidate();
                    this.getWelcomeMsgsByParticipant()
                    this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
                    this.dialogCmp.showAlartDialog('Success');
                    this.flex.refresh();

                }, error => {
                    this.loader.hide();
                    if (error.message) {
                        this.errorMessage = <any>error.message;
                    }
                    else {
                        this.errorMessage = <any>error;
                    }
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                })
            }
            else {
                this.selectedItem.participantId = this.participantId;

                if (this.lang == 'en') {
                    this.selectedItem.languageId = 1;
                }
                else if (this.lang == 'pt') {
                    this.selectedItem.languageId = 2;
                }

                this.listingService.saveWelcomeMsgsByPrticipant(this.selectedItem).subscribe(res => {
                    this.loader.hide();


                    this.itemsList.addNew(res)
                    this.itemsList.commitNew();
                    // this.itemsList.refresh();
                    AppUtility.moveSelectionToLastItem(this.itemsList);
                    this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                    this.dialogCmp.showAlartDialog('Success');

                }, error => {
                    this.loader.hide();
                    if (error.message) {
                        this.errorMessage = <any>error.message;
                    }
                    else {
                        this.errorMessage = <any>error;
                    }
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                })
            }
        }
    }


    /***************************************
   *          Private Methods
   **************************************/


    private addFromValidations() {
        this.myForm = this._fb.group({
            welcomeMsg: ['', Validators.compose([Validators.required])],
            active: ['', Validators.compose([Validators.required])],
            tag: ['']
        });
    }

    public hideModal() {
        jQuery('#add_new').modal('hide');   // hiding the modal on save/updating the record
    }

    public getNotification(btnClicked) {
        if (btnClicked == 'Success')
            this.hideModal();
    }

    public FinalSave() {
    }

    public getWelcomeMsgsByParticipant() {
        this.loader.show();
        this.listingService.getWelcomeMsgsByPrticipant(this.participantId).subscribe(res => {
            this.loader.hide();

            res.map(a => {
                if (a.languageId === AppConstants.LANGUAGE_ID_ENG) {
                    a.language = "English"
                }
                else if (a.languageId === AppConstants.LANGUAGE_ID_PT) {
                    a.language = "Portuguese"
                }
            })
            
            this.itemsList = new wjcCore.CollectionView(res);
        }, error => {
            this.loader.hide();
            if (error.message) {
                this.errorMessage = <any>error.message;
            }
            else {
                this.errorMessage = <any>error;
            }
            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');
        })
    }

    public getAllTags() {
        this.loader.show();
        this.listingService.getAllTags().subscribe(res => {
            this.loader.hide();

            if (AppUtility.isValidVariable(res)) {
                let val = { displayName: AppConstants.PLEASE_SELECT_STR, name: AppConstants.PLEASE_SELECT_VAL }
                this.tagsList = res;
                this.tagsList.unshift(val)
            }
        }, error => {
            this.loader.hide();
            if (error.message) {
                this.errorMessage = <any>error.message;
            }
            else {
                this.errorMessage = <any>error;
            }
            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');
        })
    }

    customTags() {
        this.tagsList = [
            { displayName: AppConstants.PLEASE_SELECT_STR, name: AppConstants.PLEASE_SELECT_VAL },
            { displayName: 'Account Type', name: '{{ACCOUNT_TYPE}}' },
            { displayName: 'Client Branch', name: '{{CLIENT_BRANCH}}' },
            { displayName: 'Client Code', name: '{{CLIENT_CODE}}' },
            { displayName: 'Client First Name', name: '{{CLIENT_FIRST_NAME}}' },
            { displayName: 'Participant Website', name: '{{PARTICIPANT_WEBSITE}}' },
            { displayName: 'Participant Phone-No', name: '{{PARTICIPANT_PHONE_NUMBER}}' },
            { displayName: 'Client Bank Account', name: '{{CLIENT_BANK_ACCOUNT_NUMBER}}' },
        ]
    }

    onTagChange() {
    }

    addTag() {
        if (this.selectedTag != null) {
            this.selectedItem.welcomeMsg = this.selectedItem.welcomeMsg + ' ' + this.selectedTag
        }
    }

}