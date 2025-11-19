import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from "@angular/material/dialog";
import {
    SymbolAddDialogComponent
} from "../../../modules/common-components/symbol-add-dialog/symbol-add-dialog.component";
import { DomSanitizer } from "@angular/platform-browser";
import { fuseAnimations } from "@fuse/animations";
import { ToastrService } from "ngx-toastr";
import { SymbolAddDialogComponentService } from 'app/modules/common-components/symbol-add-dialog/symbol-add-dialog.component.service';
import { TradingPortalService } from 'app/modules/admin/trading-portal/trading-portal.service';
import { TradingDashboardService } from 'app/modules/admin/trading-portal/trading-dashboard/trading\'dashboard.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen/splash-screen.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { DashboardSidebar } from 'app/modules/admin/dashboard/right-sidebar/dashboard-sidebar';
import { WebSocketService } from 'app/services/socket/web-socket.service';
import { TranslateService } from '@ngx-translate/core';
import { ListingService } from 'app/services/listing.service';
import { DatePipe } from '@angular/common';
import * as wjcCore from "@grapecity/wijmo";
import * as wjcInput from "@grapecity/wijmo.input";
import * as $ from 'jquery';

@Component({
    selector: 'classy-layout',
    templateUrl: './classy.component.html',
    styleUrls: ['./classy.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,

})
export class ClassyLayoutComponent implements OnInit, OnDestroy, AfterViewInit {



    isScreenSmall: boolean;
    navigation: Navigation;
    user: User;
    userid: Number;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    langs = this.translationService.getAvailableLangs();
    activelang = this.translationService.getActiveLang();
    currentLang: any;
    allSecurities: any[] = [];
    tradeType: boolean = false;
    tradeTypeDisabled: boolean = false;
    currentTradeType: string;
    claims: any;
    publicMenu = true
    @ViewChild(DashboardSidebar) dashboardSidebar: DashboardSidebar;
    lang: string;
    actualTradeText: any;
    virtualTradeText: any;
    subscriptionStrength: number = 0;
    subscriptionStrengthIntimation: number = 0;
    userType: string;
    dueDate: Date = null;
    validTill: Date = null;
    totalDiffDaysSubs: number = null;
    totalDiffDaysUntilToday: number = null;
    subscriptionName: String = "";
    remainingDaysTitle: string = "";
    isConnected: boolean = false;
    nodeStatusConnected: String = "";
    nodeStatusDisConnected: String = "";
    isNoPayment: boolean = false;
    @ViewChild('popup1') popup1: wjcInput.Popup
    isOpened: boolean = false;
    isAdvancedPayment: boolean = false;
    minSubscriptionStrength: number = 0;
    intimationDays: number = 0;
    marlinAdmin: string = AppConstants.USER_TYPE_MARLIN_ADMIN_CODE;
    billing: String = "";
    showWarning: boolean = true;


    constructor(
        private _activatedRoute: ActivatedRoute,
        public _router: Router,
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private translationService: TranslocoService,
        private _matDialog: MatDialog,
        private sanitizer: DomSanitizer,
        private toast: ToastrService,
        private _symbolService: SymbolAddDialogComponentService,
        private tradingPortalService: TradingPortalService,
        private tradingDashboardService: TradingDashboardService,
        private splash: FuseSplashScreenService,
        private socket: WebSocketService,
        private translate: TranslateService,
        private listingService: ListingService,
        private datePipe: DatePipe,
        private webSocketService: WebSocketService

    ) {
        this.claims = AppConstants.claims2;
        if (AppUtility.isValidVariable(this.claims) && AppUtility.isValidVariable(this.claims.user) && this.claims.user.userType == AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
            this.publicMenu = false;
        }

        this.currentLang = localStorage.getItem("lang")
        if (this.currentLang != null) {
            this.translationService.setActiveLang(this.currentLang)
            this.activelang = this.translationService.getActiveLang();
        }

        this.currentTradeType = sessionStorage.getItem("tradeType");
        if (this.currentTradeType != undefined || this.currentTradeType != '' || this.currentTradeType != null) {

            if (this.currentTradeType === AppConstants.ACTUAL_TRADE_TYPE) {
                this.tradeType = true;
                AppConstants.tradeType = AppConstants.ACTUAL_TRADE_TYPE;
                sessionStorage.setItem('tradeType', AppConstants.ACTUAL_TRADE_TYPE);
            }
            if (this.currentTradeType === AppConstants.VIRTUAL_TRADE_TYPE) {

                this.tradeType = false;
                AppConstants.tradeType = AppConstants.VIRTUAL_TRADE_TYPE;
                sessionStorage.setItem('tradeType', AppConstants.VIRTUAL_TRADE_TYPE);
            }
        }


        let user = JSON.parse(sessionStorage.getItem('user'));
        this.userid = user?.id;
        this.checkTradeType();




        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

        this.userType = AppConstants.userType;

        if (this.lang === 'pt') {
            this.nodeStatusConnected = "Nó conectado";
            this.nodeStatusDisConnected = 'Nó desconectado';
        } else {
            this.nodeStatusConnected = "Node Connected";
            this.nodeStatusDisConnected = 'Node Disconnected';
        }

        this.getToggleTranslation();
        this.checkSubscriptionExist();



    }

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        this._userService.user$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((user: User) => {
                this.user = user;
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        // this._userService.getAllSecurities().subscribe((data) => {

        // });

        this.getRibbonOnConstruct()

        this.onFetchingStatsData();




    }





    ngAfterViewInit(): void {

        this.checkNodeConnectionStatus();

    }




    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }






    enter(event) {
        this.popup1.show(true);
    }


    leave() {
        this.popup1.hide(true);
    }


    public checkNodeConnectionStatus = () => {

        this.webSocketService.getConnectionStatus().subscribe((res: any) => {
            if (AppUtility.isValidVariable(res)) {
                if (res === true) {
                    this.isConnected = true;
                }
                else {
                    this.isConnected = false;
                }
            }
        })

    }




    public checkSubscriptionExist = () => {
         
        if (AppUtility.isValidVariable(AppConstants.participantId) && (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE 
            || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE)) {
            this.listingService.getSubscriptionByParticipant(AppConstants.participantId).subscribe((res: any) => {
                if (AppUtility.isValidVariable(res)) {
                    this.getSubscription();
                    if (AppUtility.isValidVariable(res.pricing)) {
                        this.subscriptionName = res.pricing.subscriptionName;
                        this.dueDate = res.startDate;
                        this.intimationDays = res.intimationDays;
                        this.showWarning = res.showWarning;
                        if(res.pricing.billingCode === AppConstants.BILLING_CODE_MONTHLY){  this.billing  = AppConstants.BILLING_NAME_MONTHLY; }
                        else if(res.pricing.billingCode === AppConstants.BILLING_CODE_BI_MONTHLY){  this.billing  = AppConstants.BILLING_NAME_BI_MONTHLY; }
                        else if(res.pricing.billingCode === AppConstants.BILLING_CODE_QUARTERLY){  this.billing  = AppConstants.BILLING_NAME_QUARTERLY; }
                        else if(res.pricing.billingCode === AppConstants.BILLING_CODE_BI_ANNUAL){  this.billing  = AppConstants.BILLING_NAME_BI_ANNUAL; }
                        else if(res.pricing.billingCode === AppConstants.BILLING_CODE_ANNUAL){  this.billing  = AppConstants.BILLING_NAME_ANNUAL; }
                       
                    }
                }
            }, error => {
                console.log(error);
            });
        }

    }









    public getSubscription = () => {
          
        this.validTill = null;
        this.totalDiffDaysSubs = null;
        if (AppUtility.isValidVariable(AppConstants.participantId) && (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE 
            || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE)) {
            this.listingService.getSubscriptionPaymentByParticipant(AppConstants.participantId).subscribe((res: any) => {
                
                if (!AppUtility.isEmptyArray(res)) {
                    if (res.length === 1) {
                        this.dueDate = new Date(res[0].dueDate);
                        this.validTill = res[0].validTill;
                        this.subscriptionName = res[0].productSubscriptionName;
                    }
                    else if (res.length > 1) {
                        const dueDates = [];
                       /////////////////////////////////////////// Added on 12-06-2023 by Faizan
                        res.forEach((element => {                                             
                            const todayDateForDue = new Date();                                
                            const dueDateForDue = new Date(element.dueDate);
                            const todayTime = todayDateForDue.getTime();
                            const dueDateTime = dueDateForDue.getTime();
                           // if(dueDateTime <= todayTime){
                                dueDates.push(new Date(element.dueDate));
                           // }
        
                        }) )
                         //////////////////////////////////////////////////////////////////////////
                        
                         // this.dueDate = new Date(Math.max(...res.map(date => Date.parse(date.dueDate))));
                        this.dueDate = new Date(Math.max(...dueDates.map(date => Date.parse(date))));
                        this.validTill = new Date(Math.max(...res.map(date => Date.parse(date.validTill))));
                        res.forEach(element => {
                            if (this.datePipe.transform(this.dueDate, 'yyyy-MM-dd') === element.dueDate && this.datePipe.transform(this.validTill, 'yyyy-MM-dd') === element.validTill) {
                                this.subscriptionName = element.productSubscriptionName;
                            }
                        })
                    }

                    if (AppUtility.isValidVariable(this.dueDate) && AppUtility.isValidVariable(this.validTill)) {
                        const todayDate = new Date();
                        const todayDateString = this.datePipe.transform(todayDate , "yyyy-MM-dd");
                        const dueDateD = new Date(this.dueDate);
                        const dueDateString = this.datePipe.transform(dueDateD , "yyyy-MM-dd");
                        const todayTime = todayDate.getTime();
                        const dueDateTime = dueDateD.getTime();

                        if (dueDateTime <= todayTime) {
                            /////////////////////////////////////////////////
                            //This case executes when payment is not advanced
                            /////////////////////////////////////////////////
                            this.isAdvancedPayment = false;
                            const date1 = new Date(this.dueDate);
                            const date2 = new Date(this.validTill);
                            const timeDiff = Math.abs(date1.getTime() - date2.getTime());
                            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            this.totalDiffDaysSubs = diffDays; //Total Days between due date and valid till
                            
                            if (this.totalDiffDaysSubs !== 0 && (this.intimationDays !== 0 && AppUtility.isValidVariable(this.intimationDays))) {
                                this.minSubscriptionStrength = (this.intimationDays / this.totalDiffDaysSubs) * 100;
                                if(this.minSubscriptionStrength > 0){
                                    this.minSubscriptionStrength = Math.abs(this.minSubscriptionStrength - 100);
                                }
                            }

                            let today = new Date();
                            const timeDiffUntilToday = Math.abs(date1.getTime() - today.getTime());
                            const daysDiffUntilToday = Math.ceil(timeDiffUntilToday / (1000 * 3600 * 24));
                            this.totalDiffDaysUntilToday = daysDiffUntilToday;
                            var remainingDays = (this.totalDiffDaysSubs - daysDiffUntilToday) + 1;
                            if(remainingDays === 0){  //Subscription not count current day of Valid Till, Thats why we add +1 in remaining days
                                remainingDays = remainingDays + 1;
                            }
 
                            if (remainingDays > 0) {
                                   
                                this.subscriptionStrength = ((remainingDays) / (this.totalDiffDaysSubs)) * 100;
                                if(this.subscriptionStrength > 0){
                                    this.subscriptionStrength = Math.abs(this.subscriptionStrength - 100);
                                    if((todayDateString === dueDateString)){   //This case executes when Due Date Start from current day
                                        this.subscriptionStrength = 1;
                                   }
                                }
                                if (this.lang === 'pt') { this.remainingDaysTitle = remainingDays + " " + "Dias restantes" } 
                                else { this.remainingDaysTitle = remainingDays + " " + "day(s) remaining" }
                                this.isNoPayment = false;
                            }

                            if (this.subscriptionStrength == 0) {
                                let currentDate = new Date(this.validTill);
                                const tomorrow = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
                                if (this.lang === 'pt') { this.remainingDaysTitle = "Pagamento Vencido" + " - " + this.datePipe.transform(tomorrow, 'yyyy-MM-dd') }
                                else { this.remainingDaysTitle = "Payment Due" + " - " + this.datePipe.transform(tomorrow, 'yyyy-MM-dd') }
                                this.isNoPayment = true;
                            }
                        }
                        else {  
                            /////////////////////////////////////////////
                            //This case executes when payment is advanced
                            /////////////////////////////////////////////
                            this.isAdvancedPayment = true;
                            this.subscriptionStrength = Math.abs(this.subscriptionStrength - 100);
                            if (this.lang === 'pt') { this.remainingDaysTitle = "Válida até" + " - " + this.datePipe.transform(this.validTill, 'yyyy-MM-dd') }
                            else { this.remainingDaysTitle = "Valid Till" + " - " + this.datePipe.transform(this.validTill, 'yyyy-MM-dd') };
                        }
                    }

                }
                else {
                    /////////////////////////////////////////////////
                    //This Case Executues When There is no Payment//
                    ////////////////////////////////////////////////
                    this.validTill = this.dueDate;
                    if (AppUtility.isValidVariable(this.dueDate) && AppUtility.isValidVariable(this.validTill)) {
                        const todayDate = new Date();
                        const todayDateString = this.datePipe.transform(todayDate , "yyyy-MM-dd");
                        const dueDateD = new Date(this.dueDate);
                        const dueDateString = this.datePipe.transform(dueDateD , "yyyy-MM-dd");
                        const todayTime = todayDate.getTime();
                        const dueDateTime = dueDateD.getTime();

                        if (dueDateTime >= todayTime) {
                            this.isAdvancedPayment = false;
                            const date1 = new Date();
                            const date2 = new Date(this.validTill);
                            const timeDiff = Math.abs(date1.getTime() - date2.getTime());
                            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            this.totalDiffDaysSubs = diffDays; //Total Days between due date and valid till
                            
                            if (this.totalDiffDaysSubs !== 0 && (this.intimationDays !== 0 && AppUtility.isValidVariable(this.intimationDays))) {
                                  if(this.totalDiffDaysSubs <= this.intimationDays){
                                    if (this.lang === 'pt') { this.remainingDaysTitle = this.totalDiffDaysSubs + " " + "Dias restantes" } 
                                    else { this.remainingDaysTitle = this.totalDiffDaysSubs + " " + "day(s) remaining" }
                                    this.isNoPayment = true;
                                  }
                            }
                        }else{
                            this.subscriptionStrength = 0;
                            if (this.lang === 'pt') { this.remainingDaysTitle = "Pagamento Vencido" + " - " + this.datePipe.transform(this.dueDate, 'yyyy-MM-dd') }
                            else { this.remainingDaysTitle = "Payment Due" + " - " + this.datePipe.transform(this.dueDate, 'yyyy-MM-dd') };
                            this.isNoPayment = true;
                        }
                    } 
                }

                if ((this.subscriptionStrength > this.minSubscriptionStrength) && !this.isAdvancedPayment && !this.isNoPayment && this.showWarning) {
                    this.enter(event);
                }else if(this.isNoPayment && !this.isAdvancedPayment && this.showWarning){
                    this.enter(event);
                }
                
            }, (error) => {
                console.log(error);
                
            })
        }
    }






    public getToggleTranslation = () => {
        this.translate.get(['Translation.Actual Trade', 'Translation.Virtual Trade']).subscribe((res: any) => {
            this.actualTradeText = res['Translation.Actual Trade'];
            this.virtualTradeText = res['Translation.Virtual Trade'];
        });
    }




    public checkTradeType = () => {
        if (AppConstants.participantId === null) {
            this.tradeType = false;
            this.tradeTypeDisabled = true;
            AppConstants.tradeType = 'vTrade';
            sessionStorage.setItem('tradeType', 'vTrade');
        }
        else if (AppConstants.participantId !== null && AppUtility.isValidVariable(this.currentTradeType)) {
            if (this.currentTradeType === 'vTrade') {
                this.tradeType = false;
                this.tradeTypeDisabled = false;
                AppConstants.tradeType = 'vTrade';
                sessionStorage.setItem('tradeType', 'vTrade');
            }
            if (this.currentTradeType === 'gTrade') {
                this.tradeType = true;
                this.tradeTypeDisabled = false;
                AppConstants.tradeType = 'gTrade';
                sessionStorage.setItem('tradeType', 'gTrade');
            }

        }
        else {
            this.tradeType = true;
            this.tradeTypeDisabled = false;
            AppConstants.tradeType = 'gTrade';
            sessionStorage.setItem('tradeType', 'gTrade');
        }
    }





    public onChangeTrade = (event) => {

        if (AppConstants.participantId !== null && event === false) {
            this.tradeType = true;
            this.tradeTypeDisabled = false;
            AppConstants.tradeType = 'vTrade';
            sessionStorage.setItem('tradeType', 'vTrade');

        }

        if (AppConstants.participantId !== null && event === true) {
            this.tradeType = false;
            this.tradeTypeDisabled = false;
            AppConstants.tradeType = 'gTrade';
            sessionStorage.setItem('tradeType', 'gTrade');

        }
        setTimeout(() => window.location.reload(), 500);
    }












    public drawerCloseOpen = () => {
        this._userService.setOC(true);
    }













    toggleNavigation(name: string): void {
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);
        if (navigation) navigation.toggle();
    }

    setActiveLang(lang: any) {
        this.translationService.setActiveLang(lang)
        this.activelang = lang
        localStorage.setItem("lang", lang)
        window.location.reload();
    }

    onClickAddSymbols() {
        this._matDialog.open(SymbolAddDialogComponent, {
            autoFocus: false,
            position: { top: '5%' },
            data: { 'allPreviousSymbols': this.allSecurities }
        }).afterClosed().subscribe((data) => {
            data?.markedSecurities?.map((ele) => {

                if (ele.securityImage != null) {
                    let objectURL = 'data:image/png;base64,' + ele.securityImage;
                    ele.src = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                }
                else {
                    ele.src = "assets/images/marlin-dashboard/silver.png"
                }
                if (ele.assetClass == null) {
                    this.toast.error('Something Went Wrong With Asset Class', 'Error')
                }
                if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_EQUITIES) {
                    ele.borderColor = AppConstants.equityColor
                }
                else if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_BONDS) {
                    ele.borderColor = AppConstants.bondsColor
                }
                else if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_ETF) {
                    ele.borderColor = AppConstants.etfColor
                }


                else if (ele.assetClass.assetCode == "CRYPTO") {
                    ele.borderColor = AppConstants.cryptoColor
                }
                else if (ele.assetClass.assetCode == "CMDTY") {
                    ele.borderColor = AppConstants.commoditiesColor
                }
                else if (ele.assetClass.assetCode == "REALES") {
                    ele.borderColor = AppConstants.realEstateColor
                }

                let toDate = AppUtility.formatDate(new Date())
                let statsDate
                if (ele.securityStatsDTO != undefined && ele.securityStatsDTO != null) {
                    statsDate = AppUtility.formatDate_YYYY_MM_DD(ele.securityStatsDTO.entryDatetime)
                }
                if (ele.securityStatsDTO != undefined && ele.securityStatsDTO != null) {
                    if (statsDate !== toDate) {       //current price check
                        ele.securityStatsDTO.currentPrice = ele.securityStatsDTO.lastTradePrice
                        ele.currentPrice = ele.securityStatsDTO.currentPrice
                    }
                    else {
                        if (Number(ele.securityStatsDTO.currentPrice) == 0) {        //current price check
                            ele.securityStatsDTO.currentPrice = ele.securityStatsDTO.lastDayClosePrice
                        }
                        ele.currentPrice = ele.securityStatsDTO.currentPrice
                    }
                }
                else {
                    ele.currentPrice = "0";
                }
            })

            let last = data?.markedSecurities.length - 1
            let symbol = data?.markedSecurities[last].securityCode
            this._symbolService.getRibbons(this.userid, data?.markedSecurities[length].exchangeCode).subscribe((ribbon) => {

                let include = ribbon.some(ribbon => ribbon.securityCode === symbol);
                if (!include) {
                    if (data?.markedSecurities.length) {
                        this.allSecurities.push(data.markedSecurities[last])
                        this.saveRibbon(this.userid, data.markedSecurities[last])
                    }
                }
                else this.toast.warning('Ribbon already added', 'Alert')
            })
        })
    }

    onClickCard(security) {


        security?.currentPrice ?
            this._router.navigate([`/trading-portal/trading-graph/${security.exchangeCode}/${security.marketCode}/${security.securityCode}`]) :
            this.toast.warning('No Record Found Against this Symbol', 'No Data')
    }

    onRemoveSymbol(security) {
        const oldObj = this.allSecurities.find(ele => ele.securityCode === security.securityCode);
        const tempIndex = this.allSecurities.indexOf(oldObj);
        this.allSecurities.splice(tempIndex, 1);

        this._symbolService.getRibbons(this.userid, security.exchangeCode).subscribe(data => {
            for (let i = 0; i < data.length; i++) {
                if (security.securityCode == data[i].securityCode) {
                    this._symbolService.deleteRibbon(this.userid, data[i].ribbId).subscribe(() => {
                    }, (error => {
                        this.toast.error('Something Went Wrong', 'Error')
                    }));
                }
            }
        })
    }

    saveRibbon(userid: Number, data: any) {
        let ribbon: any = {}
        ribbon.userId = userid
        ribbon.exchangeCode = data.exchangeCode
        ribbon.marketCode = data.marketCode
        ribbon.securityCode = data.securityCode
        this._symbolService.saveRibbon(ribbon).subscribe(() => {
        })
    }

    getRibbons() {
        this._symbolService.getRibbons(this.userid, AppConstants.exchangeCode).subscribe(data => {
        }, (error => {
            this.toast.error('Something Went Wrong', 'Error')
        }));
    }

    getRibbonOnConstruct() {
        this._symbolService.getRibbons(this.userid, AppConstants.exchangeCode).subscribe((data) => {


            data?.map((ele) => {

                // ..............................Checking current stats date  and entry stats..........................
                let firstIndex = 0
                let toDate = AppUtility.formatDate(new Date())
                let statsDate
                if (ele.securityStatsDTO != undefined && ele.securityStatsDTO != null) {
                    statsDate = AppUtility.formatDate_YYYY_MM_DD(ele.securityStatsDTO.entryDatetime)
                }

                if (ele.securityStatsDTO != undefined && ele.securityStatsDTO != null) {      //current price check
                    if (statsDate !== toDate) {
                        ele.securityStatsDTO.currentPrice = ele.securityStatsDTO.lastTradePrice
                        if (Number(ele.securityStatsDTO.currentPrice) == 0) {
                            ele.securityStatsDTO.currentPrice = ele.securityStatsDTO.open
                        }
                        ele.currentPrice = ele.securityStatsDTO.currentPrice
                    }
                    else {                                                                      //current price check
                        if (Number(ele.securityStatsDTO.currentPrice) == 0) {
                            ele.securityStatsDTO.currentPrice = ele.securityStatsDTO.open
                        }
                        ele.currentPrice = ele.securityStatsDTO.currentPrice
                    }
                }
                else {
                    ele.currentPrice = "0";
                }
                // ....................................................................


                if (ele.securityImage != null) {
                    let objectURL = 'data:image/png;base64,' + ele.securityImage;
                    ele.src = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                }
                if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_EQUITIES) {
                    ele.borderColor = AppConstants.equityColor
                }
                else if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_BONDS) {
                    ele.borderColor = AppConstants.bondsColor
                }
                else if (ele.assetClass.assetCode == AppConstants.ASSET_CODE_ETF) {
                    ele.borderColor = AppConstants.etfColor
                }
                else if (ele.assetClass.assetCode == "CRYPTO") {
                    ele.borderColor = AppConstants.cryptoColor
                }
                else if (ele.assetClass.assetCode == "CMDTY") {
                    ele.borderColor = AppConstants.commoditiesColor
                }
                else if (ele.assetClass.assetCode == "REALES") {
                    ele.borderColor = AppConstants.realEstateColor
                }

                const requiredDataLength = 1;
                this.tradingPortalService.getKlineGraphDataDynamic(ele.exchangeCode, ele.securityCode, requiredDataLength)
                    .subscribe((Klinedata) => {
                        ele.securityTradedData = Klinedata[0]
                    });
            })
            this.allSecurities = data
        })
    }

    onFetchingStatsData() {
        this.socket.onFetchDataFromChannel('symbol_stat').subscribe((data) => {

            let newData = [];
            newData.push(data);

            newData.map((a) => {

                a.cprice = a.last_trade_price
                this.allSecurities.map((b) => {
                    if (b.securityCode == a.symbol) {
                        b.currentPrice = a.cprice
                    }
                })

            })
        }, error => {
        })
    }
}
