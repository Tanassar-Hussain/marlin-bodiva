import {Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppConstants, AppUtility} from "../../../../../../app.utility";
import {ToastrService} from "ngx-toastr";
import {ListingService} from 'app/services-oms/listing-oms.service';
import {Subscription} from "rxjs";
import {Symbol} from "../../../../../../models/symbol";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import { FlexGrid, HeadersVisibility } from '@grapecity/wijmo.grid';
// Wijmo Imports
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import {Client} from "../../../../../../models/client";
import {ComboItem} from "../../../../../../models/combo-item";
import {Exchange} from "../../../../../../models/exchange";
import {Market} from "../../../../../../models/market";
 
import {Custodian} from "../../../../../../models/custodian";
import {Participant} from "../../../../../../models/participant";
import {Order} from "../../../../../../models/order";
import {distinctUntilChanged} from "rxjs/operators";
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import {PendingOrderAction} from "../pending-orders.component";
import {StateManagementService} from "../../../../../../services/state-management.service";
import { PendingOrdersService } from 'app/services/pending-orders.service';
import * as wjcInput from '@grapecity/wijmo.input';
import { Selector } from '@grapecity/wijmo.grid.selector';
 
import { DialogCmpWatch } from '../../../dialog-component';
import { DialogCmpReports } from '../../../reports/dialog-cmp-reports';
import { DialogCmpOrders } from '../../dialog/dialog.component';

@Component({
    selector: 'app-pending-orders-list',
    templateUrl: './pending-orders-list.component.html',
    styleUrls: ['./pending-orders-list.component.scss'],
   
})
export class PendingOrdersListComponent implements OnInit, OnDestroy {

    @Input() selectedType = AppConstants.ASSET_CLASS_EQUITIES;
    AppConstants = AppConstants;

    // Settings & Constants variables
    userType: string = AppConstants.userType;
    PendingOrderAction = PendingOrderAction;

    // Dropdown options variables
    exchanges: Exchange[] = [];
    markets: Market[] = [];
    symbols: Symbol[];
    custodians: Custodian[];
    clients: Client[] = [];
    participants: Partial<Participant>[] = [];

    // Pending orders list variable
   // pendingOrders: Order[] = [];
      pendingOrders: wjcCore.CollectionView;
    // Boolean variables
    isSubmitted: boolean = false;
    isCustodian: boolean = false;
    allTraders: boolean = false;
    includeColumnHeader: boolean = true;

    // Document download settings variables
    scaleMode = gridPdf.ScaleMode.PageWidth;
    orientation = pdf.PdfPageOrientation.Landscape;
    exportMode = gridPdf.ExportMode.All;

    // Filter form
    filterForm: FormGroup;

    // Decorators for view access
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmpOrders;
    @ViewChild('ordersApproval', { static: false }) ordersApproval: wjcInput.Popup;
    private _pageSize = 0;

    // Observables subscriptions
    private readonly _subscriptions: Subscription[] = [];

    selector: Selector = null;
    public checkedSelectedItem: any[] = [];
    selectedItems: any[] = [];
    errorMessage: string = "";
    postType: string = "";
    modal: boolean = true;


    constructor(private readonly _toastService: ToastrService,
                private readonly _listingService: ListingService,
                private readonly _pendingOrdersService: PendingOrdersService,
                private readonly _splashService: FuseLoaderScreenService,
                private readonly _stateService: StateManagementService) {
    }

    ngOnInit(): void {

        this._splashService.show();
        this._initializeData();
        this._initializeForm();
        this._fetchExchanges();
      //  this._initializeParticipants();
        this.populateParticipants();
        this.filterForm.statusChanges.pipe(distinctUntilChanged()).subscribe((status) => {
            if (status === 'VALID'){
                this.loadOrders();
            }
        });
    }

    ngOnDestroy() {
        this._subscriptions.forEach(sub => sub.unsubscribe());
    }

    onExchangeChange(): void {
        let exchangeId = this.filterForm.controls['exchange'].value;
        this._fetchExchangeMarkets(exchangeId);
        if (this.isCustodian) this._fetchExchangeCustodians(exchangeId);
    }

