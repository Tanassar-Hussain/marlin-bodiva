import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';

import { MatDialog } from "@angular/material/dialog";
import { PortfolioDetailComponent } from 'app/modules/common-components/portfolio-detail/portfolio-detail.component';
import { AppConstants, AppUtility } from 'app/app.utility';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import { environment } from 'environments/environment';
import { io } from 'socket.io-client';
import { AuthService } from 'app/core/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { ToastrService } from 'ngx-toastr';
import { ChangePasswordComponent } from 'app/modules/common-components/change-password-component/change-password-component';
import * as input from '@grapecity/wijmo.input';
import { MarketWatchEB } from 'app/modules/admin/oms/reports/market-watch-EB/market-watch-EB';
import localforage from 'localforage';
import { MatExpansionPanel } from '@angular/material/expansion';



@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user'
})
export class UserComponent implements OnInit, OnDestroy {
    @Input() showAvatar: boolean = true;
    user: User;
    currentValue$ = new BehaviorSubject<number>(0);
    totalValue$ = new BehaviorSubject<number>(0);
    netPL$ = new BehaviorSubject<number>(0);
    profit: boolean = false
    loss: boolean = false
    profitColor = AppConstants.buyColor
    lossColor = AppConstants.sellColor
    data: any = { email: '' }
    userForm: FormGroup;

    dialingCountryCode: any
    allCountries;
    allExchanges;
    loggedInUser: any;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    socket = io(environment.socketUrl, { 'forceNew': true });
    currentLang: string;
    activelang: string;
    countryName: any;
    exchangeName: any;
    userFromSession: any;
    userCountryCode: string;
    isInvestor = false;
    isMarlinUser = false;
    isParticipant = false;
    isMarlinAdmin = false;
    userType: string;
    participantId: number;
    isWelcomeNoteApplicable = false;

    constructor(
        private _router: Router,
        private _userService: UserService,
        private _matDialog: MatDialog,
        private splash: FuseLoaderScreenService,
        private auth_service: AuthService,
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private transloco: TranslocoService,
        private toast: ToastrService,

    ) {

        let user: User = JSON.parse(sessionStorage.getItem('user'));
        let user1 = JSON.parse(sessionStorage.getItem('user'));
        this.user = user;
        this.data.email = user1?.userName
        this.userFromSession = JSON.parse(sessionStorage.getItem('user'));
        this.userCountryCode = AppConstants.USER_COUNTRY_CODE
        this.userDetail()
        this.currentLang = localStorage.getItem("lang")
        if (this.currentLang != null) {
            this.transloco.setActiveLang(this.currentLang)
            this.activelang = this.transloco.getActiveLang();
        }
        this.userType = AppConstants.userType;
        this.participantId = AppConstants.participantId;

        if ((this.userType === AppConstants.USER_TYPE_CLIENT_CODE) && (!AppUtility.isValidVariable(AppConstants.participantId))) {
            this.isMarlinUser = true;
        }
        else if ((this.userType === AppConstants.USER_TYPE_CLIENT_CODE) && (AppUtility.isValidVariable(AppConstants.participantId))) {
            this.isInvestor = true;
        }
        else if (this.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
            this.isParticipant = true;
        }
        else if (this.userType === AppConstants.USER_TYPE_MARLIN_ADMIN_CODE) {
            this.isMarlinAdmin = true;
        }

        if (AppConstants.userType === "CLIENT" && AppConstants.participantId != null) {
            this.isWelcomeNoteApplicable = true;
        }

    }

