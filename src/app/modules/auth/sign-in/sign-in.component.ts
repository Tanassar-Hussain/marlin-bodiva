import { ChangeDetectorRef, Component, ElementRef, OnChanges, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import { TranslocoService } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthService2 } from 'app/services/auth2.service';
import { ToastrService } from "ngx-toastr";
import { AppConstants, AppUtility } from 'app/app.utility';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { adminNavigation, defaultNavigation } from 'app/mock-api/common/navigation/data';
import { cloneDeep } from 'lodash-es';
import { OrderService } from 'app/services-oms/order-oms.service';
import { RestService } from 'app/services/api/rest.service';
import { UserIdleService } from 'angular-user-idle';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { StorageService } from 'app/services/storage.service';




@Component({

    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,

})


export class AuthSignInComponent implements OnInit, OnChanges {



    @ViewChild('signInNgForm') signInNgForm: NgForm;
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;
    @ViewChild('email') fieldName: ElementRef;
    @ViewChild('passwordField') fieldNamePassword: ElementRef;

    pi;
    virtualTradingId = "VirtualTrading"
    passwordIcon = "visibility_off"
    signUpPasswordIcon = "visibility_off"
    confirmPasswordIcon = "visibility_off"
    outPutProp: any;
    signInForm: FormGroup;
    forgotPasswordForm: FormGroup;
    formType: string = 'signIn';
    signUpForm: FormGroup;
    allCountries;
    allExchanges;
    langs = this.transloco.getAvailableLangs();
    activelang = this.transloco.getActiveLang();
    currentLang: any;
    loggedIn = false
    private readonly _defaultNavigation: FuseNavigationItem[] = defaultNavigation;
    private readonly _adminNavigation: FuseNavigationItem[] = adminNavigation;
    selectedExchange: any;
    selectedCountry: any;
    dialingCountryCode: any
    modelPostionX: any
    modelPostionY: any
    topPos: any
    mainPage = 'signin'
    borkerCode: any;
    BrokerCode: string;
    errorMsg: string;
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _authService2: AuthService2,
        private _orderService: OrderService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private toast: ToastrService,
        private transloco: TranslocoService,
        private splash: FuseLoaderScreenService,
        private _fuseMockApiService: FuseMockApiService,
        public _restService: RestService,
        private listingSvc: ListingService,
        private userIdle: UserIdleService,
        private cdr: ChangeDetectorRef,
        private storageService: StorageService

    ) {




        ///////////////////////////////////////////////////////
        /////////////////Broker Code Navigation////////////////
        ///////////////////////////////////////////////////////
        this._activatedRoute.params.subscribe(params => {

            if (AppUtility.isValidVariable(this._activatedRoute.snapshot.paramMap.get('cd')) && this._activatedRoute.snapshot.paramMap.get('cd') !== "null"
                && this._activatedRoute.snapshot.paramMap.get('cd') !== "") {
                this.borkerCode = AppUtility.decodeURLParam(this._activatedRoute.snapshot.paramMap.get('cd')!);
                AppConstants.BROKER_CODE_SIGN_IN = this.borkerCode;
                sessionStorage.setItem('brokerCode', this.borkerCode);
            }
            else if (this._activatedRoute.snapshot.paramMap.get('cd') === "") {
                AppConstants.BROKER_CODE_SIGN_IN = "";
                sessionStorage.setItem('brokerCode', "");
            }

        });


        this.navigateUsingBrokerCode();


        this._router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                if (event.url !== "" && event.url !== null && event.url !== undefined) {
                    if (event.url === '/sign-in') {
                        this.navigateUsingBrokerCode();

                    }
                }
            }
        });

        ///////////////////////////////////////////////////////
        /////////////////Broker Code Navigation////////////////
        ///////////////////////////////////////////////////////




        this.currentLang = localStorage.getItem("lang")
        if (this.currentLang != null) {
            this.transloco.setActiveLang(this.currentLang)
            this.activelang = this.transloco.getActiveLang();
        }





    }

    ngOnChanges(): void {

        this.onMobileNumError()
    }





    ngOnInit(): void {

        this.splash.hide();
        this.signInForm = this._formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.email, this.removeSpaces])],
            password: ['', Validators.compose([Validators.required, this.removeSpaces])],
            rememberMe: ['']
        });

        this.signUpForm = this._formBuilder.group({
            name: ['', Validators.compose([Validators.required, this.removeSpaces])],
            email: ['', Validators.compose([Validators.required, Validators.email, this.removeSpaces])],
            password: ['', Validators.compose([Validators.required, this.removeSpaces, Validators.pattern("^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,50}$")])],
            confirmPassword: ['', Validators.compose([Validators.required, this.removeSpaces, this.matchConfirmPassword.bind(this)])],
            mobile: ['', Validators.compose([Validators.required, Validators.pattern("^[1-9][0-9]*$"), Validators.minLength(8), Validators.maxLength(11), this.removeSpaces])],
            countryId: ['', Validators.compose([Validators.required])],
            exchangeId: ['', Validators.compose([Validators.required])],
            agreements: [true],
            countryCode: [''],
        });

        this.forgotPasswordForm = this._formBuilder.group({
            userName: ['', Validators.compose([Validators.required, Validators.email, this.removeSpaces])],
        })

        this.getAllCountries();
        this.getAllExchanges();
        this.getMessageFromAuthSharedModule();




        /************************************* */
        ///////////Session Timeout /////////////
        /*********************************** */
        //  // Start watching when user idle is starting.
        this.userIdle.onTimerStart().subscribe((count) => console.log(count));

        // Start watch when time is up.
        this.userIdle.onTimeout().subscribe(() => {
            this.userIdle.stopTimer();
            this.userIdle.stopWatching();
            this.onTimeout();
        });
        /************************************** */
        /////////// Session Timeout /////////////
        /************************************ */
        //for reload reroute issue 
        let activePage = sessionStorage.getItem('activePage')
        if (AppUtility.isValidVariable(activePage)) {
            this.nevigate(activePage);
        }

    }







    navigateUsingBrokerCode() {

        if (!AppUtility.isValidVariable(AppConstants.BROKER_CODE_SIGN_IN) && AppConstants.BROKER_CODE_SIGN_IN !== "" && AppConstants.BROKER_CODE_SIGN_IN !== "null") {
            this._router.navigate(['/sign-in', { cd: AppUtility.encodeURLParam(AppConstants.BROKER_CODE_SIGN_IN) }]);
        }
        else {
            setTimeout(() => {
                this._router.navigate(['/sign-in', { cd: AppUtility.encodeURLParam(AppConstants.BROKER_CODE_SIGN_IN) }]);
            }, 200);

        }

    }







    public onTimeout = () => {


        this._router.navigate(['/sign-in']);
        this.storageService.clearMarketStates();
        localStorage.removeItem('MarlinToken');
        localStorage.removeItem('user');

        sessionStorage.removeItem('token');
        sessionStorage.removeItem('MarlinToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('tradeType');
        sessionStorage.removeItem('exchangeId');
        let a = sessionStorage.getItem('brokerCode');
        if (AppUtility.isValidVariable(a)) {
            AppConstants.BROKER_CODE_SIGN_IN = a;
        }


    }









    registerHandlers(): void {
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {
                return [200, { default: cloneDeep(this._defaultNavigation) }]
            });
    }

    adminRegisterHandlers(): void {
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {
                return [200, { default: cloneDeep(this._adminNavigation) }]
            });
    }

    public recieveMessageFromAuthShared = (event) => {
        this.outPutProp = event;
        if (event === 'signIn' && this.formType === 'signIn') {
            this.toast.error('Please Sign In', 'Error');
            this.fieldName.nativeElement.focus();
            this.formType = event;
            window.scrollTo(0, 0);
        }
        else {
            this.toast.error('Please Sign In', 'Error');
            this.formType = event;
            window.scrollTo(0, 0);
        }
    }

    getMessageFromAuthSharedModule = () => {

        this._authService.sharedMessage.subscribe((message) => {
            this.formType = message;
            window.scrollTo(0, 0);
        });
    }

    signIn(): void {

        this.splash.show();
        this.currentLang = this.transloco.getActiveLang()
        localStorage.setItem('lang', this.currentLang)
        if (this.signInForm.invalid) {
            this.splash.hide();
            return;
        }
        this.signInForm.disable();
        this.login(this.signInForm.value)

    }

    signUp() {

        if (this.signUpForm.invalid) {
            if (this.currentLang == 'pt') {
                this.toast.error('Por favor, preencha os campos ausentes', 'Erro')
            } else
                this.toast.error('Please Fill missing Fields', 'Error')
            return;
        }
        if (!this.signUpForm.get('agreements').value) {
            if (this.currentLang == 'pt') {
                this.toast.error('Aceite o Contrato e os Termos', 'Erro')
            } else
                this.toast.error('Please Accept Agreement and Terms', 'Error')
            return;
        }


        let formData = this.signUpForm.getRawValue();
        formData.mobile = this.dialingCountryCode + formData.mobile
        const data = {
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            countryId: formData.countryId,
            exchangeId: formData.exchangeId
        };
        if (formData.password != formData.confirmPassword) {
            if (this.currentLang == 'pt') {
                this.toast.error('Senha incompatível', 'Erro')
            } else
                this.toast.error('Password mismatched', 'Error')
            return;
        }
        this.signUpForm.disable();

        this._authService.signUp(data)
            .subscribe((response) => {

                this.formType = 'signIn';
                this.signInForm.setValue({ email: data.email, password: data.password, rememberMe: "" })
                this.login(this.signInForm.value)
                this.signUpForm.reset();
                this.signUpForm.enable();

            }, (error) => {

                this.splash.hide();
                this.signUpForm.enable();
                let Conflict

                if (error.message != undefined && error.status != undefined) {

                    if (error.message.match("NEXUSPSX.USERS_EMAIL_UNIQ") != "") {
                        Conflict = "NEXUSPSX.USERS_EMAIL_UNIQ"
                    }
                    // Re-enable the form

                    if (error.status === 404) {
                        if (this.currentLang == 'pt') {
                            this.toast.error('Erro do Servidor Interno', 'Erro');
                        } else
                            this.toast.error('Internal Server Error', 'Error');

                    } else if (error.message == 'Sorry for the inconvenience. Please contact at the support.') {
                        if (this.currentLang == 'pt') {
                            this.toast.error('E-mail ou Telefone já existe.', 'Erro');
                        } else
                            this.toast.error('Email or Phone Already exist.', 'Error');

                    } else if (Conflict == "NEXUSPSX.USERS_EMAIL_UNIQ") {
                        if (this.currentLang == 'pt') {
                            this.toast.error('Email já existe.', 'Erro');
                        } else
                            this.toast.error('Email Already exist.', 'Error');
                    }
                    else {
                        if (this.currentLang == 'pt') {
                            this.toast.error('Alguma coisa deu errado. Por favor tente outra vez.', 'Erro');
                        } else
                            this.toast.error('Something went wrong, please try again.', 'Error');
                    }
                }

                if (error === 'Email already exists already exist.') {
                    if (this.currentLang == 'pt') {
                        this.toast.error('E-mail  já existe.', 'Erro');
                    } else
                        this.toast.error('Email already exist.', 'Error');

                }

            }
            );
    }

    sendResetLink(): void {
        // Return if the form is invalid
        if (this.forgotPasswordForm.invalid) {
            return;
        }
        this.forgotPasswordForm.disable();
        const data = {
            userName: this.forgotPasswordForm.get('userName').value,
            password: '',
        }
        this._authService.forgotPassword(data)
            .subscribe((response) => {

                this.forgotPasswordForm.enable();
                this.forgotPasswordNgForm.resetForm();
                if (this.currentLang == 'pt') {
                    this.toast.success('Redefinição de senha enviada! Você receberá um e-mail se estiver cadastrado em nosso sistema.', 'Success');
                } else
                    this.toast.success('Password reset sent! You\'ll receive an email if you are registered on our system.', 'Success');
            }, (response) => {
                this.forgotPasswordForm.enable();
                if (this.currentLang == 'pt') {
                    this.toast.error('E-mail não encontrado! Tem certeza que você já é um membro?', 'Error')
                } else
                    this.toast.error('Email does not found! Are you sure you are already a member?', 'Error')

            }
            );
    }

    getAllCountries() {
        this._authService.getAllCountries().subscribe((res => {
            this.allCountries = res;

            const index = this.allCountries.findIndex(a => {
                return a.countryCode === AppConstants.DEFAULT_COUNTRY_CODE;
            });

            this.selectedCountry = this.allCountries[index].countryId
            this.dialingCountryCode = this.allCountries[index].dialingCode

        }))
    }

    getAllExchanges() {
        this._authService.getAllExchanges().subscribe((res => {
            this.allExchanges = res;
            this.selectedExchange = this.allExchanges[0].exchangeId
        }))
    }


    onClickPortfolio() {

    }
    onClickSideBar() {

    }

    setActiveLang(lang: any) {
        this.transloco.setActiveLang(lang);
        window.location.reload();
        this.activelang = lang
        localStorage.setItem("lang", lang);
        window.location.reload()
    }

    login(obj) {
        this._authService.signIn(obj).subscribe((resp) => {


            //Start watching for user inactivity.
            this.userIdle.startWatching();

            this.getAllUsers();
            this._authService2.setToken(resp.token);
            this._orderService.setToken(resp.token);
            this._restService.setUserToken(resp.token)
            sessionStorage.setItem("exchangeId", resp.exchangeId.toString());
            AppConstants.exchangeId = resp.exchangeId;


            const d = new Date();
            let diff = d.getTimezoneOffset();
            diff = (diff / 60) * -1;
            AppConstants.UTC_LOCALE_HOURS_IN_NUMBER = diff;
            if (diff > 9) {
                AppConstants.UTC_LOCALE_HOURS = "+" + diff + "00";
                sessionStorage.setItem('utchours', AppConstants.UTC_LOCALE_HOURS);
            }
            else {
                AppConstants.UTC_LOCALE_HOURS = "+0" + diff + "00";
                sessionStorage.setItem('utchours', AppConstants.UTC_LOCALE_HOURS);
            }


            const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
            const adminURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/admin-redirect';
            // .............................................................................................................
            if (AppConstants.userType === 'MARLIN ADMIN') {
                this._router.navigateByUrl(adminURL);
                this.adminRegisterHandlers()
                this.splash.hide();

            }
            else if (AppConstants.userType === 'PARTICIPANT') {
                this._router.navigateByUrl(redirectURL);
                this.registerHandlers()
                this.splash.hide();

            }
            else {
                this._router.navigateByUrl(redirectURL);
                this.registerHandlers()
                this.splash.hide();
            }
            // .............................................................................................................


            // this._router.navigateByUrl(redirectURL);

            if (this.currentLang == 'pt') {
                this.toast.success('Login Com Sucesso', 'Sucesso');
            } else {
                this.toast.success('Successfully Login', 'Success');
            }






        }, (error) => {
            this.splash.hide();
            this.signInForm.enable();

            if (error === "Sorry for the inconvenience. The system will be restored shortly") {
                if (this.currentLang == 'pt') {
                    this.toast.error('Desculpe pela inconveniência. O sistema será restaurado em breve', 'Erro');
                } else
                    this.toast.error('Sorry for the inconvenience. The system will be restored shortly', 'Error');
            }

            else if (error === "Invalid User Name or Password.") {
                if (this.currentLang == 'pt') {
                    this.toast.error('Nome de usuário ou senha inválidos.', 'Erro');
                } else
                    this.toast.error('Invalid User Name or Password.', 'Error');
            }

            else if (error === "User is inActive. Please contact to the administrator.") {
                if (this.currentLang == 'pt') {
                    this.toast.error('O usuário está inativo. Entre em contato com o administrador.', 'Erro');
                } else
                    this.toast.error('User is inActive. Please contact to the administrator.', 'Error');
            }

            else {
               // this.toast.error(error, 'Error');
            }
        }
        );
    }







    getAllUsers(): void {
        this.listingSvc.getUserList(AppConstants.participantId).subscribe(restData => {
            this.splash.hide();
            if (AppUtility.isEmptyArray(restData)) {
                sessionStorage.setItem('traders', JSON.stringify([]));
            }
            else {
                sessionStorage.setItem("traders", JSON.stringify(restData));
            }
        },
            error => {
                this.errorMsg = <any>error;

            });
    }









    countryChanged(event) {

        const index = this.allCountries.findIndex(a => {
            return a.countryId == event;
        });
        this.dialingCountryCode = this.allCountries[index].dialingCode

    }

    clearSignupFields() {
        this.dialingCountryCode = ''
        this.selectedCountry = ""
        this.selectedExchange = ""
        this.getAllCountries()
        this.getAllExchanges()
    }


    gettingPostion(id: string) {
        const element = document.getElementById(id).getBoundingClientRect();

        this.modelPostionX = 0
        this.modelPostionY = 0

        let posleft = element.left
        let postop = element.top

        if (id === "VirtualTrading") {
            this.modelPostionX = posleft + 348 + "px"
            this.modelPostionY = postop - 10 + "px"
        } else if (id === "AssetClass") {
            this.modelPostionX = posleft + 405 + "px"
            this.modelPostionY = postop - 10 + "px"
        } else if (id === "WatchList") {
            this.modelPostionX = posleft + 460 + "px"
            this.modelPostionY = postop - 10 + "px"
        } else if (id === "RealMarket") {
            this.modelPostionX = posleft + 420 + "px"
            this.modelPostionY = postop - 10 + "px"
        } else if (id === "Graph") {
            this.modelPostionX = posleft + 360 + "px"
            this.modelPostionY = postop - 10 + "px"
        } else if (id === "Portfolio") {
            this.modelPostionX = posleft + 310 + "px"
            this.modelPostionY = postop + "px"
        }
    }

    onMobileNumError() {
        const element = document.getElementById("mobileNum").getBoundingClientRect();
        this.topPos = 0
        let postop = element.top
        this.topPos = postop + "px"
    }

    nevigate(pageRoute) {
        // this._router.navigateByUrl(pageRoute);
        this.formType = "navigateLogin"
        if (pageRoute == 'signin') {
            this.formType = 'signIn';
        }
        this.mainPage = pageRoute
        sessionStorage.setItem('activePage', this.mainPage)
    }

    removeSpaces(control: AbstractControl) {
        if (control && control.value && !control.value.replace(/\s/g, '').length) {
            control.setValue('');
        }
        return null;
    }

    matchConfirmPassword(control: AbstractControl): { [key: string]: boolean } | null {
        const password = control.root.get('password');
        const confirmPassword = control.value;

        if (password && confirmPassword !== password.value) {
            return { 'mismatch': true };
        }

        return null;
    }

    clearSignUpFields() {
        this.signUpPasswordIcon = "visibility_off"
        this.confirmPasswordIcon = "visibility_off"
        this.signUpForm.reset();
    }

}