    loadOrders(){
        this._splashService.show();
        if (this.filterForm.valid){
            setTimeout(() => {
                this._fetchPendingOrders(this.filterForm.value);
            }, 1000);
        }
    }

    onRefresh(refresh: boolean): void {
        if (refresh) this.loadOrders();
    }

    onRowSelection(){
        if (this.pendingOrders?.items?.length){
            console.log(this.flexGrid.rows[this.flexGrid.selection.row].dataItem);
        }
    }

    get currentDate(){
        return new Date();
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

    exportPDF() {
        let columns = this.flexGrid.columns;
        let lastColumn = columns[columns.length - 1];

        if (lastColumn) {
            // Hide the last column
            let wasVisible = lastColumn.visible;
            lastColumn.visible = false;
            gridPdf.FlexGridPdfConverter.export(this.flexGrid, `${this._capitalizeFirstLetter(this.selectedType)} Pending Orders` + new Date().toLocaleString() + '.pdf', {
                maxPages: 5000,
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

            lastColumn.visible = wasVisible;
        }
    }


    exportExcel() {
        let columns = this.flexGrid.columns;
        let lastColumn = columns[columns.length - 1];

        if (lastColumn) {
            let wasVisible = lastColumn.visible;
            lastColumn.visible = false;

            wjcGridXlsx.FlexGridXlsxConverter.save(this.flexGrid,
                { includeCellStyles: false },
                `${this._capitalizeFirstLetter(this.selectedType)} Pending Orders.xlsx`);

            lastColumn.visible = wasVisible;
        }
    }

    onClientChange(){
        const participantId = this.filterForm.controls['participant'].value;
        if (participantId){
            this._fetchClients(AppConstants.exchangeId, participantId);
        }
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------ Utility Private Methods --------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeData() {
        // Set custodian flag
        this.isCustodian = AppConstants.CUSTODIAN_MODEL === true;
    }

    private _initializeForm() {
        this.filterForm = new FormGroup({
            exchange: new FormControl(0, [
                Validators.required,
            ]),
            market: new FormControl(1, [
                Validators.required,
            ]),
            client: new FormControl('', [
                Validators.required,
            ]),
            custodian: new FormControl(''),
            symbol: new FormControl('', [
                Validators.required,
            ]),
            participant: new FormControl('', [
                Validators.required,
            ]),
        });
    }

    private _updateMarkets(markets: any[]) {
        const marketTypeMapping = {
            [AppConstants.ASSET_CLASS_EQUITIES]: {
                type: AppConstants.MARKET_TYPE_EQUITY,
                validTypes: [
                    AppConstants.MARKET_TYPE_EQUITY,
                    AppConstants.MARKET_TYPE_GAX,
                    AppConstants.MARKET_TYPE_ODD,
                    AppConstants.MARKET_TYPE_QUOTE_STRING,
                    AppConstants.MARKET_TYPE_AUCTION
                ]
            },
            [AppConstants.ASSET_CLASS_BONDS]: {
                type: AppConstants.MARKET_TYPE_BOND,
                validTypes: [
                    AppConstants.MARKET_TYPE_BOND,
                    AppConstants.MARKET_TYPE_QUOTE_STRING,
                    AppConstants.MARKET_TYPE_AUCTION
                ]
            },
            [AppConstants.ASSET_CLASS_ETF]: {
                type: AppConstants.MARKET_TYPE_ETF_,
                validTypes: [
                    AppConstants.MARKET_TYPE_ETF_,
                    AppConstants.MARKET_TYPE_QUOTE_STRING,
                    AppConstants.MARKET_TYPE_AUCTION
                ]
            }
        };

        const selectedMarketType = marketTypeMapping[this.selectedType];
        if (!selectedMarketType) return;

        this.markets = markets.filter(market =>
            selectedMarketType.validTypes.includes(market.marketType.description.toUpperCase())
        );

        this.markets.forEach(market => {
            if (market.marketType.description.toUpperCase() === selectedMarketType.type) {
                setTimeout(() => {
                    this.filterForm.controls['market'].setValue(market.marketId);
                    const exchangeId = this.filterForm.controls['exchange'].value;
                    const marketId = this.filterForm.controls['market'].value;
                    this._fetchExchangeMarketSecurities(exchangeId, marketId);
                }, 150);
            }
        });
    }

    private _capitalizeFirstLetter(str: string): string {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    // ---------------------------------------------------------------------------------------------------
    // ------------------------------ Fetch Private Methods ----------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _fetchExchanges() {
        this._subscriptions.push(this._listingService.getExchangeList().subscribe(
            {
                next: (exchanges) => {
                    this._splashService.hide();
                    if (!AppUtility.isEmptyArray(exchanges)) {
                        this.exchanges = exchanges as Exchange[];
                        this.filterForm.controls['exchange'].setValue(this.exchanges[0].exchangeId);
                    }
                },
                error: (error) => {
                    if(error.message){
                        this._toastService.error(error.message);
                    }else{
                        this._toastService.error(error);
                    }
                    this._splashService.hide();
                }
            }
        ));
    }

    private _fetchExchangeMarkets(exchangeId: number) {
        this._subscriptions.push(this._listingService.getMarketListByExchange(exchangeId).subscribe(
            {
                next: (markets) => {
                    this._splashService.hide();
                    if (!AppUtility.isEmptyArray(markets)) {
                        this._updateMarkets(markets);
                    }else {
                        this.markets = [];
                    }
                },
                error: (error) => {
                    if(error.message){
                        this._toastService.error(error.message);
                    }else{
                        this._toastService.error(error);
                    }
                    this.markets = [];
                    this._splashService.hide();
                }
            }
        ))
    }

    private _fetchExchangeMarketSecurities(exchangeId: number, marketId: number) {
        this._subscriptions.push(this._listingService.getExchangeMarketSecuritiesList(exchangeId, marketId).subscribe({
            next: (symbols) => {
                this._splashService.hide();
                if (!AppUtility.isEmptyArray(symbols)) {
                    this.symbols = symbols as Symbol[];
                    let symbol: Symbol = new Symbol(AppConstants.ALL_VAL, AppConstants.ALL_STR);
                    this.symbols.unshift(symbol);
                    this.filterForm.controls['symbol'].setValue(this.symbols[0].securityId);
                }else {
                    this.symbols = [];
                }
            },
            error: (error) => {
                if(error.message){
                    this._toastService.error(error.message);
                }else{
                    this._toastService.error(error);
                }
                this.symbols = [];
                this._splashService.hide();
            }
        }))
    }

    private _fetchClients(exchangeId: number, participantId: number) {
        this._splashService.show();
        this._subscriptions.push(this._listingService.getClientListByExchangeBroker(exchangeId, participantId, true, true).subscribe({
            next: (clients) => {
                this._splashService.hide();
                if (AppUtility.isValidVariable(clients) && !AppUtility.isEmpty(clients)) {
                    if (AppConstants.userType === AppConstants.USER_TYPE_CLIENT_CODE){
                        this.clients = clients as Client[];
                    }else {
                        this.clients = [{ clientId: -1, ...new Client(AppConstants.ALL_STR, AppConstants.ALL_STR) }, ...clients as Client[]];
                    }
                    this.filterForm.controls['client'].setValue(this.clients[0].clientId)
                } else {
                    this.clients = [];
                }

            },
            error: (error) => {
                if(error.message){
                    this._toastService.error(error.message);
                }else{
                    this._toastService.error(error);
                }
                this.clients = [];
                this._splashService.hide();
            }
        }))
    }

    private _fetchExchangeCustodians(exchangeId: number): void {

        this._subscriptions.push(this._listingService.getCustodianByExchange(exchangeId).subscribe(
            {
                next: (custodians) => {
                    this._splashService.hide();
                    if (!AppUtility.isEmptyArray(custodians)) {
                        this.custodians = custodians.map((item: any) =>
                            new ComboItem(item.participantCode, item.participantCode)
                        ) as any;

                        const placeholder = new ComboItem(AppConstants.PLEASE_SELECT_STR, -1 as unknown as string);
                        this.custodians.unshift(placeholder as any);
                    }else {
                        this.custodians = [];
                    }
                },
                error: (error) => {
                    if(error.message){
                        this._toastService.error(error.message);
                    }else{
                        this._toastService.error(error);
                    }
                    this.custodians = [];
                    this._splashService.hide();
                }
            }
        ));
    }

    private _initializeParticipants() {
        setTimeout(() => {
            this.participants = JSON.parse(JSON.stringify(this._stateService.participants));

            if (this.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && this.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                this.filterForm.controls['participant'].setValue(AppConstants.participantId);
            } else {
                let participant: Participant = new Participant();
                participant.participantId = AppConstants.PLEASE_SELECT_VAL;
                participant.participantCode = AppConstants.PLEASE_SELECT_STR;
                this.participants.unshift(participant);
            }

        },1000)
    }




    private populateParticipants() {
        this._listingService.getParticipantListByExchagne(AppConstants.exchangeId).subscribe(restData => {
            if (AppUtility.isEmpty(restData)) {
                this.participants = [];
            } else {
                this.participants = restData;
                if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                    setTimeout(() => {
                        this.filterForm.controls['participant'].setValue(AppConstants.participantId);
                    }, 500);
                
                } else {
                    let participant: Participant = new Participant();
                    participant.participantId = AppConstants.PLEASE_SELECT_VAL;
                    participant.participantCode = AppConstants.PLEASE_SELECT_STR;
                    this.participants.unshift(participant);
                
                }
            }
        },
            error => {
                if(error.message){
                    this._toastService.error(error.message);
                }else{
                    this._toastService.error(error);
                }
            });
    }



    private _fetchPendingOrders(formFilters: any){
        this.pendingOrders = new wjcCore.CollectionView();
        const filters = {
            exchangeId: formFilters.exchange,
            marketId: formFilters.market,
            securityId: formFilters.symbol,
            participantIdList: [formFilters.participant],
            clientId: formFilters.client,
        };
        this._subscriptions.push(this._pendingOrdersService.getPendingOrders(filters).subscribe({
            next: (pendingOrders) => {
                 
                this._splashService.hide();
                if (!AppUtility.isEmptyArray(pendingOrders)){
                    this.pendingOrders = pendingOrders;
                    this._splashService.hide();
                }else {
                    this._splashService.hide();
                    this.pendingOrders = new wjcCore.CollectionView();
                }
            },
            error: (error) => {
                if(error.message){
                    this._toastService.error(error.message);
                }else{
                    this._toastService.error(error);
                }
            
                this.pendingOrders = new wjcCore.CollectionView();
                this._splashService.hide();
            }
        }));
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




    public onPostAction(type: string) {
        
        if (type === 'A') {
            this.postType = type;
            if (this.checkedSelectedItem?.length < 1) {
                this.errorMessage = AppConstants.MSG_NO_RECORD_SELECTED;
                this.flexGrid.refresh();
                this.dialogCmp.statusMsg = this.errorMessage;
                this.dialogCmp.showAlartDialog('Error');
            }else{
                this.showDialog(this.ordersApproval);
            }
       
         
        }

    }




   public approveOrdersList = () => {
   

    if(!AppUtility.isEmptyArray(this.checkedSelectedItem)){
        const data = this.checkedSelectedItem.map(item => ({
            orderNo: Number(item.order_no),
            volume: item.volume,
            price: Number(item.price),
            value: item.settlementValue,
            accruedProfit: item.accrudeProfit,
            yield: item.yield,
            comments: item.comments
          }));

          this._splashService.show();
          this._pendingOrdersService.approvePendingOrdersList(data).subscribe({
            next : (res : any) => {
                this._splashService.hide();
                this.dialogCmp.statusMsg = AppConstants.MSG_ORDERS_APPROVED_SUCCESSFULLY;
                this.dialogCmp.showAlartDialog('Success');
            },
    
            error : (err : any) => {
                this._splashService.hide();
                if(err.message)  
                    this.dialogCmp.statusMsg = err.message  
                else   
                this.dialogCmp.statusMsg = err;
               
                this.dialogCmp.showAlartDialog('Error');
            }
        } )
    }

  

   }



   public getNotification(btnClicked) {
    if (btnClicked == 'Success') {
        this.loadOrders();
    }

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





}
