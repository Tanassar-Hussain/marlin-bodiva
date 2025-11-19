import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, Input,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { Chart, dispose, init } from "klinecharts";
import { filter, takeUntil } from "rxjs/operators";
import { TradingPortalService } from "../../trading-portal.service";
import { FuseMediaWatcherService } from "../../../../../../@fuse/services/media-watcher";
import { BehaviorSubject, from, Subject } from "rxjs";
import { TradingGraphKline } from "../../trading-portal-types/trading-graph.types";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router"
import { MatDialog } from "@angular/material/dialog";
import { TradingDashboardBuySellComponent } from '../trading-dashboard-buysell/trading-dashboard-buysell.component';
import { AppConstants, AppUtility } from "../../../../../app.utility"
import { TradingDashboardService } from "../trading'dashboard.service"
import { DomSanitizer } from '@angular/platform-browser';
import { upperCase, upperFirst } from 'lodash';
import { UserService } from 'app/core/user/user.service';
import { formatDate } from '@angular/common';
import { DashboardService } from 'app/modules/admin/dashboard/dashboard.service';
import { WebSocketService } from 'app/services/socket/web-socket.service';
import { ShareOrderService } from 'app/modules/admin/oms/order/order.service';
import { NewOrderAll } from 'app/modules/admin/oms/order/new-order-all/new-order-all';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { ListingService } from 'app/services/listing.service';
import { AuthService2 } from 'app/services/auth2.service';

