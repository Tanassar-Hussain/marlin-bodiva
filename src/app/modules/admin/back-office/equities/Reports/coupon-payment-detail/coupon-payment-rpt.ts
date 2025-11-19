import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';




import { data } from 'autoprefixer';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AppUtility } from './../../../../../../app.utility';
import { Component, ViewChild, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AppConstants } from "app/app.utility";
import { ListingService } from "app/services/listing.service";
import { DialogCmp } from '../../../user-site/dialog/dialog.component';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import { ComboItem } from 'app/models/combo-item';

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { DatePipe } from '@angular/common';
pdfMake.vfs = pdfFonts.pdfMake.vfs;



@Component({
    selector: 'coupon-payment-detail-rpt',
    templateUrl: './coupon-payment-rpt.html'
})
export class CouponPaymentDetailRpt implements OnInit {

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
    errorMessage: string;
    exhangeId: number = 0;
    form: FormGroup;
    pdf: boolean;
    couponPaymentDetailList: any[];
    paymentTypeList: any[];
    paymentType: any
    isPaymentTypeSelectedAll: boolean = false

    @ViewChild('cmbSecurity') cmbSecurity: wjcInput.ComboBox;
    @ViewChild('cmbClient') cmbClient: wjcInput.AutoComplete;
    @ViewChild('cmbFromDate') cmbFromDate: wjcInput.InputDate;
    @ViewChild('cmbToDate') cmbToDate: wjcInput.InputDate;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('cmbPaymentType') cmbPaymentType: wjcInput.ComboBox;