    ngOnInit(): void {

        this._userService.userHoldings(this.user.id)
        this._userService.currentValue$$().subscribe(res => this.currentValue$.next(res))
        this._userService.totalValue$$().subscribe(res => this.totalValue$.next(res))
        this._userService.netPL$$().subscribe(res => this.netPL$.next(res))
        this._userService.loss$$().subscribe(res => this.loss = res)
        this._userService.profit$$().subscribe(res => this.profit = res)

        this.initializeUserForm()
        this.getAllExchanges()
        this.getAllCountries()

        this.userType = AppConstants.userType;

    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    updateUserStatus(status: string): void {
        if (!this.user) {
            return;
        }
        this._userService.update({
            ...this.user,
            status
        }).subscribe();
    }




    public notSaveProfileCall = () => {
        localforage.removeItem(AppConstants.username);
        this.signOut();
    }







    signOut(): void {
        this.splash.show();
        this._router.navigate(['/sign-in']);
        localStorage.removeItem('MarlinToken');
        localStorage.removeItem('user');

        sessionStorage.removeItem('token');
        sessionStorage.removeItem('tradeType')
        sessionStorage.removeItem('MarlinToken');
        sessionStorage.removeItem('exchangeId');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('traders');

        let a = sessionStorage.getItem('brokerCode');
        if (AppUtility.isValidVariable(a) && a !== "" && a !== "null") {
            AppConstants.BROKER_CODE_SIGN_IN = a;
        }


        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.auth_service.signOutForStats(this.data).subscribe()
    }

    // userHoldings(userId: any) {
    //     this._userService.getUserTradeHoldings(userId).subscribe((res) => {
    //         let totalMarketVal = 0
    //         let totalCostVal = 0
    //         let netPL = 0
    //         for (let i = 0; i < res.length; i++) {

    //             if (res[i].holding > 0) {
    //                 totalMarketVal += Number(res[i].holding * res[i].securityStatsDTO.currentPrice)
    //                 totalCostVal += Number(res[i].totalCost)
    //             }
    //         }

    //         totalMarketVal = Number(totalMarketVal.toFixed(2))
    //         totalCostVal = Number(totalCostVal.toFixed(2))

    //         netPL = totalMarketVal - totalCostVal
    //         netPL = Number(netPL.toFixed(2))

    //         if (netPL >= 0) {
    //             this.profit = true
    //             this.loss = false
    //         }
    //         else {
    //             this.loss = true
    //             this.profit = false
    //         }
    //         console.log
    //         this.currentValue$.next(totalMarketVal);
    //         this.totalValue$.next(totalCostVal);
    //         this.netPL$.next(netPL);
    //     })
    // }


    refresh() {
        // this.userHoldings(this.user.id)
    }

    portfolioDetail() {
        // this.userHoldings(this.user.id)
        this._matDialog.open(PortfolioDetailComponent, {
            autoFocus: false,
            position: { top: '50px', right: '0px' },
            panelClass: 'portfolio-dialogue-container'
        }).afterClosed().subscribe((data) => {


        })
    }

    getAllCountries() {
        this._authService.getAllCountries().subscribe((res => {
            this.allCountries = res;

            const index = this.allCountries.findIndex(a => {
                return a.countryId == this.loggedInUser.countryId;
            });

            this.dialingCountryCode = this.allCountries[index].dialingCode
            this.countryName = this.allCountries[index].countryName
            // this.loggedInUser.mobile = this.loggedInUser.mobile.replace(this.dialingCountryCode, "");
        }))
    }

    countryChanged(event) {

        const index = this.allCountries.findIndex(a => {
            return a.countryId == event;
        });
        this.dialingCountryCode = this.allCountries[index].dialingCode

    }

    getAllExchanges() {
        this._authService.getAllExchanges().subscribe((res => {
            this.allExchanges = res;

            const index = this.allExchanges.findIndex(a => {
                return a.exchangeId == this.loggedInUser.exchangeId;
            });

            this.exchangeName = this.allExchanges[index].exchangeName
        }))
    }

    onUpdate() {

        if (this.userForm.valid && this.userForm.touched) {

            let formData = this.userForm.getRawValue();
            let mobileWithoutCode = formData.mobile
            formData.mobile = this.dialingCountryCode + formData.mobile
            const data = {
                userName: formData.name,
                email: formData.email,
                mobile: formData.mobile,
            };

            this._authService.updateProfile(data).subscribe(res => {

                this.userFromSession.mobileNumber = formData.mobile;
                this.userFromSession.name = data.userName;
                sessionStorage.setItem('user', JSON.stringify(this.userFromSession));

                if (this.currentLang == 'pt') {
                    this.toast.success('Perfil atualizado com sucesso', 'Sucesso')
                } else
                    this.toast.success('Profile Updated Successfully', 'Success')

            }, error => {
                if (this.currentLang == 'pt') {
                    this.toast.error('Algo deu errado', 'Erro')
                } else
                    this.toast.error('Something went wrong', 'Error')
            })
        }
    }


    clearUserProfile() {
        this.loggedInUser.name = this.userFromSession.name
        this.loggedInUser.mobile = this.userFromSession.mobileNumber
        this.loggedInUser.mobile = this.loggedInUser.mobile.replace(this.userCountryCode, "");
    }

    closeProfilePanel(panel: MatExpansionPanel) {
        panel.close();
    }

    initializeUserForm() {
        this.userForm = this._formBuilder.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            countryId: ['', Validators.required],
            exchangeId: ['', Validators.required],
            mobile: ['', [Validators.required, Validators.pattern("^[1-9][0-9]*$"), Validators.minLength(8), Validators.maxLength(11)]],
        });
    }

    userDetail() {
        this.loggedInUser = {
            name: this.userFromSession.name,
            email: this.userFromSession.email,
            exchangeId: this.userFromSession.exchangeId,
            countryId: this.userFromSession.countryId,
            mobile: this.userFromSession.mobileNumber
        }
    }


    changePassword() {
        this._matDialog.open(ChangePasswordComponent, {
            autoFocus: false,
            position: { top: '5%' },
            panelClass: 'change-password-dialogue-container'
        }).afterClosed().subscribe((data) => {


        })
    }

    showWelcomeNote() {
        this._router.navigateByUrl('dashboard/welcome-note');
    }

}
