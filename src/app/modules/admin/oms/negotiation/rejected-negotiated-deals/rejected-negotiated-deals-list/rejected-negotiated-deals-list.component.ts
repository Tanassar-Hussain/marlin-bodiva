import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AppConstants, AppUtility} from "../../../../../../app.utility";
import {Participant} from "../../../../../../models/participant";
import {Client} from "../../../../../../models/client";
import {Market} from "../../../../../../models/market";
import {Security} from "../../../../../../models/security";
import {DialogCmp} from "../../../../back-office/user-site/dialog/dialog.component";
import {Subject} from "rxjs";
import {ListingService} from "../../../../../../services/listing.service";
import {FuseLoaderScreenService} from "../../../../../../../@fuse/services/splash-screen";
import {StateManagementService} from "../../../../../../services/state-management.service";
import {TranslateService} from "@ngx-translate/core";
import {takeUntil} from "rxjs/operators";
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';

@Component({
  selector: 'app-rejected-negotiated-deals-list',
  templateUrl: './rejected-negotiated-deals-list.component.html',
  styleUrls: ['./rejected-negotiated-deals-list.component.scss']
})
export class RejectedNegotiatedDealsListComponent implements OnInit {

    @Input() selectedType = AppConstants.ASSET_CLASS_EQUITIES;
    @Input() assetId: number = 1;

    rejectedOrders: any[] = [];

    // Filters Dropdown Options
    participants: Participant[] = [];
    clientList: Client[] = [];
    marketList: Market[] = [];
    symbolList: Security[] = [];

    participantId: number = null;
    clientId: number = null;
    symbolId: number = null;
    marketId: number = null;

    disableParticipantField: boolean = false;
    AppConstants = AppConstants;

    @ViewChild('flexGrid', {static: false}) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;

    private _pageSize = 0;
    private readonly _destroy$ = new Subject<void>();

    constructor(private readonly _listingService: ListingService,
                private readonly _splashService: FuseLoaderScreenService,
                private readonly _stateService: StateManagementService,
                private readonly _translate: TranslateService) {
    }

    ngOnInit(): void {
        this._initializeData();
        this.populateParticipants();
        if (this.assetId) this._fetchMarkets(this.assetId);
    }

    ngAfterViewInit() {
     
       
    }

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
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

    onFilter(showEmptyMsg: boolean){
        this._fetchRejectedOrders();
    }

    onMarketChangeEvent(marketId: number){
        if (AppUtility.isEmpty(marketId)) return;

        if (AppConstants.exchangeId) this._fetchSecurities(AppConstants.exchangeId, marketId);
    }

    onParticipantChangeEvent(autocomplete: wjcInput.AutoComplete) {
        const participant = autocomplete.selectedItem;
        const participantId = participant?.participantId;

        if (AppUtility.isEmpty(participantId)) return;

        if (AppConstants.exchangeId) {
            this._fetchClients(AppConstants.exchangeId, participantId);
        }
    }

