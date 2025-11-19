import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef, Inject,
    OnInit, TemplateRef, ViewChild,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { BehaviorSubject, Subject } from "rxjs";
import { UserService } from "../../../core/user/user.service";
import { takeUntil } from "rxjs/operators";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { fuseAnimations } from "@fuse/animations";
import { TradingPortalService } from 'app/modules/admin/trading-portal/trading-portal.service';
import { ToastrService } from "ngx-toastr";
import { Navigation } from "../../../core/navigation/navigation.types";
import { AuthService } from 'app/core/auth/auth.service';
import { MatTableDataSource } from "@angular/material/table";
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SymbolAddDialogComponentService } from './symbol-add-dialog.component.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { DashboardService } from 'app/modules/admin/dashboard/dashboard.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'confirmation',
    templateUrl: './symbol-add-dialog.component.html',
    styleUrls: ['./symbol-add-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
})
export class SymbolAddDialogComponent implements OnInit {
    @ViewChild('labelInput') labelInput: ElementRef<HTMLInputElement>;
    @ViewChild('itemsContainer', { read: ViewContainerRef }) container: ViewContainerRef;
    @ViewChild('item', { read: TemplateRef }) template: TemplateRef<any>;
    labelsFilter: any;
    filteredSecurities: any;
    securities: any[] = [];
    navigation: Navigation;
    isScreenSmall: boolean;
    onAddPopup: string[] = ['Symbol', 'Bid', 'Ask', 'Change', 'Favourites'];
    selectedCategory: string = "Equities"
    symbolsDataSource: MatTableDataSource<any> = new MatTableDataSource();
    equitySymbolsDataSource: MatTableDataSource<any> = new MatTableDataSource();
    watchlistSymbolsDataSource: MatTableDataSource<any> = new MatTableDataSource();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    watchlistSymbols = new BehaviorSubject<any>("");
    watchList: Boolean = false
    userid: Number;
    favourites: any = []
    equitySymbols: any = []
    originalEquityArray: any = []
    originalBondArray: any = []
    originalEtfArray: any = []
    originalWatchlistArray: any = []

    selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES
    isSingleClick: Boolean = true;
    watchListArrayLength = new BehaviorSubject<any>(0);
    equityListArrayLength = new BehaviorSubject<any>(0);
    cryptoListArrayLength: Number = 0
    commoditiesListArrayLength: Number = 0
    realEstateListArrayLength: Number = 0
    bondListArrayLength = new BehaviorSubject<any>(0);
    etfsListArrayLength = new BehaviorSubject<any>(0);

    bondDataSource: MatTableDataSource<any> = new MatTableDataSource();
    etfDataSource: MatTableDataSource<any> = new MatTableDataSource();
    lang: string;

    asset_Id_Equities = AppConstants.ASSET_CLASS_ID_EQUITIES
    asset_Id_Bonds = AppConstants.ASSET_CLASS_ID_BONDS
    asset_Id_ETFs = AppConstants.ASSET_CLASS_ID_ETFS

    constructor(
        public matDialogRef: MatDialogRef<SymbolAddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _formBuilder: FormBuilder,
        private tradingPortalService: TradingPortalService,
        private toast: ToastrService,
        private _authService: AuthService,
        private sanitizer: DomSanitizer,
        private _router: Router,
        private _symbolService: SymbolAddDialogComponentService,
        private splash: FuseLoaderScreenService,
        private dashboardService: DashboardService,
        private translate: TranslateService
    ) {
        let user = JSON.parse(sessionStorage.getItem('user'));
        this.userid = user.id;
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        
        this._symbolService.getFavourites(this.userid, AppConstants.exchangeCode)
            .subscribe((data) => {
                
                this.watchlistSymbolsDataSource.data = data
                this.watchListArrayLength.next(this.watchlistSymbolsDataSource.data.length)

                data.map(a => {
                    // let objectURL = 'data:image/png;base64,' + a.securityImage;
                    // a.src = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                    a.bidPrice = a.bestMarketDTO[0].bidPrice
                    a.offerPrice = a.bestMarketDTO[0].offerPrice

                    if (AppUtility.isValidVariable(a.bestMarketDTO[0])) {
                        if (AppUtility.isValidVariable(a.bestMarketDTO[0].change)) {
                            if (Number(a.bestMarketDTO[0].change) == 0) {
                                a.dir = 'zero'
                            }
                            else
                                a.dir = a.bestMarketDTO[0].change.startsWith('-') ? 'down' : a.dir = 'up';
                        }
                        else
                            a.dir = 'zero'
                    }
                    else
                        a.dir = 'zero'


                });

            })


        this.securities.length = 0;
        this.securities = [...this._data.allPreviousSymbols];
        this.getAllTradingSymbols()
    }