    logoBase64: any = "";
    contentType: any = "";


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
        this.addFormValidations();
        this.getPaticipantsLogo();
    }

    init() {
        this.symbol = null;
        this.couponPaymentDetailList = [];
        this.symbolExchangeMktList = [];
        this.clientList = [];
        this.fromDate = new Date();
        this.toDate = new Date();
    }

    addFormValidations() {
        this.form = this._fb.group({
            security: ['', Validators.compose([Validators.required])],
            clientCode: ['', Validators.compose([Validators.required])],
            fromDate: ['', Validators.compose([Validators.required])],
            toDate: ['', Validators.compose([Validators.required])],
            paymentType: ['', Validators.compose([Validators.required])]
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
    //         strArr = AppUtility.isSplitSymbolMarketExchange(security);
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




    // getCouponPaymentDetailRefresh() {
    //     

    //     let value = {
    //         "security": this.cmbSecurity.selectedValue,
    //         "clientCode": this.cmbClient.selectedValue,
    //         "fromDate": this.cmbFromDate.value,
    //         "toDate": this.cmbToDate.value,
    //     };

    //     this.couponPaymentDetailList = [];

    //     const fromDate = this.datePipe.transform(value.fromDate, 'yyyy-MM-dd');
    //     const toDate = this.datePipe.transform(value.toDate, 'yyyy-MM-dd');

    //     const couponPayload = {
    //         Date: toDate,
    //         toDate: toDate,
    //         fromDate: fromDate,
    //         Participant_Code: AppConstants.participantCode
    //     }
    //     this.listingService.getCouponPaymentDetailNewRefresh(couponPayload).subscribe((resData) => {
    //         if (!AppUtility.isEmptyArray(resData)) {
    //             this.filterCouponPaymentDetailList(resData, value);
    //         } else {
    //             this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
    //             this.dialogCmp.showAlartDialog('Error');
    //         }
    //     }, error => {
    //         if (error.message) {
    //             this.dialogCmp.statusMsg = error.message;
    //         } else {
    //             this.dialogCmp.statusMsg = error;
    //         }
    //         this.dialogCmp.showAlartDialog('Error');
    //     })

    // }


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
            "paymentType": this.cmbPaymentType.selectedValue
        };

        this.couponPaymentDetailList = [];

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

        this.couponPaymentDetailList = [];
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
        this.couponPaymentDetailList = [];
        if (AppUtility.isValidVariable(data)) {

            // Case 1..................................................................................................
            if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }

            // Case 2..................................................................................................
            if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 3..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 4..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol && selectedValues.clientCode === element.accountCode) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 5..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType != AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.paymentType === element.type) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 6..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode != AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (selectedValues.clientCode === element.accountCode) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 7..................................................................................................
            else if (selectedValues.security != AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (this.symbol === element.symbol) {
                        if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                            this.couponPaymentDetailList.push(element);
                        }
                    }
                });
            }
            // Case 8..................................................................................................
            else if (selectedValues.security === AppConstants.ALL_VAL && selectedValues.clientCode === AppConstants.ALL_VAL && selectedValues.paymentType === AppConstants.ALL_VAL) {
                data.forEach(element => {
                    if (AppUtility.isValidVariable(element.accountCode) && element.accountCode !== "") {
                        this.couponPaymentDetailList.push(element);
                    }
                });
            }


            this.couponPaymentDetailList.map(res => {
                //  res.clientPaymentStatusStr = ((res.clientPaymentStatus == "Y") ? AppConstants.YES_STRING : AppConstants.NO_STRING);
                //  res.depoPaymentStatus = ((res.depoPaymentStatus == "Y") ? AppConstants.YES_STRING : AppConstants.NO_STRING);
                res.depoPaymentStatusStr = ((res.depoPaymentStatus == "Y") ? AppConstants.COMPLETED_STRING : (res.depoPaymentStatus == "A") ? AppConstants.ACKNOWLEDGED_STRING : AppConstants.PENDING_STRING);
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

            if (AppUtility.isEmptyArray(this.couponPaymentDetailList)) {
                this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
                this.dialogCmp.showAlartDialog('Error');
                return;
            }


        }
    }

    exportExcel() {
        wjcGridXlsx.FlexGridXlsxConverter.save(this.flexGrid, { includeColumnHeaders: this.includeColumnHeader, includeCellStyles: false }, 'Coupon Payment Detail.xlsx');
    }




    exportPDF() {
        gridPdf.FlexGridPdfConverter.export(this.flexGrid, 'Coupon Payment Detail' + new Date().toLocaleString() + '.pdf', {
            maxPages: 10,
            exportMode: this.exportMode,
            scaleMode: this.scaleMode,
            documentOptions: {
                pageSettings: {
                    layout: this.orientation
                },
                header: {
                    declarative: {
                        text: '\t&[Page]\\&[Pages]'
                    }
                },
                footer: {
                    declarative: {
                        text: '\t&[Page]\\&[Pages]'
                    }
                }
            },
            styles: {
                cellStyle: {
                    backgroundColor: '#ffffff',
                    borderColor: '#c6c6c6'
                },
                altCellStyle: {
                    backgroundColor: '#f9f9f9'
                },
                groupCellStyle: {
                    backgroundColor: '#dddddd'
                },
                headerCellStyle: {
                    backgroundColor: '#eaeaea'
                }
            }
        });
    }






    generatePDF() {
        const docDefinition = {
            pageOrientation: 'landscape',
            footer: function (currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; },
            content: [
                {
                    image: 'data:' + this.contentType + ';base64,' + this.logoBase64,
                    width: 60,
                    alignment: 'left'
                },
                { text: 'Coupon Payment Detail', style: 'header', alignment: 'center' },
                {
                    text: `Date: ${new Date().toLocaleString()}`,
                    alignment: 'right',
                    fontSize: 10,
                    margin: [0, 0, 0, 20]
                },


                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', "auto", 'auto', 'auto', 'auto', 'auto'],

                        body: [
                            [{ text: 'Due Date', style: 'tableHeader' }, { text: 'Account Code', style: 'tableHeader' }, { text: 'Symbol', style: 'tableHeader' }, { text: 'Volume', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader' }, { text: 'Rate', style: 'tableHeader' }, { text: 'Payment Type', style: 'tableHeader' }, { text: 'Tax %', style: 'tableHeader' }, { text: 'Tax Amount', style: 'tableHeader' }, { text: 'Net Amount', style: 'tableHeader' }, { text: 'Commission Amount', style: 'tableHeader' }, { text: 'Depo Status', style: 'tableHeader' }, { text: 'Payment Status', style: 'tableHeader' }],
                            ...this.couponPaymentDetailList.map(p => [{ text: p.dueDate, style: 'tableText' }, { text: p.accountCode, style: 'tableText' }, { text: p.symbol, style: 'tableText' }, { text: p.volume, style: 'tableText' }, { text: p.couponAmount, style: 'tableText' }, { text: p.couponRate, style: 'tableText' }, { text: p.type, style: 'tableText' }, { text: p.taxPercent, style: 'tableText' }, { text: p.tax, style: 'tableText' }, { text: p.netAmount, style: 'tableText' }, { text: p.commAmt, style: 'tableText' }, { text: p.depoPaymentStatusStr, style: 'tableText' }, { text: p.clientPaymentStatusStr, style: 'tableText' }])
                        ],

                    },
                    margin: [0, 20, 0, 10]
                },
            ],
            styles: {
                header: { fontSize: 16, bold: true, marginBottom: 5, marginTop: -40, alignment: 'center' },
                tableHeader: { bold: true, fontSize: 9 },
                tableText: { fontSize: 9 },

            },
        };

        pdfMake.createPdf(docDefinition).download('Coupon Payment Detail.pdf');

    }










    public getPaticipantsLogo = () => {
        this.listingService.getParticipantLogo(AppConstants.participantId).subscribe((res: any) => {

            if (AppUtility.isValidVariable(res)) {
                this.logoBase64 = res.logoBase64;
                this.contentType = res.contentType;
            }

        }, error => {
            if (error.message) {
                this.errorMessage = error.message;
            }
            else {
                this.errorMessage = error;
            }
        })
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

    onPaymentTypeChange(event) {
        if (this.isPaymentTypeSelectedAll) {
            this.isPaymentTypeSelectedAll = false
        }
    }


}