    get isUserClient(){
        return AppConstants.userType === AppConstants.USER_TYPE_CLIENT_CODE;
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------------- Private Methods ---------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeData() {
        const lang = localStorage.getItem("lang") ?? 'en';
        this._translate.use(lang);
    }

    private _fetchRejectedOrders(showEmptyMessage = false) {
        this._splashService.show();
        const filters = {
            exchangeId: AppConstants.exchangeId || -1,
            marketId: this.marketId || -1,
            participantId: this.participantId || -1,
            clientId: this.clientId || -1,
            securityId: this.symbolId || -1,
        }
        this._listingService.getRejectedNegotiatedDeals(filters).pipe(takeUntil(this._destroy$)).subscribe({
            next: (orders: any) => {
                this._splashService.hide();
                if (AppUtility.isValidVariable(orders) && !AppUtility.isEmptyArray(orders)) {
                    this.rejectedOrders = orders.filter((order: { assetId: number; }) => order.assetId === this.assetId);

                } else {
                    this.rejectedOrders = [];
                    if (showEmptyMessage) this._errorMessage('No Data Found');
                }
            }, error: (error: any) => {
                this._errorMessage(error);
            }
        })
    }

    private _fetchMarkets(assetId: number) {
        this._listingService.getMarkets(assetId).pipe(takeUntil(this._destroy$)).subscribe({
            next: (markets: Market[]) => {
                this._splashService.hide();
                if (!AppUtility.isEmpty(markets)) {
                    this.marketList = markets;

                    setTimeout(() => {
                        if(AppUtility.isValidVariable(assetId) && assetId === AppConstants.ASSET_CLASS_ID_EQUITIES){
                            this.marketId = 1;
                        }else if(AppUtility.isValidVariable(assetId) && assetId === AppConstants.ASSET_CLASS_ID_BONDS){
                            this.marketId = 11;
                        }else if(AppUtility.isValidVariable(assetId) && assetId === AppConstants.ASSET_CLASS_ID_ETFS){
                            this.marketId = 22;
                        }else{
                            this.marketId = null;
                        }
                        this.onMarketChangeEvent(this.marketId);
                    }, 300);

                }

            }, error: (error: any) => {
                this._errorMessage(error);
            }
        });
    }

    private _fetchSecurities(exchangeId: number, marketId: number) {
        this._listingService.getSecurities(exchangeId, marketId).pipe(takeUntil(this._destroy$)).subscribe({
            next: (securities: Security[]) => {
                this._splashService.hide();
                if (!AppUtility.isEmpty(securities)) {
                    this.symbolList = securities;
                    this._createAllSymbol();
                }else {
                    this.symbolList = [];
                }

            }, error: (error: any) => {
                this._errorMessage(error);
            }
        });
    }

    private _fetchClients(exchangeId: number, participantId: number) {
        this._listingService.getClientListByExchangeBroker(exchangeId, participantId, true, true).pipe(takeUntil(this._destroy$)).subscribe({
            next: (clients: Client[]) => {
                this._splashService.hide();
                if (!AppUtility.isEmpty(clients)) {
                    this.clientList = clients;
                    if (AppConstants.userType !== AppConstants.USER_TYPE_CLIENT_CODE) this._createAllClient();

                    if (AppConstants.userType === AppConstants.USER_TYPE_CLIENT_CODE) {
                        this.clientId = AppUtility.getLookupIdFromSession();
                        this._fetchRejectedOrders();
                    }

                }else {
                    this.clientList = [];
                }

            }, error: (error: any) => {
                this._errorMessage(error);
            }
        })
    }
 


    private populateParticipants() {
        
        this._listingService.getParticipantListByExchagne(AppConstants.exchangeId).subscribe((restData : any) => {
            if (AppUtility.isEmpty(restData)) {
                this.participants = [];
            } else {
                this.participants = restData;
                if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
                    setTimeout(() => {
                        this.participantId = AppConstants.participantId;
                        if(AppConstants.userType !== AppConstants.USER_TYPE_CLIENT_CODE) this._fetchRejectedOrders();
                    }, 500);

                }
              
               
            }
        },
            error => {
                this._errorMessage(error);
            });
    }




    private _errorMessage(error: any) {
        this.dialogCmp.statusMsg = error ?? 'Something went wrong';
        this.dialogCmp.showAlartDialog('Error');
        this._splashService.hide();
    }

    private _createAllSymbol(){
        const symbol = new Security();
        symbol.securityId = AppConstants.ALL_VAL;
        symbol.symbol = AppConstants.ALL_STR;
        this.symbolList.unshift(symbol);
    }

    private _createAllClient(){
        const client = new Client();
        client.clientId = AppConstants.ALL_VAL;
        client.clientCode = AppConstants.ALL_STR;
        this.clientList.unshift(client);
    }

}
