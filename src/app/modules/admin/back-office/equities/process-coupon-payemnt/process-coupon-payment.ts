import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';
import { Selector } from '@grapecity/wijmo.grid.selector';



import { data } from 'autoprefixer';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Component, ViewChild, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AppConstants, AppUtility } from "app/app.utility";
import { ListingService } from "app/services/listing.service";

import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import { ComboItem } from 'app/models/combo-item';
import { DatePipe } from '@angular/common';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { FlexGrid, HeadersVisibility } from '@grapecity/wijmo.grid';

declare var jQuery: any;
@Component({
    selector: 'process-coupon-payment',
    templateUrl: './process-coupon-payment.html'
})
export class ProcessCouponPaymentComponent implements OnInit {

    scaleMode = gridPdf.ScaleMode.ActualSize;
    orientation = pdf.PdfPageOrientation.Landscape;
    exportMode = gridPdf.ExportMode.All;

    includeColumnHeader: boolean = true;

    dateFormat = AppConstants.DATE_FORMAT;
    fromDate: Date;
    toDate: Date;
    lang: any;
    symbol: any;
    symbolExchangeMktList: any[];
    clientList: any[];
    paymentTypeList: any[];
    errorMessage: string;
    exhangeId: number = 0;
    form: FormGroup;
    pdf: boolean;
    paymentType: any
    paymentStatus: any
    depoStatus: any
    paymentStatusList: any[];
    depoStatusList: any[];
    couponPaymentDetailList: wjcCore.CollectionView;
    selectedItems: any[] = [];
    isSubmitted = false

    @ViewChild('cmbSecurity') cmbSecurity: wjcInput.ComboBox;
    @ViewChild('cmbClient') cmbClient: wjcInput.AutoComplete;
    @ViewChild('cmbFromDate') cmbFromDate: wjcInput.InputDate;
    @ViewChild('cmbToDate') cmbToDate: wjcInput.InputDate;
    @ViewChild('cmbPaymentType') cmbPaymentType: wjcInput.ComboBox;
    @ViewChild('cmbPaymentStatus') cmbPaymentStatus: wjcInput.ComboBox;
    @ViewChild('cmbDepoStatus') cmbDepoStatus: wjcInput.ComboBox;

    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    isPaymentTypeSelectedAll: boolean = false
    selector: Selector = null;
    public checkedSelectedItem: any[] = [];
    postType: string;

