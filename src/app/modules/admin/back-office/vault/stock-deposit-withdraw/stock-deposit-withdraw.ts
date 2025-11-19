import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router"
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { BasicInfo } from 'app/models/basic-info';
import { ClientCustodian } from 'app/models/client-custodian';
import { Exchange } from 'app/models/exchange';
import { Participant } from 'app/models/participant';
import { Security } from 'app/models/security';
import { StockDepositWithdraw } from 'app/models/stock-deposit-withdraw';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';
import _ from 'lodash';
import { DialogCmp } from '../../user-site/dialog/dialog.component';
import { filter, takeUntil } from "rxjs/operators";

import { Selector } from '@grapecity/wijmo.grid.selector';
import { CollectionView, PropertyGroupDescription } from '@grapecity/wijmo';
import { FlexGrid, HeadersVisibility } from '@grapecity/wijmo.grid';
import { ComboItem } from 'app/models/combo-item';
import { temparray } from 'app/modules/admin/oms/charts/historical-payouts-chart/historical-payouts-chart';
import { OrderService } from 'app/services-oms/order-oms.service';

//import { Json, Date } from '@angular/core/src/facade/lang';
declare var jQuery: any;

@Component({
    selector: 'stock-deposit-withdraw',
    templateUrl: './stock-deposit-withdraw.html',
    encapsulation: ViewEncapsulation.None,
})
export class StockDepositWithdrawCmp implements OnInit {


    grouped = true;
    headers = true;
    selectedItems: any[] = [];
    selector: Selector = null;
    public checkedSelectedItem: any[] = [];

    public myForm: FormGroup;
    public searchForm: FormGroup;
    //claims: any;
    dateFormat: string = AppConstants.DATE_FORMAT;
    exchangeList: any[] = [];
    clientCustodianList: any[] = [];
    clientList: any[] = [];
    securityList: any[] = [];
    entryTypeList: any[] = [];
    statusList: any[] = [];

    custodianExist: boolean = false;
    custodianId: Number = null;

    isItemsListStatusNew: boolean = false;

    itemsList: wjcCore.CollectionView; participantExchangeId: any;
    Title: string;
    entryType: string;
    entryTypeListTemp: any[];
    entryTypeListSearch: any[];
    test: string;
    test1: string;
    isDeposit: boolean = false;
    isCustodian: boolean;
    isShowPrice: boolean = false;
    data: any;
    selectedItem: StockDepositWithdraw;
    exchangeId: number = 0;
    errorMessage: string;

    public statusDisabled: boolean = false;
    public hideForm = false;
    public isSubmitted: boolean;
    public isEditing: boolean;

    public quantityExceedsBalance: boolean = false;

    // search fields
    srchExchange: any;
    srchStatus: string;
    srchFromTransDate: Date;
    srchToTransDate: Date;
    srchEntryType: string;
    lang: any
    pdfSrc: String
    pdf = false
    fileNameForDownload = "StockDepositWithdrawComissionReport.pdf"
    public status: string = null;
    private _pageSize = 0;

    @ViewChild('flexGrid') flexGrid: wjcGrid.FlexGrid;
    @ViewChild('inputEntryType') inputEntryType: wjcInput.ComboBox;
    @ViewChild('inputSecurity') inputSecurity: wjcInput.ComboBox;
    @ViewChild('inputClient') inputClient: wjcInput.ComboBox;
    @ViewChild('exchangeId') cmbexchangeId: wjcInput.ComboBox;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    @ViewChild('transDate') transDate: wjcInput.InputDate;

    constructor(private appState: AppState, public userService: AuthService2, private listingService: ListingService,
        private _fb: FormBuilder, private _fb2: FormBuilder, private translate: TranslateService, private loader: FuseLoaderScreenService, public orderService : OrderService,
        private router: Router, private route: ActivatedRoute,) {

        this.hideForm = false;
        this.isSubmitted = false;
        this.isEditing = false;
        //this.claims = authService.claims;
        this.isCustodian = AppConstants.CUSTODIAN_MODEL;


        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________


        this.initForm();


    }

