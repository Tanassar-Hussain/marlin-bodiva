import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DialogCmp} from "../../../../back-office/user-site/dialog/dialog.component";
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import {Subject} from "rxjs";
import {AppConstants, AppUtility} from "../../../../../../app.utility";
import {distinctUntilChanged, takeUntil} from "rxjs/operators";
import {FuseLoaderScreenService} from "../../../../../../../@fuse/services/splash-screen";
import {ListingService} from "../../../../../../services/listing.service";
import {ListingService as OmsListingService} from 'app/services-oms/listing-oms.service';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Market} from "../../../../../../models/market";
import {Symbol} from "../../../../../../models/symbol";
import {Client} from "../../../../../../models/client";
import {PendingOrderAction} from "./accept-reject-pending-order/accept-reject-pending-order.component";
import {Participant} from "../../../../../../models/participant";
import {StateManagementService} from "../../../../../../services/state-management.service";

@Component({
    selector: 'app-negotiated-deals-request-list',
    templateUrl: './negotiated-deals-request-list.component.html',
    styleUrls: ['./negotiated-deals-request-list.component.scss']
})
export class NegotiatedDealsRequestListComponent implements OnInit {

    // Filter form
    filterForm: FormGroup;

    // Dropdown options variables
    markets: Market[] = [];
    symbols: Symbol[];
    clients: Client[] = [];
    participants: Partial<Participant>[] = [];

    // Boolean variables
    isSubmitted: boolean = false;

    @Input() selectedType = AppConstants.ASSET_CLASS_EQUITIES;
    AppConstants = AppConstants;

    itemsList: wjcCore.CollectionView;

    @ViewChild('flexGrid', {static: false}) flexGrid: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;

    protected readonly PendingOrderAction = PendingOrderAction;
    private readonly _destroy$ = new Subject<void>();
    private _pageSize = 0;

    constructor(private readonly _splashService: FuseLoaderScreenService,
                private readonly _omsListingService: OmsListingService,
                private readonly _listingService: ListingService,
                private readonly _stateService: StateManagementService) {
    }

    ngOnInit(): void {
        this._splashService.show();
        this._initializeForm();

        this._fetchExchangeMarkets();
       // this._initializeParticipants();
        this.populateParticipants();
        this.filterForm.statusChanges.pipe(distinctUntilChanged()).subscribe((status) => {
            if (status === 'VALID'){
                this.loadOrders();
            }
        });
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

    loadOrders(showEmptyMsg = false){
        this._splashService.show();
        if (this.filterForm.valid){
            setTimeout(() => {
                this._fetchPendingOrders(this.filterForm.value, showEmptyMsg);
            }, 1000);
        }
    }

    get isUserClient(){
        return AppConstants.userType === AppConstants.USER_TYPE_CLIENT_CODE;
    }

    onClientChange(){
        const participantId = this.filterForm.controls['participant'].value;
        if (participantId){
            this._fetchClients(AppConstants.exchangeId, participantId);
        }
    }

    // ---------------------------------------------------------------------------------------------------
    // ------------------------------------- Private Methods ---------------------------------------------
    // ---------------------------------------------------------------------------------------------------

    private _initializeForm() {
        this.filterForm = new FormGroup({
            exchange: new FormControl(AppConstants.exchangeCode, [
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

    private _fetchPendingOrders(formFilters: any, showEmptyMsg: boolean) {
        const filters = {
            exchangeId: AppConstants.exchangeId,
            marketId: formFilters.market,
            securityId: formFilters.symbol,
            participantIdList: [formFilters.participant],
            clientId: formFilters.client,
        };

        this._splashService.show();
        this._listingService.getNegoPendingOrders(filters).pipe(takeUntil(this._destroy$)).subscribe({
            next: (orders) => {
                this._splashService.hide();
                if (AppUtility.isEmptyArray(orders)) {
                    if (showEmptyMsg) this._showErrorMessage(AppConstants.MSG_NO_DATA_FOUND);
                    this.itemsList = new wjcCore.CollectionView([]);
                } else {
                    this.itemsList = new wjcCore.CollectionView(orders);
                }
            }, error: (err) => {
                this._splashService.hide();
                this._showErrorMessage(err);
            }
        });
    }

    private _fetchExchangeMarkets() {
        const exchangeId = AppConstants.exchangeId;
        if (!exchangeId) return;
        this._splashService.show();
        this._omsListingService.getMarketListByExchange(exchangeId).pipe(takeUntil(this._destroy$)).subscribe(
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
                    this._showErrorMessage(error);
                    this.markets = [];
                    this._splashService.hide();
                }
            }
        )
    }

    private _fetchExchangeMarketSecurities(marketId: number) {
        const exchangeId = AppConstants.exchangeId;
        if (!exchangeId && !marketId) return;
        this._splashService.show();
        this._omsListingService.getExchangeMarketSecuritiesList(exchangeId, marketId).pipe(takeUntil(this._destroy$)).subscribe({
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
                this.symbols = [];
                this._showErrorMessage(error);
                this._splashService.hide();
            }
        })
    }

    private _fetchClients(exchangeId: number, participantId: number) {
        if (!exchangeId && !participantId) return;
        this._splashService.show();
        this._listingService.getClientListByExchangeBroker(exchangeId, participantId, true, true).pipe(takeUntil(this._destroy$)).subscribe({
            next: (clients) => {
                this._splashService.hide();
                if (AppUtility.isValidVariable(clients) && !AppUtility.isEmpty(clients)) {

                    if (this.isUserClient){
                        this.clients = clients as Client[];
                        this.filterForm.controls['client'].setValue(AppUtility.getLookupIdFromSession());
                    }else {
                        this.clients = [{ clientId: -1, ...new Client(AppConstants.ALL_STR, AppConstants.ALL_STR) }, ...clients as Client[]];
                        this.filterForm.controls['client'].setValue(this.clients[0].clientId);
                    }
                } else {
                    this.clients = [];
                }

            },
            error: (error) => {
                this.clients = [];
                this._showErrorMessage(error);
                this._splashService.hide();
            }
        })
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
                    const marketId = this.filterForm.controls['market'].value;
                    this._fetchExchangeMarketSecurities(marketId);
                }, 150);
            }
        });
    }

    private _showErrorMessage(err: string) {
        this.dialogCmp.statusMsg = err || 'Something went wrong!';
        this.dialogCmp.showAlartDialog('Error');
    }

    private _initializeParticipants() {
        setTimeout(() => {
            this.participants = JSON.parse(JSON.stringify(this._stateService.participants));

            if (AppConstants.userType !== AppConstants.USER_TYPE_EXCHANGE_ADMIN_CODE && AppConstants.userType !== AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
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
        this._listingService.getParticipantListByExchagne(AppConstants.exchangeId).subscribe((restData : any) => {
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
         
            });
    }







}