    search(event) {
        const value = event.target.value.toLowerCase();
        // this.filteredSecurities = this.originalArray.filter(security => security.securityDescription.toLowerCase().includes(value));
        // this.symbolsDataSource.data = this.filteredSecurities
        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            this.filteredSecurities = this.originalEquityArray.filter(security => security.securityDescription.toLowerCase().includes(value));
            this.equitySymbolsDataSource.data = this.filteredSecurities
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            this.filteredSecurities = this.originalBondArray.filter(security => security.securityDescription.toLowerCase().includes(value));
            this.bondDataSource.data = this.filteredSecurities
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            this.filteredSecurities = this.originalEtfArray.filter(security => security.securityDescription.toLowerCase().includes(value));
            this.etfDataSource.data = this.filteredSecurities
        }
        else if (this.selectedAssetClass === "watchlist") {
            this.filteredSecurities = this.originalWatchlistArray.filter(security => security.securityDescription.toLowerCase().includes(value));
            this.watchlistSymbolsDataSource.data = this.filteredSecurities
        }
    }

    //.....................................................button clicks..............................................
    onCloseDialog() {
        this.matDialogRef.close();
    }
    onAddButton() {
        !this.securities.length ? this.toast.info('Please Select Security', 'Information') :
            this.matDialogRef.close({ 'markedSecurities': this.securities })
    }
    equitySymbol() {
        this.selectedCategory = "Equities"
        this.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES
        this.watchList = false
        this.getAllTrendingSymbol(AppConstants.ASSET_CLASS_ID_EQUITIES)
    }
    bondSymbol() {
        this.selectedCategory = "Bonds"
        this.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS
        this.watchList = false
        this.getAllTrendingSymbol(AppConstants.ASSET_CLASS_ID_BONDS)
    }
    etfSymbol() {
        this.selectedCategory = "ETFs"
        this.selectedAssetClass = AppConstants.ASSET_CLASS_ETF
        this.watchList = false
        this.getAllTrendingSymbol(AppConstants.ASSET_CLASS_ID_ETFS)
    }
    watchListSymbol() {
        this.selectedCategory = "Watch List"
        this.selectedAssetClass = 'watchlist'
        this.watchList = true
        this.getWatchListSymbols()
    }

    addToWatchList(element: any) {
        this.saveToWatchList(element)
    }
    removeFromWatchList(element: any) {
        this.deleteFromWatchList(this.userid, element)
    }
    onClickInfo(element) {
        this.dashboardService.setOrderData(element);
        this._router.navigate([`/trading-portal/trading-graph/${element.exchangeCode}/${element.marketCode}/${element.securityCode}`])
        this.matDialogRef.close();
    }

    callForSnglClick(element) {

        this.isSingleClick = true;
        setTimeout(() => {
            if (this.isSingleClick) {
                const requiredDataLength = 1;
                this.tradingPortalService.getKlineGraphDataDynamic(element.exchangeCode, element.securityCode, requiredDataLength).pipe(
                    takeUntil(this._unsubscribeAll)).subscribe((data) => {
                        element.securityTradedData = data[0]
                    });
                this.securities.push(element);
                this.matDialogRef.close({ 'markedSecurities': this.securities })
            }
        }, 250)
    }

    callForDblClick(element) {
        this.isSingleClick = false;

        const requiredDataLength = 1;
        this.tradingPortalService.getKlineGraphDataDynamic(element.exchangeCode, element.securityCode, requiredDataLength).pipe(
            takeUntil(this._unsubscribeAll)).subscribe((data) => {
                element.securityTradedData = data[0]
            });
        this.securities.push(element);
        this.matDialogRef.close({ 'markedSecurities': this.securities })

    }

    //.....................................................calling services..............................................

    getAllTrendingSymbol(assetClassId: number) {
        this.splash.show()
        this._authService.trendingSymbolAllAssetClassWise(AppConstants.exchangeCode, assetClassId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {


                this._symbolService.getFavourites(this.userid, AppConstants.exchangeCode).subscribe((res) => {
                    this.watchlistSymbolsDataSource.data = res

                    data.map(a => {

                        // let objectURL = 'data:image/png;base64,' + a.securityImage;
                        // a.src = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                        if (AppUtility.isValidVariable(a.securityStatsDTO)) {
                            if (Number(a.securityStatsDTO?.change) == 0) {
                                a.dir = 'zero'
                            }
                            else
                                a.dir = a.securityStatsDTO?.change.startsWith('-') ? 'down' : a.dir = 'up';
                        }
                        else
                            a.dir = 'zero'

                        //...............................................For Favourite Star.................................................
                        let include = this.watchlistSymbolsDataSource.data.some(res => res.securityCode === a.securityCode && res.marketCode === a.marketCode);
                        if (include) {
                            a.favourite = "true"
                        }
                        //..............................................................................................................

                        if (AppUtility.isValidVariable(a.securityStatsDTO)) {
                            a.change = a.securityStatsDTO?.change
                            a.changePercentage = a.securityStatsDTO?.changePerc
                        }
                        else {
                            a.change = 0.00
                            a.changePercentage = 0.00
                        }
                    });


                    if (assetClassId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
                        this.originalEquityArray = data
                        this.equitySymbolsDataSource.data = data
                        this.equityListArrayLength.next(this.equitySymbolsDataSource.data.length)
                    }
                    else if (assetClassId === AppConstants.ASSET_CLASS_ID_BONDS) {
                        this.originalBondArray = data
                        this.bondDataSource.data = data
                        this.bondListArrayLength.next(this.bondDataSource.data.length)
                    }
                    else if (assetClassId === AppConstants.ASSET_CLASS_ID_ETFS) {
                        this.originalEtfArray = data
                        this.etfDataSource.data = data
                        this.etfsListArrayLength.next(this.etfDataSource.data.length)
                    }
                    this.splash.hide()
                    // this.symbolsDataSource.data = this.equitySymbolsDataSource.data
                    // this.originalArray = this.symbolsDataSource.data
                }), (error => {
                    this.splash.hide()
                    this.toast.error('Something Went Wrong', 'Error')
                })

            }, (error => {
                this.splash.hide()
                this.toast.error('Something Went Wrong', 'Error')
            }));
    }

    getWatchListSymbols() {
        this.splash.show()
        this._symbolService.getFavourites(this.userid, AppConstants.exchangeCode).subscribe((data) => {
            data.map(a => {
                a.bidPrice = "0"
                a.offerPrice = "0"
                // ..............................Checking current stats date  and entry stats..........................
                let firstIndex = 0
                let toDate = AppUtility.formatDate(new Date())
                let statsDate
                if (a.securityStatsDTO[firstIndex] != undefined && a.securityStatsDTO != null) {
                    statsDate = AppUtility.formatDate_YYYY_MM_DD(a.securityStatsDTO[firstIndex].entryDatetime)
                }
                if (a.bestMarketDTO[firstIndex] != undefined && a.bestMarketDTO != null && a.bestMarketDTO.length > 0) {

                    if (a.bestMarketDTO[firstIndex].entryDatetime !== toDate) {
                        a.bestMarketDTO[firstIndex].bidQuantity = "0"
                        a.bestMarketDTO[firstIndex].bidPrice = "0"
                        a.bestMarketDTO[firstIndex].offerPrice = "0"
                        a.bestMarketDTO[firstIndex].offerQuantity = "0"
                    }
                    a.bidPrice = a.bestMarketDTO[0].bidPrice
                    a.offerPrice = a.bestMarketDTO[0].offerPrice
                }
                if (a.securityStatsDTO[firstIndex] != undefined && a.securityStatsDTO != null && a.securityStatsDTO.length > 0) {
                    if (statsDate !== toDate) {
                        a.securityStatsDTO[firstIndex].currentPrice = "0";
                        a.securityStatsDTO[firstIndex].totalTradedQuantity = "0";
                        a.securityStatsDTO[firstIndex].change = "0";
                        a.securityStatsDTO[firstIndex].changePerc = "0.00";
                        a.securityStatsDTO[firstIndex].lastDayClosePrice = "0";
                    }
                    if (AppUtility.isValidVariable(a.securityStatsDTO[0])) {
                        if (Number(a.securityStatsDTO[0].change) == 0) {
                            a.dir = 'zero'
                        }
                        else
                            a.dir = a.securityStatsDTO[0].change.startsWith('-') ? 'down' : a.dir = 'up';
                    }
                    else
                        a.dir = 'zero'



                    a.securityStatsDTO.change = a.securityStatsDTO[0]?.change
                }
                // ....................................................................
                a.change = a.securityStatsDTO[0]?.change
                a.changePercentage = a.securityStatsDTO[0]?.changePerc
                // let objectURL = 'data:image/png;base64,' + a.securityImage;
                // a.src = this.sanitizer.bypassSecurityTrustUrl(objectURL);

            });
            this.splash.hide()
            this.watchlistSymbols.next(data)
            this.watchlistSymbolsDataSource.data = data
            this.originalWatchlistArray = data
            // this.originalArray = this.watchlistSymbolsDataSource.data
            this.watchListArrayLength.next(this.watchlistSymbolsDataSource.data.length)
            // this.symbolsDataSource.data = this.watchlistSymbolsDataSource.data

        }, (error => {
            this.splash.hide()
            this.toast.error('Something Went Wrong', 'Error')
        }));
    }

    saveToWatchList(obj: any) {
        let data: any = {}
        data.userId = this.userid
        data.exchangeCode = obj.exchangeCode
        data.marketCode = obj.marketCode
        data.securityCode = obj.securityCode

        this._symbolService.saveFavourite(data).subscribe((response) => {

            let res = response.message
            if (res == "Symbol Already Exist in Favourite List") {
                this.toast.info('Symbol Already Exist in Favourite List')
            }
            else if (res == "Symbol Added to Favourite List") {
                this.watchListArrayLength.next(this.watchListArrayLength.value + 1)
                this.toast.success(res)
            }
        }, (error => {
            this.toast.error("Something went wrong", 'Error')
        }));

        // this.symbolsDataSource.data.map((res) => { if (res.securityCode == data.securityCode) { res.favourite = true } })
        // this.symbolsDataSource._updateChangeSubscription();
        if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
            this.equitySymbolsDataSource.data.map((res) => { if (res.securityCode == data.securityCode) { res.favourite = true } })
            this.equitySymbolsDataSource._updateChangeSubscription();
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
            this.bondDataSource.data.map((res) => { if (res.securityCode == data.securityCode) { res.favourite = true } })
            this.bondDataSource._updateChangeSubscription();
        }
        else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
            this.etfDataSource.data.map((res) => { if (res.securityCode == data.securityCode) { res.favourite = true } })
            this.etfDataSource._updateChangeSubscription();
        }

    }

    deleteFromWatchList(userid: Number, element: any) {
        let symbolid = element?.id

        if (element?.favourite) {
            this._symbolService.getFavourites(this.userid, AppConstants.exchangeCode).subscribe((data) => {
                data.map(a => {
                    let include = false
                    if (a.securityCode === element.securityCode) include = true
                    if (include) {
                        symbolid = a.id
                        this._symbolService.deleteFavourite(userid, symbolid).subscribe(() => {
                            this.watchListArrayLength.next(this.watchListArrayLength.value - 1)
                            this.toast.success('Symbol Removed from Favourite List')
                        }, (error => {
                            this.toast.error('Something Went Wrong', 'Error')
                        }));
                    }
                });
            })
            if (this.selectedAssetClass === AppConstants.ASSET_CLASS_EQUITIES) {
                this.equitySymbolsDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                this.equitySymbolsDataSource._updateChangeSubscription();
            }
            else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_BONDS) {
                this.bondDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                this.bondDataSource._updateChangeSubscription();
            }
            else if (this.selectedAssetClass === AppConstants.ASSET_CLASS_ETF) {
                this.etfDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                this.etfDataSource._updateChangeSubscription();
            }
        }

        else {
            this._symbolService.deleteFavourite(userid, symbolid).subscribe(() => {
                let index = this.watchlistSymbolsDataSource.data.indexOf(element)
                let numberOfElementToRemove = 1;
                if (index !== -1) { this.watchlistSymbolsDataSource.data.splice(index, numberOfElementToRemove) }
                // this.symbolsDataSource.data = this.watchlistSymbolsDataSource.data

                this.watchlistSymbolsDataSource._updateChangeSubscription();
                this.watchListArrayLength.next(this.watchListArrayLength.value - 1)
                this.toast.success('Symbol Removed from Favourite List')

                if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
                    this.equitySymbolsDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                    this.equitySymbolsDataSource._updateChangeSubscription();
                }
                else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_BONDS) {
                    this.bondDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                    this.bondDataSource._updateChangeSubscription();
                }
                else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
                    this.etfDataSource.data.map((res) => { if (res.securityCode == element.securityCode) { res.favourite = false } })
                    this.etfDataSource._updateChangeSubscription();
                }
            }, (error => {
                this.toast.error('Something Went Wrong', 'Error')
            }));
        }
    }

    getAllTradingSymbols() {
        this.getAllTrendingSymbol(AppConstants.ASSET_CLASS_ID_EQUITIES)
        this.getAllTradingSymbolsCount()
    }

    getAllTradingSymbolsCount() {
        this.getSymbolCount(AppConstants.ASSET_CLASS_ID_EQUITIES)
        this.getSymbolCount(AppConstants.ASSET_CLASS_ID_BONDS)
        this.getSymbolCount(AppConstants.ASSET_CLASS_ID_ETFS)
    }

    getSymbolCount(assetCode: Number) {

        this._authService.trendingSymbolAllAssetClassWiseCount(AppConstants.exchangeCode, assetCode).subscribe((res) => {

            if (assetCode == AppConstants.ASSET_CLASS_ID_EQUITIES) {
                this.equityListArrayLength.next(res.securityCount)
            }
            else if (assetCode == AppConstants.ASSET_CLASS_ID_BONDS) {
                this.bondListArrayLength.next(res.securityCount)
            }
            else if (assetCode == AppConstants.ASSET_CLASS_ID_ETFS) {
                this.etfsListArrayLength.next(res.securityCount)
            }

        })
    }

}