    ngOnInit() {


        // Add Form Validations

        this.addFromValidations();
        this.addSearchFromValidations();
        this.populateDataItems();
        this.loadexchangeList();

        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                if (event) this.settingAllData();
            });

    }

    ngAfterViewInit() {
        this.settingAllData();

        var self = this;
        $('#add_new').on('shown.bs.modal', function (e) {
            (<wjcCore.CollectionView>self.flexGrid.collectionView).editItem(self.flexGrid.collectionView.currentItem);
            self.cmbexchangeId.focus();
        });
    }

    /*********************************
   *      Public & Action Methods
   *********************************/
    settingAllData() {
        


        if (this.route.snapshot.params['d'] == "D") {

            this.isDeposit = true;
            this.entryTypeList = [];
            this.entryTypeListSearch = [];
            this.translate.get('Translation.Deposit / Withdrawal').subscribe((text: string) => { this.Title = text });
            this.entryTypeListTemp.forEach(element => {
                if (element.value === AppConstants.ENTRY_TYPE_DEPOSIT || element.value === AppConstants.ENTRY_TYPE_WITHDRAW || element.value === AppConstants.PLEASE_SELECT_VAL) {
                    this.entryTypeList.push(element);
                    this.entryTypeListSearch.push(element);
                }
            })
            let obj = new ComboItem(AppConstants.ALL_STR, null);
            this.entryTypeListSearch.unshift(obj);
            let obj1 = new ComboItem(AppConstants.PLEASE_SELECT_STR, null);
            this.entryTypeList.unshift(obj1);

            this.populateDataItems();
        }
        else if (this.route.snapshot.params['d'] == "P") {
            this.isDeposit = false;
            this.entryTypeList = [];
            this.entryTypeListSearch = [];
            this.translate.get('Translation.Pledge / Release').subscribe((text: string) => { this.Title = text });
            this.entryTypeListTemp.forEach(element => {
                if (element.value === AppConstants.ENTRY_TYPE_PLEDGE || element.value === AppConstants.ENTRY_TYPE_RELEASE || element.value === AppConstants.PLEASE_SELECT_VAL) {
                    this.entryTypeList.push(element);
                    this.entryTypeListSearch.push(element);
                }

            })
            let obj = new ComboItem(AppConstants.ALL_STR, null);
            this.entryTypeListSearch.unshift(obj);
            let obj1 = new ComboItem(AppConstants.PLEASE_SELECT_STR, null);
            this.entryTypeList.unshift(obj1);
            this.populateDataItems();
        }

    }

    initForm() {
        let objStockDepositWithdraw = new StockDepositWithdraw()
        this.data = [];
        this.itemsList = new wjcCore.CollectionView();
        this.securityList = [];
        this.clientList = [];
        this.srchFromTransDate = new Date();
        this.srchToTransDate = new Date();
        this.selectedItem = new StockDepositWithdraw();
        this.getStatusList();
        this.entryTypeListTemp = objStockDepositWithdraw.getEntryTypesList();

        //    this.srchExchange = (AppConstants.exchangeId === null) ? 0 : AppConstants.exchangeId;
        this.srchEntryType = null;

        if (this.lang === 'pt') {
            this.srchStatus = 'Nova';
        }
        else {
            this.srchStatus = 'New';
        }
        this.clearFields();
        this.populateDataItems();
    }
    public clearFields() {

        if (AppUtility.isValidVariable(this.myForm)) {
            this.myForm.markAsPristine();
        }
        if (AppUtility.isValidVariable(this.searchForm)) {
            this.searchForm.markAsPristine();
        }

        if (AppUtility.isValidVariable(this.itemsList)) {
            this.itemsList.cancelEdit();
            this.itemsList.cancelNew();
        }

        this.selectedItem = new StockDepositWithdraw();

        this.securityList = [];
        this.clientList = [];
        this.clientCustodianList = [];
        this.custodianExist = false;
        this.hideForm = false;
        this.isSubmitted = false;
        this.isEditing = false;
        this.quantityExceedsBalance = false;


    }

    get pageSize(): number {
        return this._pageSize;
    }
    set pageSize(value: number) {
        if (this._pageSize != value) {
            this._pageSize = value;
            if (this.flexGrid) {
                (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
            }
        }
    }




    public getStatusList = () => {
        
        this.statusList = [];
        let statusArray = [];
        this.translate.get(['Translation.New', 'Translation.Posted']).subscribe((res: any) => {
            statusArray.push(res['Translation.New']);
            statusArray.push(res['Translation.Posted']);
            let statusCmbList = [];
            let cmbItem: ComboItem;
            for (let i = 0; i < statusArray.length; i++) {
                cmbItem = new ComboItem(statusArray[i], statusArray[i]);
                statusCmbList[i] = cmbItem;
            }
            this.statusList = statusCmbList;
        })
    }



    public getEntryTypes = () => {
        

        this.entryTypeList = [];
        this.entryTypeListSearch = [];

        this.entryTypeListTemp = [];
        let entryArray = [];
        this.translate.get(['Translation.Deposit', 'Translation.Withdraw', 'Translation.Pledge', 'Translation.Release']).subscribe((res: any) => {
            entryArray.push(res['Translation.Deposit']);
            entryArray.push(res['Translation.Withdraw']);
            entryArray.push(res['Translation.Pledge']);
            entryArray.push(res['Translation.Release']);
            let typesValueArr = ['D', 'W', 'P', 'R'];
            let typesCmbList = [];
            let cmbItem: ComboItem;
            for (let i = 0; i < entryArray.length; i++) {
                cmbItem = new ComboItem(entryArray[i], typesValueArr[i]);
                typesCmbList[i] = cmbItem;
            }
            
            this.entryTypeListTemp = typesCmbList;




        })

    }







    initGridMain(grid: FlexGrid) {
        this.selector = new Selector(grid, {
            itemChecked: () => {
                this.checkedSelectedItem = [];
                this.selectedItems = grid.rows.filter(r => r.isSelected);
                
                this.selectedItems.forEach(element => {
                    this.checkedSelectedItem.push(element._data);
                    
                })
            }
        });
    }












    public onCancelAction() {
        (<wjcCore.CollectionView>this.flexGrid.collectionView).cancelEdit();
        this.hideForm = false;
        this.clearFields();
        this.hideModal();
    }

    public onNewAction() {
        (<wjcCore.CollectionView>this.flexGrid.collectionView).cancelEdit();
        this.clearFields();
        this.selectedItem = JSON.parse(JSON.stringify(new StockDepositWithdraw()));
        this.isEditing = false;
        this.selectedItem.exchange.exchangeId = (AppConstants.exchangeId === null) ? 0 : AppConstants.exchangeId;

    }

    public onEditAction() {
        this.clearFields();
        let rowIndex = this.flexGrid.selection.row;
        let item = JSON.parse(JSON.stringify(this.flexGrid.rows[rowIndex].dataItem));

        if (!AppUtility.isEmpty(item)) {
            this.hideForm = true;
            this.isEditing = true;

            this.selectedItem = JSON.parse(JSON.stringify(item));
            //this.fillFiscalYearFromSelectedItem(item);
            this.showModal();

        }
    }

    public showModal() {
        jQuery("#add_new").modal("show");
    }

    public hideModal() {
        jQuery("#add_new").modal("hide");   //hiding the modal on save/updating the record
    }

    public hideSearchModal() {
        jQuery("#filter_box").modal("hide");   //hiding the modal on save/updating the record
    }


    loadexchangeList(): void {

        this.loader.show();
        this.participantExchangeId = AppConstants.claims2.participant.exchangeId
        this.listingService.getParticipantExchangeList(AppConstants.participantId).subscribe(
            data => {
                this.loader.hide();
                if (data != null) {

                    this.exchangeList = data;
                    var exchange: Exchange = new Exchange(0, AppConstants.PLEASE_SELECT_STR);
                    this.exchangeList.unshift(exchange);
                    setTimeout(() => {
                        this.srchExchange = (AppConstants.exchangeId === null) ? 0 : AppConstants.exchangeId;
                    }, 150);
                }
            },
            error => { this.loader.hide(); this.errorMessage = <any>error });
    }



    getExchangeBrokerClients(exchangeId) {
        this.clientList = [];
        this.loader.show();
        this.listingService.getClientBasicInfoListByExchangeBroker(exchangeId, AppConstants.participantId, true)
            .subscribe(restData => {
                this.loader.hide();
                if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
                    this.clientList = restData;


                    let obj: BasicInfo = new BasicInfo();
                    obj.id = AppConstants.PLEASE_SELECT_VAL;
                    obj.code = AppConstants.PLEASE_SELECT_STR;
                    obj.displayName = AppConstants.PLEASE_SELECT_DISPLAYVALUE;
                    this.clientList.unshift(obj);

                }
            },
                error => this.errorMessage = <any>error);
    }

    public onSearchAction(model: any, isValid: boolean) {


        this.populateDataItems();
    }
    public onClientChange(selectedId) {
        
        this.selectedItem.client.clientId = selectedId;
        this.selectedItem.availableBalance = 0;
        if (AppUtility.isValidVariable(selectedId)) {
            this.populateClientCustodianList(selectedId);
            if(AppUtility.isValidVariable(this.selectedItem.security) && AppUtility.isValidVariable(this.selectedItem.security.securityId)){
                this.getSecurityBalanceByParticipant(this.selectedItem.security.securityId);
            }
           
        }
        else {
            if (!AppUtility.isEmpty(this.clientCustodianList))
                this.clientCustodianList = null;
            this.custodianExist = false;
        }
        this.selectedItem.security.securityId = AppConstants.PLEASE_SELECT_VAL
        this.entryType = null
        this.selectedItem.availableBalance = 0;
       
    }

    onTypeChange(type) {
        this.selectedItem.availableBalance = 0;
        if(AppUtility.isValidVariable(this.selectedItem.custodian)){
            this.custodianId = this.selectedItem.custodian.participantId;
        }
       
        if (type != 'R') {
            if (AppUtility.isValidVariable(this.custodianId) && !AppUtility.isEmpty(this.custodianId) && this.custodianId > 0) {
                this.getSecurityBalanceByCustodian(this.selectedItem.security.securityId);
            } else if (AppUtility.isValidVariable(this.selectedItem.security.securityId)) {
                this.getSecurityBalanceByParticipant(this.selectedItem.security.securityId);
            }
        }
        else{
            this.getClientSecurityPledgedBalance(type);
        }
           

        
        if(type === 'D' || type === 'W'){
                this.isShowPrice = true;
                this.isSubmitted = false;
                this.myForm.get('price').addValidators(Validators.required);
                this.myForm.get('price').addValidators(Validators.pattern(AppConstants.validatePatternNonZeroNumeric));
        }    
        else{
                this.isSubmitted = false;
                this.isShowPrice = false;
                this.myForm.get('price').clearValidators();
                this.myForm.get('price').updateValueAndValidity();
                 
        }


    }

    public onSecurityChange(securityId) {
        //commented by Usama Attique because of bug id 772 in which type and balance has to be clear on symbol change reported by Khwaja Qasim

        // if (AppUtility.isValidVariable(securityId) && !AppUtility.isEmpty(securityId)) {
        //     if (AppUtility.isValidVariable(this.custodianId) && this.custodianId > 0) {
        //         this.getSecurityBalanceByCustodian(securityId);
        //     }
        //     else {
        //         this.getSecurityBalanceByParticipant(securityId);
        //     }
        // }
        this.entryType = null
        this.selectedItem.availableBalance = 0;
        
    }

    public getClientSecurityPledgedBalance(type) {
        this.selectedItem.availableBalance = 0;
        this.listingService.getClientSecurityPledgedBalance(this.selectedItem.exchange.exchangeId,
            AppConstants.participantId, this.selectedItem.client.clientId,
            this.selectedItem.security.securityId, type)
            .subscribe(
                restData => {
                    if (AppUtility.isEmptyArray(restData)) {
                        this.selectedItem.availableBalance = 0;
                    } else {
                        this.updateSecurityPledgedBalance(restData);
                    }
                },
                error => this.errorMessage = <any>error);
    }

    // public getSecurityBalanceByParticipant(securityId) {
    //     this.selectedItem.availableBalance = 0;
    //     this.listingService.getClientSecurityBalanceByParticipant(this.selectedItem.exchange.exchangeId,
    //         AppConstants.participantId, this.selectedItem.client.clientId,
    //         securityId)
    //         .subscribe(
    //             restData => {
    //                 if (AppUtility.isEmptyArray(restData)) {
    //                     this.selectedItem.availableBalance = 0;
    //                 } else {
    //                     this.updateSecurityBalance(restData);
    //                 }
    //             },
    //             error => this.errorMessage = <any>error);
    // }



    ///// As discussed with @Asif sb, New End Point of C++ for available balance implmented by @Faizan - 02/03/2023
    public getSecurityBalanceByParticipant(securityId) {

    let exchangeCode = "";
    let clientCode = "";
    let symbol = "";
    if(AppUtility.isValidVariable(this.selectedItem.exchange) && AppUtility.isValidVariable(this.selectedItem.exchange.exchangeId)){
        if(!AppUtility.isEmptyArray(this.exchangeList)){
              this.exchangeList.forEach(element => {
                    if(this.selectedItem.exchange.exchangeId === element.exchangeId){
                        exchangeCode = element.exchangeCode;
                    }
              })
        }
    }

    if(AppUtility.isValidVariable(this.selectedItem.client) && AppUtility.isValidVariable(this.selectedItem.client.clientId)){
        if(!AppUtility.isEmptyArray(this.clientList)){
              this.clientList.forEach(element => {
                    if(this.selectedItem.client.clientId === element.id){
                        clientCode = element.code;
                    }
              })
        }
    }



    if(AppUtility.isValidVariable(this.selectedItem.security) && AppUtility.isValidVariable(this.selectedItem.security.securityId)){
        if(!AppUtility.isEmptyArray(this.securityList)){
              this.securityList.forEach(element => {
                    if(this.selectedItem.security.securityId === element.securityId){
                        symbol = element.symbol;
                    }
              })
        }
    }


        this.selectedItem.availableBalance = 0;
        this.orderService.getAvailableHolding(exchangeCode,
            AppConstants.participantCode, AppConstants.username , clientCode, symbol)
            .subscribe(
                restData => {
                    if (AppUtility.isEmptyArray(restData)) {
                        this.selectedItem.availableBalance = 0;
                    } else {
                        this.selectedItem.availableBalance = Number(restData.net_holding)
                    }
                },
                (error) => { 
                    this.selectedItem.availableBalance = 0;
                        this.listingService.getClientSecurityBalanceByParticipant(this.selectedItem.exchange.exchangeId,
                            AppConstants.participantId, this.selectedItem.client.clientId,
                            securityId)
                            .subscribe(
                                restData => {
                                    if (AppUtility.isEmptyArray(restData)) {
                                        this.selectedItem.availableBalance = 0;
                                    } else {
                                        this.updateSecurityBalance(restData);
                                    }
                                },
                                error => this.errorMessage = <any>error);
                    
                            });
                 
    }





    public getSecurityBalanceByCustodian(securityId) {
        this.selectedItem.availableBalance = 0;
        this.listingService.getClientSecurityBalanceByCustodian(this.selectedItem.exchange.exchangeId,
            AppConstants.participantId, this.custodianId,
            this.selectedItem.client.clientId, securityId)
            .subscribe(
                restData => {
                    if (AppUtility.isEmptyArray(restData)) {
                        this.selectedItem.availableBalance = 0;
                    } else {
                        this.updateSecurityBalance(restData);

                    }
                },
                error => this.errorMessage = <any>error);
    }
    private updateSecurityBalance(stockSummery) {
        this.selectedItem.availableBalance = stockSummery[0].balance;
    }
    private updateSecurityPledgedBalance(stockSummery) {
        this.selectedItem.availableBalance = stockSummery[0];
    }
    public populateClientCustodianList(clientId: Number) {
        // Populate market combo
        this.custodianExist = false;
        this.listingService.getClientCustodian(clientId)
            .subscribe(
                restData => {
                    if (AppUtility.isEmptyArray(restData)) {
                        this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                        this.clientCustodianList = null;
                        //this.custodianExist = false;
                    } else {
                        this.clientCustodianList = restData;

                        var c: ClientCustodian = new ClientCustodian();
                        c.custodian.participantId = AppConstants.PLEASE_SELECT_VAL;
                        c.custodian.participantCode = AppConstants.PLEASE_SELECT_STR;
                        this.clientCustodianList.unshift(c);
                        this.custodianExist = true;
                    }
                },
                error => this.errorMessage = <any>error);
    }
    public onExchangeChange(val) {
        this.getExchangeBrokerClients(val);
        this.getSecuritiesByExchange(val);
    }
    public getSecuritiesByExchange(exchangeId) {
        
        // Populate market combo
        this.securityList = [];

        this.listingService.getSecurityListByExchagne(exchangeId)
            .subscribe(
                restData => {

                    if (AppUtility.isEmptyArray(restData)) {
                        this.securityList = [];
                        //this.custodianExist = false;
                    } else {
                        this.securityList = restData;

                        var selectSecurity: Security = new Security();
                        selectSecurity.securityId = AppConstants.PLEASE_SELECT_VAL;
                        selectSecurity.symbol = AppConstants.PLEASE_SELECT_STR;
                        this.securityList.unshift(selectSecurity);
                    }
                },
                error => this.errorMessage = <any>error);
    }
    public onSaveAction(model: any, isValid: boolean) {
        
        this.isSubmitted = true;
        this.selectedItem.entryType = this.entryType
        // check for quantity
        if (this.selectedItem.quantity <= 0) {
            isValid = false;
        }
        if ((this.selectedItem.availableBalance < this.selectedItem.quantity) &&
            (this.selectedItem.entryType == AppConstants.ENTRY_TYPE_WITHDRAW || this.selectedItem.entryType == AppConstants.ENTRY_TYPE_RELEASE || this.selectedItem.entryType == AppConstants.ENTRY_TYPE_PLEDGE)) {
            isValid = false;
            this.quantityExceedsBalance = true;
        } else {
            this.quantityExceedsBalance = false;
        }
        if (isValid) {
            this.loader.show();
            this.selectedItem.participant = new Participant();
            this.selectedItem.participant.participantId = AppConstants.participantId;
            this.selectedItem.transDate = AppUtility.toYYYYMMDD(this.transDate.value);

            if (!this.custodianExist || !AppUtility.isValidVariable(this.custodianId) || this.custodianId == 0) {
                this.selectedItem.custodian = null;
            } else {
                this.selectedItem.custodian.participantId = this.custodianId;
            }
            if (!this.isEditing) {
                this.listingService.saveStockDepositWithdraw(this.selectedItem).subscribe(
                    data => {

                        this.loader.hide();
                        if (AppUtility.isEmpty(this.itemsList))
                            this.itemsList = new wjcCore.CollectionView;
                        //let item =  this.itemsList.addNew();
                        //this.itemsList.commitNew();
                        this.populateDataItems();
                        //Select the newly added item
                        //   AppUtility.moveSelectionToLastItem(this.itemsList);

                        this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                        this.dialogCmp.showAlartDialog('Success');

                        // this.clearFields();
                        //this.hideModal();
                    },
                    error => {
                        if (typeof (error) == "undefined") {
                            this.loader.hide();
                            this.dialogCmp.statusMsg = "Something went wrong"
                            this.dialogCmp.showAlartDialog('Error');
                        }
                        else {

                            this.loader.hide();
                            this.hideForm = true;
                            if (error.message) {
                                this.errorMessage = error.message;
                            }
                            else {
                                this.errorMessage = error;
                            }

                            this.dialogCmp.statusMsg = this.errorMessage;
                            this.dialogCmp.showAlartDialog('Error');
                        }

                    }
                );
            }
        }
    }

    /***************************************
   *          Private Methods
   **************************************/

    private populateDataItems() {
        this.itemsList = new wjcCore.CollectionView();
        let posted: boolean = false;
        let type: string = '';
        let transFromDate: string = '';
        let transToDate: string = '';
        if (AppUtility.isValidVariable(this.srchFromTransDate)) {
            transFromDate = wjcCore.Globalize.format(this.srchFromTransDate, this.dateFormat);
        }
        if (AppUtility.isValidVariable(this.srchToTransDate)) {
            transToDate = wjcCore.Globalize.format(this.srchToTransDate, this.dateFormat);
        }
        if (AppUtility.isValidVariable(this.srchStatus) && this.srchStatus.toLowerCase() == 'posted' || this.srchStatus.toLowerCase() == 'publicada') {
            posted = true;
        } else {
            posted = false;
        }
        this.loader.show();
        this.listingService.getStockDepositWithdrawList(AppConstants.participantId, transFromDate, transToDate, this.srchEntryType, posted)
            .subscribe(
                restData => {
                    this.loader.hide();
                    if (AppUtility.isEmptyArray(restData)) {
                        this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
                    } else {

                        this.updateData(restData);
                    }
                },
                error => {
                    this.loader.hide();
                    this.errorMessage = <any>error.message;
                });

    }

    updateData(data) {
        this.isItemsListStatusNew = false;
        let items = [];
        let itemIndex = 0;
        let objStockDepositWithdraw = new StockDepositWithdraw();

        for (let i = 0; i < data.length; i++) {

            data[i].entryTypeDesc = objStockDepositWithdraw.getEntryTypeDesc(data[i].entryType);
            if (!data[i].posted) {
                this.isItemsListStatusNew = true;
            }

            if ((data[i].exchange.exchangeId == this.srchExchange || Number(this.srchExchange) == 0 || this.srchExchange == '') &&
                (data[i].entryType == this.srchEntryType || this.srchEntryType == null)) {
                if (this.route.snapshot.params['d'] == "P") {
                    if (data[i].entryType == AppConstants.ENTRY_TYPE_PLEDGE || data[i].entryType === AppConstants.ENTRY_TYPE_RELEASE) {
                        items[itemIndex] = data[i];
                        itemIndex += 1;
                    }
                }
                else {
                    if (data[i].entryType == AppConstants.ENTRY_TYPE_DEPOSIT || data[i].entryType === AppConstants.ENTRY_TYPE_WITHDRAW) {
                        items[itemIndex] = data[i];
                        itemIndex += 1;
                    }
                }


            }
        }

        this.itemsList = new wjcCore.CollectionView(items);
        this.flexGrid.invalidate();
    }







    public static moveSelectionToLastItem(itemsList: wjcCore.CollectionView) {

        itemsList.moveToLastPage();
        itemsList.moveCurrentToLast();
    }

    items: any;
    selectedStatus: string = '';

    public onEntriesAction(selectedStatus) {
        
        this.selectedStatus = selectedStatus;
        var confirmStr;


        if (this.itemsList.itemCount < 1) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');


        } else {
            this.items = this.getItemIdsArr();
            if (selectedStatus == 'POSTED') {
                if (this.lang === 'pt') {
                    this.dialogCmp.statusMsg = "Tem certeza de que deseja publicar as entradas selecionadas?";
                }
                else {
                    this.dialogCmp.statusMsg = "Are you sure, you want to post selected entries?";
                }

                this.dialogCmp.showAlartDialog('Confirmation');
            } else if (selectedStatus == 'CANCELED') {
                if (this.lang === 'pt') {
                    this.dialogCmp.statusMsg = "Tem certeza de que deseja cancelar as entradas selecionadas?";
                }
                else {
                    this.dialogCmp.statusMsg = "Are you sure, you want to cancel selected entries?";
                }

                this.dialogCmp.showAlartDialog('Confirmation');
            }
        }
    }
    getItemIdsArr(): any[] {

        let idsArr: any[] = [];
        for (var i = 0; i < this.checkedSelectedItem.length; i++) {
            idsArr.push(this.checkedSelectedItem[i].stockLedgerId);
        }
        return idsArr;
    }
    public onCancelEntriesAction(selectedStatus) {
        if (this.itemsList.itemCount < 1) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');

        } else {

        }
    }


    private addSearchFromValidations() {
        this.searchForm = this._fb2.group({
            srchExchange: ['', Validators.compose([Validators.required])],
            srchFromTransDate: ['', Validators.compose([Validators.required])],
            srchToTransDate: ['', Validators.compose([Validators.required])],
            srchEntryType: ['', Validators.compose([Validators.required])],
            srchStatus: ['', Validators.compose([Validators.required])],
        });
    }
    private addFromValidations() {
        this.myForm = this._fb.group({
            exchangeId: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNonZeroNumeric)])],
            custodianId: [''],
            securityId: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNonZeroNumeric)])],
            clientId: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNonZeroNumeric)])],
            entryType: ['', Validators.compose([Validators.required])],
            transDate: ['', Validators.compose([Validators.required])],
            quantity: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNonZeroNumeric)])],
            price : [''],
            availableBalance: [''],
            remarks: [''],
            pledgeCode: [''],
        });
    }


    public getNotification(btnClicked) {
        if (btnClicked == 'Success') {
            this.hideModal();
            this.clearFields();
        }
        else if (btnClicked == 'Yes') {

            if (!AppUtility.isEmptyArray(this.items)) {
                this.listingService.updateStockStatus(this.items, this.selectedStatus).subscribe(
                    data => {
                        var msg = '';
                        if (this.selectedStatus == 'POSTED') {
                            msg = AppConstants.MSG_RECORD_POSTED;
                        } else {
                            msg = AppConstants.MSG_RECORD_CANCELED;
                        }
                        this.dialogCmp.statusMsg = msg;
                        this.dialogCmp.showAlartDialog('Success');
                        this.itemsList = new wjcCore.CollectionView();
                        this.flexGrid.refresh();
                        this.populateDataItems();
                    },
                    err => {
                        if (err.message) {
                            this.errorMessage = err.message;
                        }
                        else {
                            this.errorMessage = err;
                        }

                        this.dialogCmp.statusMsg = this.errorMessage;
                        this.dialogCmp.showAlartDialog('Error');
                        this.itemsList = new wjcCore.CollectionView();
                        this.flexGrid.refresh();
                        this.populateDataItems();
                    }
                );
            }
            else {
                if (this.lang === 'pt') {
                    this.dialogCmp.statusMsg = "Nenhuma ação foi tomada.";
                }
                else {
                    this.dialogCmp.statusMsg = "No action has been taken.";
                }

                this.dialogCmp.showAlartDialog('Notification');
            }
        }
    }


}