    constructor(private translate: TranslateService, private listingService: ListingService, private loader: FuseLoaderScreenService,
        public _fb: FormBuilder, public datePipe: DatePipe) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________



    }

    ngOnInit(): void {
        this.init();
        this.loadSymbolMarketExchangeList();
        this.getClientList();
        this.generatePayemntTypes();
        this.generatePaymentStatus();
        this.generateDepoStatus();
        this.addFormValidations();
    }

    init() {
        this.symbol = null;
        this.isSubmitted = false
        this.couponPaymentDetailList = new wjcCore.CollectionView();
        this.symbolExchangeMktList = [];
        this.clientList = [];
        this.fromDate = new Date();
        this.toDate = new Date();
    }
    private _msg: string = '';
    private _selectedStatus: string = ''
    addFormValidations() {
        this.form = this._fb.group({
            security: ['', Validators.compose([Validators.required])],
            clientCode: ['', Validators.compose([Validators.required])],
            fromDate: ['', Validators.compose([Validators.required])],
            toDate: ['', Validators.compose([Validators.required])],
            paymentType: ['', Validators.compose([Validators.required])],
            paymentStatus: ['', Validators.compose([Validators.required])],
            depoStatus: ['', Validators.compose([Validators.required])],
        })
    }

    loadSymbolMarketExchangeList() {


        this.loader.show();
        this.listingService.getSecurityListByExchagne(AppConstants.exchangeId).subscribe(resData => {
            
            this.loader.hide();
            if (!AppUtility.isEmptyArray(resData)) {
                this.updateSecurityList(resData);
            } else {
                this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            }
        }, error => {
            this.loader.hide();
            if (error.message) {
                this.errorMessage = error.message;
            } else {
                this.errorMessage = error;
            }

            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');

        })
    }


    // onSecurityChange(security) {
    //     this.splitSymbolExchMkt(security);
    // }

    // splitSymbolExchMkt(security) {

    //     let strArr: any[];

    //     if (AppUtility.isValidVariable(security) && security !== AppConstants.ALL_VAL) {

    //         this.symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
    //     } else {
    //         this.symbol = AppConstants.ALL_VAL;
    //     }

    // }


    updateSecurityList(data) {

        if (AppUtility.isValidVariable(data)) {
            this.symbolExchangeMktList = data;
            for (let i = 0; i < data.length; ++i) {
                this.symbolExchangeMktList[i].value = this.symbolExchangeMktList[i].symbol;
                this.symbolExchangeMktList[i].displayName_ = this.symbolExchangeMktList[i].symbol;
            }
        }

        const cmbItem = { displayName_: AppConstants.ALL_STR, value: AppConstants.ALL_VAL };
        this.symbolExchangeMktList.unshift(cmbItem);
        this.symbol = this.symbolExchangeMktList[0].value;

    }

    getClientList() {
        this.loader.show();
        this.clientList = [];
        if (AppUtility.isValidVariable(AppConstants.participantId)) {
            this.listingService.getClientListByExchangeBroker(AppConstants.exchangeId, AppConstants.participantId, true, true).subscribe((resData) => {
                this.loader.hide();
                if (!AppUtility.isEmptyArray(resData)) {
                    this.clientList = resData;

                    if (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
                        let cmbItem = { displayValue_: AppConstants.ALL_STR, clientCode: AppConstants.ALL_VAL };
                        this.clientList.unshift(cmbItem);
                    }


                } else {
                    this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
            }, error => {
                this.loader.hide();
                if (error.message) {
                    this.errorMessage = error.message;
                } else {
                    this.errorMessage = error;
                }

                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            })

        }
    }




    getCouponPaymentDetailRefresh() {
        
        if (this.cmbPaymentType.selectedValue == AppConstants.ALL_VAL) {
            this.isPaymentTypeSelectedAll = true
            return
        }
        let value = {
            "security": this.cmbSecurity.selectedValue,
            "clientCode": this.cmbClient.selectedValue,
            "fromDate": this.cmbFromDate.value,
            "toDate": this.cmbToDate.value,
            "paymentType": this.cmbPaymentType.selectedValue,
            "paymentStatus": this.cmbPaymentStatus.selectedValue,
            "depoStatus": this.cmbDepoStatus.selectedValue

        };
        
        this.couponPaymentDetailList = new wjcCore.CollectionView();

        const fromDate = this.datePipe.transform(value.fromDate, 'yyyy-MM-dd');
        const toDate = this.datePipe.transform(value.toDate, 'yyyy-MM-dd');

        const couponPayload = {
            Date: toDate,
            toDate: toDate,
            fromDate: fromDate,
            Participant_Code: AppConstants.participantCode
        }
        
        if (this.cmbPaymentType.selectedValue === "BOND_MATURITY_PAYMENT" || this.cmbPaymentType.selectedValue === "BOND_COUPON_PAYMENT") {
            this.listingService.getCouponPaymentDetailNewRefresh(couponPayload).subscribe((resData) => {
                if (!AppUtility.isEmptyArray(resData)) {
                    this.filterCouponPaymentDetailList(resData, value);
                } else {
                    this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                    this.dialogCmp.showAlartDialog('Error');
                }
            }, error => {
                if (error.message) {
                    this.dialogCmp.statusMsg = error.message;
                } else {
                    this.dialogCmp.statusMsg = error;
                }
                this.dialogCmp.showAlartDialog('Error');
            })
        }
        else if (this.cmbPaymentType.selectedValue === "ZERO_COUPON_PAYMENT") {
            this.listingService.getRedemptionPaymentListNewRefresh(couponPayload).subscribe((resData) => {
                if (!AppUtility.isEmptyArray(resData)) {
                    this.filterCouponPaymentDetailList(resData, value);
                } else {
                    this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                    this.dialogCmp.showAlartDialog('Error');
                }
            }, error => {
                if (error.message) {
                    this.dialogCmp.statusMsg = error.message;
                } else {
                    this.dialogCmp.statusMsg = error;
                }
                this.dialogCmp.showAlartDialog('Error');
            })
        }



    }


    getCouponPaymentDetail(value, isValid) {
        
        this.isSubmitted = true
        this.couponPaymentDetailList = new wjcCore.CollectionView();
        // const date = value.toDate.toLocaleDateString();
        const fromDate = this.datePipe.transform(value.fromDate, 'yyyy-MM-dd');
        const toDate = this.datePipe.transform(value.toDate, 'yyyy-MM-dd');
        if (isValid) {
            const couponPayload = {
                fromDate: fromDate,
                toDate: toDate,
                Participant_Code: AppConstants.participantCode
            }
            this.listingService.getCouponPaymentDetailNew(couponPayload).subscribe((resData) => {
                if (!AppUtility.isEmptyArray(resData)) {
                    this.filterCouponPaymentDetailList(resData, value);
                } else {
                    this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                    this.dialogCmp.showAlartDialog('Error');
                }
            }, error => {
                if (error.message) {
                    this.dialogCmp.statusMsg = error.message;
                } else {
                    this.dialogCmp.statusMsg = error;
                }
                this.dialogCmp.showAlartDialog('Error');
            })
        }
    }


    filterCouponPaymentDetailList(data, selectedValues) {
        data.map(a => {
            if (a.clientPaymentStatus == null) {
                a.clientPaymentStatus = 'N'
            }
            if (a.depoPaymentStatus == null) {
                a.depoPaymentStatus = 'N'
            }
        })
        this.couponPaymentDetailList = new wjcCore.CollectionView();
        if (AppUtility.isValidVariable(data)) {

            // Case 1..................................................................................................
            if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }

            // Case 2..................................................................................................
            if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 3..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.paymentType === element.type && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 4..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 5..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 6..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.paymentType === element.type && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 7..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 8..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 9..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 10..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 11..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }

            // Case 12..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.paymentStatus === element.clientPaymentStatus) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }

            // Case 13..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }

            // Case 14..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }

            // Case 15..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.pushElement(element);
                        }
                    }
                });
            }
            // Case 16..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL && selectedValues.paymentStatus === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                        this.pushElement(element);
                    }
                });
            }


            this.couponPaymentDetailList.items.map(res => {
                res.is_processed = ((res.clientPaymentStatus == "Y") ? true : false);
                // res.depoPaymentStatusString = ((res.depoPaymentStatus == "Y") ? AppConstants.YES_STRING : AppConstants.NO_STRING);
                // res.clientPaymentStatusStr = ((res.clientPaymentStatus == "Y") ? AppConstants.YES_STRING : AppConstants.NO_STRING);
                res.depoPaymentStatusString = ((res.depoPaymentStatus == "Y") ? AppConstants.COMPLETED_STRING : (res.depoPaymentStatus == "A") ? AppConstants.ACKNOWLEDGED_STRING : AppConstants.PENDING_STRING);
                res.clientPaymentStatusStr = ((res.clientPaymentStatus == "Y") ? AppConstants.PROCESSED_STRING : AppConstants.UNPROCESSED_STRING);
                if (res.type == "BOND_COUPON_PAYMENT") {
                    res.typeStr = 'Coupon Payment'
                }
                else if (res.type == "ZERO_COUPON_PAYMENT") {
                    res.typeStr = 'Redemption Payment'
                }
                else if (res.type == "BOND_MATURITY_PAYMENT") {
                    res.typeStr = 'Maturity Payment'
                }
            })



            if (AppUtility.isEmptyArray(this.couponPaymentDetailList.items)) {
                this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                this.dialogCmp.showAlartDialog('Error');
                return;
            }


        }
    }

    pushElement(element) {
        if (element.depoPaymentStatus === this.depoStatus) {
            this.couponPaymentDetailList.items.push(element);
        }
    }

    generatePayemntTypes() {
        this.paymentTypeList = [
            { key: AppConstants.ALL_VAL, value: AppConstants.ALL_STR },
            { key: 'BOND_COUPON_PAYMENT', value: 'Coupon Payment' },
            { key: 'ZERO_COUPON_PAYMENT', value: 'Redemption Payment' },
            { key: 'BOND_MATURITY_PAYMENT', value: 'Maturity Payment' }
        ]

        this.paymentType = this.paymentTypeList[0].key
    }

    generatePaymentStatus() {
        this.paymentStatusList = [
            { key: AppConstants.PLEASE_SELECT_VAL, value: AppConstants.PLEASE_SELECT_STR },
            { key: 'Y', value: AppConstants.IS_PROCESSED_STR },
            { key: 'N', value: AppConstants.IS_UN_PROCESSED_STR },
        ]

        this.paymentStatus = this.paymentStatusList[0].key
    }

    generateDepoStatus() {
        this.depoStatusList = [
            { key: AppConstants.PLEASE_SELECT_VAL, value: AppConstants.PLEASE_SELECT_STR },
            { key: 'Y', value: AppConstants.COMPLETED_STRING },
            { key: 'N', value: AppConstants.PENDING_STRING },
            { key: 'A', value: AppConstants.ACKNOWLEDGED_STRING }
        ]
        this.depoStatus = this.depoStatusList[0].key;
    }







    public onPostAction(type: string) {
        
        if (type === 'P') {
            this.postType = type
            let findSome = this.checkedSelectedItem.some(res => (res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "N");


            if (this.couponPaymentDetailList.itemCount < 1) {
                this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                this.flexGrid.refresh();
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            }
            else if (!findSome) {
                if (this.checkedSelectedItem.some(res => res.depoPaymentStatus === "N" && res.clientPaymentStatus == "N")) {
                    this.errorMessage = AppConstants.RECORD_WITH_ACTIVE_DEPO_STATUS_REQUIRED;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
                else if (this.checkedSelectedItem.some(res => (res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "Y")) {
                    this.errorMessage = AppConstants.RECORD_IS_ALREADY_PROCESSED;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
                else {
                    this.errorMessage = AppConstants.MSG_NO_ACTION_HAS_TAKEN;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }

            }
            else {
                
                var confirmStr;
                this._msg = AppConstants.MSG_RECORD_PROCESSED;
                this.dialogCmp.statusMsg = AppConstants.MSG_CONFIRM_PROCESS_ALL_RECORD;
                if (this.lang == 'pt') { this.dialogCmp.statusMsg = "Tem certeza que deseja postar os registros selecionados?"; }
                this.dialogCmp.showAlartDialog('Confirmation');
            }
        }

        else if (type === 'R') {
            this.postType = type

            let findSome = this.checkedSelectedItem.some(res => (res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "Y");


            if (this.couponPaymentDetailList.itemCount < 1) {
                this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                this.flexGrid.refresh();
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            }
            else if (!findSome) {
                if (this.checkedSelectedItem.some(res => res.depoPaymentStatus === "N" && res.clientPaymentStatus == "Y")) {
                    this.errorMessage = AppConstants.RECORD_WITH_ACTIVE_DEPO_STATUS_REQUIRED;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
                else if (this.checkedSelectedItem.some(res => (res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "N")) {
                    this.errorMessage = AppConstants.RECORD_IS_NOT_PROCESSED;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }
                else {
                    this.errorMessage = AppConstants.MSG_NO_ACTION_HAS_TAKEN;
                    this.dialogCmp.statusMsg = this.errorMessage;
                    this.dialogCmp.showAlartDialog('Error');
                }

            }
            else {
                
                var confirmStr;
                this._msg = AppConstants.MSG_RECORD_REVERSED;
                this.dialogCmp.statusMsg = AppConstants.MSG_CONFIRM_REVERSE_RECORD;
                if (this.lang == 'pt') { this.dialogCmp.statusMsg = "Tem certeza que deseja reverter os registros selecionados?"; }
                this.dialogCmp.showAlartDialog('Confirmation');
            }
        }

    }

    public onConfirmationYes(btnClicked) {
        
        if (btnClicked == 'Success')
            this.hideModal();

        else if (btnClicked == 'Yes') {
            if (this.postType === 'P') {
                var couponBOList = [];
                this.checkedSelectedItem.map(res => {
                    if ((res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "N") {
                        res.clientPaymentStatus = "Y"
                        couponBOList.push(res)
                    }
                })

                console.log(couponBOList)

                this.loader.show();
                this.listingService.generateCouponPayment(couponBOList).subscribe(
                    data => {
                        this.loader.hide();
                        console.log("update>>>>>" + data);
                        this.dialogCmp.statusMsg = this._msg;
                        this.dialogCmp.showAlartDialog('Success');
                        this.flexGrid.refresh();

                    },
                    error => {
                        if (error.message) {
                            this.errorMessage = error.message;
                        }
                        else {
                            this.errorMessage = error;
                        }
                        this.checkedSelectedItem.map(res => {
                            if ((res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "Y") {
                                res.clientPaymentStatus = "N"
                            }
                        })
                        this.loader.hide();
                        this.dialogCmp.statusMsg = this.errorMessage;
                        this.dialogCmp.showAlartDialog('Error');
                    }
                );
            }

            else if (this.postType === 'R') {
                var reverseRecList = [];
                this.checkedSelectedItem.map(res => {
                    if ((res.depoPaymentStatus === "Y" || res.depoPaymentStatus === "A") && res.clientPaymentStatus == "Y") {
                        reverseRecList.push(res)
                    }
                })

                this.loader.show();
                this.listingService.reverseCouponPayment(reverseRecList).subscribe(
                    data => {
                        this.loader.hide();
                        console.log("update>>>>>" + data);
                        this.dialogCmp.statusMsg = this._msg;
                        this.dialogCmp.showAlartDialog('Success');
                        this.flexGrid.refresh();

                    },
                    error => {
                        if (error.message) {
                            this.errorMessage = error.message;
                        }
                        else {
                            this.errorMessage = error;
                        }
                        
                        this.loader.hide();
                        this.dialogCmp.statusMsg = this.errorMessage;
                        this.dialogCmp.showAlartDialog('Error');
                    }
                );
            }

        }
    }

    public hideModal() {
        jQuery("#add_new").modal("hide");   //hiding the modal on save/updating the record
    }

    onPaymentTypeChange(event) {
        if (this.isPaymentTypeSelectedAll) {
            this.isPaymentTypeSelectedAll = false
        }
    }





    initGridMain(grid: FlexGrid) {
        this.selector = new Selector(grid, {
            itemChecked: () => {
                this.checkedSelectedItem = [];
                this.selectedItems = grid.rows.filter(r => r.isSelected);

                // (this.selectedItems).forEach(element => {
                //      element._data.is_processed = true;
                // })
                
                this.selectedItems.forEach(element => {
                    this.checkedSelectedItem.push(element._data);
                    
                })
            }
        });
    }









}