@Component({
    selector: 'trading-dashboard-graph',
    templateUrl: './trading-dashboard-graph.component.html',
    styleUrls: ['../trading-dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradingDashboardGraphComponent implements OnInit, AfterViewInit {

    graphIntervals = [
        { key: '1D', value: '1' },
        { key: '1W', value: '7' },
        { key: '15D', value: '15' },

        { key: '1M', value: '30' },
        { key: '3M', value: '90' },
        { key: '6M', value: '180' },

        { key: '1Y', value: '365' },
        { key: '2Y', value: '730' },
        { key: '3Y', value: '1095' },
        { key: '4Y', value: '1460' },
        { key: '5Y', value: '1825' },


    ];

    chartTypes = [
        { key: 'candle_solid', text: 'Candle Solid' },
        { key: 'candle_stroke', text: 'Candle Stroke' },
        { key: 'candle_up_stroke', text: 'Candle Up Stroke' },
        { key: 'candle_down_stroke', text: 'Candle Down Stroke' },
        { key: 'ohlc', text: 'OHLC' },
        { key: 'area', text: 'Area' }
    ];
    periodicData: any = { 'today': 0, 'week': 0, 'month': 0, 'quarter': 0, 'year': 0, 'all': 0 }

    view: string;
    technicalIndicator: string;
    drawingText: string;
    graphData: TradingGraphKline;
    exchangeId: string;
    symbolCode: string;
    marketCode: string;
    @Input() item;
    index: number = 0;
    private kLineChart: Chart;
    private paneId: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    symbolDetail = {
        exchangeCode: "",
        symbolCode: "",
        marketCode: "",
    }
    buyColor: String
    sellColor: String
    buyColorBar: String
    sellColorBar: String
    currentMarketPrice = new BehaviorSubject<number>(0);
    change = new BehaviorSubject<number>(0);
    changePercent = new BehaviorSubject<number>(0);
    securityImage = new BehaviorSubject<any>("");
    assetClass = new BehaviorSubject<String>("Not Defined");
    marketStatus = new BehaviorSubject<String>("Unknown");
    symbolBoughtPercent = new BehaviorSubject<String>("0%");
    symbolSoldPercent = new BehaviorSubject<String>("0%");
    symbolBoughtPercentBar = new BehaviorSubject<String>("");
    symbolSoldPercentBar = new BehaviorSubject<String>("");
    buyPercent: String = "30%"
    sellPercent: String = "70%"
    hours: Number = 24
    colorOnChange = new BehaviorSubject<String>("");
    activeColor: any;
    userId: any;
    defaultCount: number = AppConstants.DEFAULT_GRAPH_COUNT
    sharedOrderData: any;
    isGraphComp: boolean = true;

    @ViewChild('newOrderAll') newOrderAll: NewOrderAll;
    lang: string;
    selectedAssetClass: string;
    marketStatusObj: any
    bondType: string = ''

    constructor(
        private tradingPortalService: TradingPortalService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private route: ActivatedRoute,
        private _matDialog: MatDialog,
        private tradingDashBoardService: TradingDashboardService,
        private sanitizer: DomSanitizer,
        private _userService: UserService,
        private dashboardService: DashboardService,
        private router: Router, public socket: WebSocketService,
        public sharedOrderService: ShareOrderService,
        private translate: TranslateService,
        private splash: FuseLoaderScreenService,
        private listingService: ListingService,
        public userService: AuthService2,) {
        let user = JSON.parse(sessionStorage.getItem('user'));
        this.userId = user.id;

        //_______________________________for ngx_translate_________________________________________
        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________

    }

    ngOnInit(): void {

        this.view = 'candle_solid';
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                if (event) this.settingAllData(this.defaultCount);
            });
        this.initializeAppConstants();
    }

    ngAfterViewInit(): void {
        this.kLineChart = init('technical-indicator-k-line');
        this.settingAllData(this.defaultCount);
        this.symbolDetailService()
        this.getSymbolDetail();
        this.symbolDetail.exchangeCode = this.exchangeId
        this.symbolDetail.marketCode = this.marketCode
        this.symbolDetail.symbolCode = this.symbolCode
        this.sharedOrderService.setExchange(this.symbolDetail.exchangeCode);
        this.sharedOrderService.setMarket(this.symbolDetail.marketCode);
        this.sharedOrderService.setSymbol(this.symbolDetail.symbolCode);

        this.socket.fetchFromChannel("best_orders", { "exchange": this.symbolDetail.exchangeCode, "market": this.symbolDetail.marketCode, "symbol": this.symbolDetail.symbolCode });
        this.getPeriodicData();
    }

    getSymbolDetail() {
        this.listingService.getSecurityDetailsByCode(this.symbolCode).subscribe(res => {

            this.sharedOrderData = res[0]

            sessionStorage.setItem('symbolData', JSON.stringify(this.sharedOrderData))
        }, (error => {

        }))
    }



    showModalForOrder(side: string) {

        // this.sharedOrderData = JSON.parse(localStorage.getItem("symbolData") || "[]");
        if (AppUtility.isValidVariable(this.sharedOrderData) && AppUtility.isValidVariable(side)) {
            if (this.sharedOrderData.assetClass.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_EQUITIES;
                this.newOrderAll.show(this.sharedOrderData, side, this.selectedAssetClass);
                //  this.newOrderAll.clickEquityTab();
            }
            else if (this.sharedOrderData.assetClass.assetId === AppConstants.ASSET_CLASS_BONDS_ID) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_BONDS;
                this.newOrderAll.show(this.sharedOrderData, side, this.selectedAssetClass);
                //  this.newOrderAll.clickBondsTab();
            }
            else if (this.sharedOrderData.assetClass.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
                this.selectedAssetClass = AppConstants.ASSET_CLASS_ETF;
                this.newOrderAll.show(this.sharedOrderData, side, this.selectedAssetClass);
                //  this.newOrderAll.clickETFTab();
            }

        }
    }

    settingAllData(days: number) {

        if (this.item) {

            this.exchangeId = this.item.exchange;
            this.marketCode = this.item.market;
            this.symbolCode = this.item.symbolCode;
            let x = {
                "securityCode": this.symbolCode,
                "marketCode": this.marketCode,
                "exchangeCode": this.exchangeId
            }

            this.getSymbolDetail();
            this.dashboardService.setTopSecurity(x);

        } else {
            this.exchangeId = this.route.snapshot.params['exchange'];
            this.marketCode = this.route.snapshot.params['marketCode'];
            this.symbolCode = this.route.snapshot.params['symbolCode'];
            let x = {
                "securityCode": this.symbolCode,
                "marketCode": this.marketCode,
                "exchangeCode": this.exchangeId
            }

            this.dashboardService.setTopSecurity(x);

        }
        this.splash.show();
        this.tradingPortalService.getKlineGraphDataDynamic(this.exchangeId, this.symbolCode, days).pipe(
            takeUntil(this._unsubscribeAll)).subscribe((data) => {
                 
                if (this.index === 0) {
                    this.kLineChart.createTechnicalIndicator({ name: 'VOL', calcParams: [] }, false);
                    this.kLineChart.createTechnicalIndicator('MA', false, { id: 'candle_pane' });
                    this.setLanguage();
                    this.setChartType('area');
                }
                this.index++;
                const d = data.reverse();
                this.kLineChart.applyNewData(d);
                this.kLineChart.zoomAtDataIndex(20, 50);
                this.kLineChart.scrollToRealTime(0);
                this.kLineChart.isZoomEnabled();
                this.kLineChart.setZoomEnabled(true);
                this.kLineChart.removeAnnotation()
                this.kLineChart.setStyleOptions({
                    grid: {
                        show: true,
                        horizontal: {
                            show: true,
                            size: 1,
                            color: '#18223b',
                            style: 'dashed',
                            dashedValue: [2, 2]
                        },
                        vertical: {
                            show: true,
                            size: 1,
                            color: '#18223b',
                            style: 'dashed',
                            dashedValue: [2, 2]
                        }
                    },
                    separator: {
                        color: '#444444',
                        size: 1,
                        fill: false
                    }
                })
                this.splash.hide();
            }, (error => {
                this.splash.hide();
                if (error = "204-No Content") {
                    this.kLineChart.applyNewData([]);
                }


            }));
    }

    setLanguage() {

        let levelArray = [];
        this.translate.get(['Translation.Tenure', 'Translation.Open', 'Translation.Close', 'Translation.High', 'Translation.Low', 'Translation.Volume']).subscribe((res: any) => {
            levelArray.push(res['Translation.Tenure'], res['Translation.Open'], res['Translation.Close'], res['Translation.High'], res['Translation.Low'], res['Translation.Volume']);

            let labels = [];
            let cmbItem = {};

            for (let i = 0; i < levelArray.length; i++) {
                cmbItem = { 'value': levelArray[i] + ': ' }
                labels.push(cmbItem);
            }
            levelArray = labels;
        })

        this.kLineChart.setStyleOptions({
            candle: {
                tooltip: {
                    labels: [levelArray[0].value, levelArray[1].value, levelArray[2].value, levelArray[3].value, levelArray[4].value, levelArray[5].value],
                    text: {
                        show: true,
                        // 'fill' | 'stroke' | 'stroke_fill'
                        style: 'fill',
                        size: 13,
                        paddingLeft: 4,
                        paddingTop: 4,
                        paddingRight: 4,
                        paddingBottom: 20,
                        // 'solid' | 'dashed'
                        borderStyle: 'solid',
                        borderSize: 1,
                        borderDashedValue: [2, 2],
                        color: '#FFFFFF',
                        family: 'Helvetica Neue',
                        weight: 'normal',
                        borderRadius: 2
                    }
                }
            }
        });
    }

    initializeAppConstants() {
        this.buyColor = AppConstants.buyColor
        this.sellColor = AppConstants.sellColor
        this.buyColorBar = AppConstants.buyColor
        this.sellColorBar = AppConstants.sellColor
    }

    symbolDetailService() {
        this.tradingDashBoardService.getSecurityStats(this.exchangeId, this.symbolCode).subscribe((res) => {

            //current price check
            let toDate = AppUtility.formatDate(new Date())
            let statsDate = AppUtility.formatDate_YYYY_MM_DD(res[0].entryDatetime)

            if (statsDate !== toDate) {
                res[0].currentPrice = res[0].lastTradePrice;
                if (Number(res[0].currentPrice) == 0) {
                    res[0].currentPrice = res[0].open
                }

            }
            else {
                if (Number(res[0].currentPrice) == 0) {
                    res[0].currentPrice = res[0].open
                }
            }
            //current price check


            let currentPrice = Number(res[0].currentPrice)
            let change = Number(res[0].change)
            let changePer = 0
            if (change != 0 && currentPrice != 0) {
                changePer = change / currentPrice * 100
            }
            // changePer = this.roundDownSignificantDigits(changePer, 4)
            if (change < 0) {
                this.colorOnChange.next(AppConstants.sellColor)
            }
            else if (change > 0) {
                this.colorOnChange.next(AppConstants.buyColor)
            }
            else this.colorOnChange.next("#FFFFFF")


            this.currentMarketPrice.next(currentPrice);
            this.change.next(change);
            this.changePercent.next(changePer)
        })

        this.tradingDashBoardService.getSecurityImage(this.exchangeId, this.symbolCode).subscribe((res) => {


            let img;
            if (AppUtility.isValidVariable(res.securityStatsDTO)) {
                img = (res.securityStatsDTO.imgUrl == null) ? 'assets/img/settlement.png' : res.securityStatsDTO.imgUrl;
            }
            if (!AppUtility.isValidVariable(res.securityStatsDTO)) {
                img = 'assets/img/settlement.png';
            }

            let assetCls = res.assetClass.assetName
            this.assetClass.next(assetCls)
            this.securityImage.next(img)
        })

        this.tradingDashBoardService.getMarketStatus(this.exchangeId, this.marketCode).subscribe((res) => {

            let Status = res.marketState.code
            this.marketStatus.next(Status)

            if (Status == "Open") {
                this.activeColor = AppConstants.buyColor
            }
            else this.activeColor = AppConstants.sellColor
        })

        this.getBuySellPercetage(this.exchangeId, this.symbolCode, this.hours)

    }

    getBuySellPercetage(exchangeId, symbolCode, hours) {
        this.tradingDashBoardService.getBuySellPercentage(exchangeId, symbolCode, hours).subscribe((res) => {
            let bought = 0
            let sold = 0
            let Total = res.length
            if (Total == 0) {
                this.symbolBoughtPercentBar.next("100%")
                this.symbolSoldPercentBar.next("0%")
                this.symbolBoughtPercent.next("0%")
                this.symbolSoldPercent.next("0%")
                this.buyColorBar = "#808080"
            }
            else {
                res?.forEach(element => {
                    if (element.buySell == "B") {
                        bought += 1
                    }
                    else if (element.buySell == "S") {
                        sold += 1
                    }
                });
                this.buyColorBar = AppConstants.buyColor
                let boughtPercent = bought / Total * 100
                boughtPercent = this.roundDownSignificantDigits(boughtPercent, 2)
                this.buyPercent = boughtPercent.toString() + "%"

                let soldPercent = sold / Total * 100
                soldPercent = this.roundDownSignificantDigits(soldPercent, 2)
                this.sellPercent = soldPercent.toString() + "%"

                this.symbolBoughtPercent.next(this.buyPercent)
                this.symbolSoldPercent.next(this.sellPercent)
                this.symbolBoughtPercentBar.next(this.buyPercent)
                this.symbolSoldPercentBar.next(this.sellPercent)
            }
        })

    }

    convertFirstLetterToUpperCase(str) {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    setShapeType(shapeName: string) {
        this.drawingText = shapeName;
        this.kLineChart.createShape(shapeName);
    }

    removeAllShape() {
        this.kLineChart.removeShape();
    }

    setCandleTechnicalIndicator(type) {
        this.kLineChart.createTechnicalIndicator(type, false, { id: 'candle_pane' });
    }

    setSubTechnicalIndicator(type) {
        this.technicalIndicator = type;
        this.kLineChart.createTechnicalIndicator(type, false, { id: this.paneId, height: 40 });
    }

    setChartType(type) {
        this.view = type;
        this.kLineChart.setStyleOptions({
            candle: {
                type
            }
        });
        this._changeDetectorRef.detectChanges();
    }

    setIntervalsGraph(interval) {
        this.defaultCount = interval;
        this.settingAllData(this.defaultCount)
        this._changeDetectorRef.detectChanges();
    }

    ngOnDestroy(): void {
        dispose('technical-indicator-k-line')
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        sessionStorage.removeItem('symbolData')
    }

    buySellDialogue(buySell: any) {
        this._matDialog.open(TradingDashboardBuySellComponent, {
            autoFocus: false,
            position: { top: '8%' },
            width: "400px",
            data: {
                action: buySell,
                symbolDetail: this.symbolDetail,
                symbolCode: this.symbolCode,
                marketCode: this.marketCode,
                exchangeCode: this.exchangeId,
                price: this.currentMarketPrice.value

            },

        }).afterClosed().subscribe((data) => {
            setTimeout(() => {
                this.getBuySellPercetage(this.exchangeId, this.symbolCode, this.hours)
            }, 1000);

        })
    }

    randomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    roundDownSignificantDigits(number, decimals) {
        let significantDigits = (parseInt(number.toExponential().split('e-')[1])) || 0;
        let decimalsUpdated = (decimals || 0) + significantDigits - 1;
        decimals = Math.min(decimalsUpdated, number.toString().length);

        return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
    }

    getPeriodicData() {
        this.tradingPortalService.getPeriodicData(this.symbolDetail.exchangeCode, this.symbolDetail.marketCode, this.symbolDetail.symbolCode).subscribe(res => {
            res.todayDir = res.today.toString().startsWith('-') ? 'down' : res.todayDir = 'up';
            res.allDir = res.all.toString().startsWith('-') ? 'down' : res.allDir = 'up';
            res.days7Dir = res.days7.toString().startsWith('-') ? 'down' : res.days7Dir = 'up';
            res.days30Dir = res.days30.toString().startsWith('-') ? 'down' : res.days30Dir = 'up';
            res.days90Dir = res.days90.toString().startsWith('-') ? 'down' : res.days90Dir = 'up';
            res.year1Dir = res.year1.toString().startsWith('-') ? 'down' : res.year1Dir = 'up';
            this.periodicData = res

        })
    }

    setBondType(bondType: any) {
        this.bondType = bondType.fisDetail.bondType.bondType;
    }


}
