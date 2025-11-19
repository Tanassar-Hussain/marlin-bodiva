import { AfterContentChecked, AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertMessage } from 'app/models/alert-message';
import { BestMarket } from 'app/models/best-market';
import { Order } from 'app/models/order';
import { OrderConfirmation } from 'app/models/order-confirmation';
import { SymbolStats } from 'app/models/symbol-stats';

import * as wjcInput from '@grapecity/wijmo.input';
declare var jQuery: any;
import { AppState } from 'app/app.service';
import { AuthService2 } from 'app/services/auth2.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { TranslateService } from '@ngx-translate/core';
import { ComboItem } from 'app/models/combo-item';

import { UserService } from 'app/core/user/user.service';
import { AppConstants, AppUtility, UserTypes } from 'app/app.utility';

import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/socket/web-socket.service';

import { AuthService } from 'app/services-oms/auth-oms.service';
import { Notification } from 'app/layout/layouts/classy/notifications/notification';
import { Notifications } from 'app/layout/layouts/classy/notifications/notifications.component';
import { ShareOrderService } from '../../../order/order.service';
import { RepoOrderComponent } from '../repo-order';
import { Repo } from 'app/models/repo';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { DialogCmpReports } from '../../../reports/dialog-cmp-reports';
import { ToastrService } from 'ngx-toastr';
import { SecurityMarketDetails } from 'app/models/security-market-details';
import { SecurityFisDetail } from 'app/models/security-fis-detail';
import { CouponFrequency } from 'app/models/coupon-frequency';
import { CancelOrder } from 'app/models/order-cancel';


@Component({
    selector: '[repo-bond-order]',
    templateUrl: './repo-bond-order.html',
    encapsulation: ViewEncapsulation.None,
})

export class RepoBondOrderComponent {

    public myForm: FormGroup;

    @Input() repoAffirmData : any;
    @Input() affirmOrReject : string = "";
    @Input() passIndex  : number = null;
    @ViewChild(RepoOrderComponent, { static: false }) repoOrder: RepoOrderComponent;
    @ViewChild(Notifications) notifications: Notification;
    securityMarketDetails : SecurityMarketDetails =  new SecurityMarketDetails();
    symbolStats = new SymbolStats();

    participantId: number;
    participantCode: string;
    lang: string;
    claims: any;
    loggedInUserType: string;
    tradeType: string;
    public userType = UserTypes;
    repo: Order;
    intra: boolean = true;
    inter: boolean = false;
 
    collateralList: any[];
    clientList: any[] = [];
    errorMessage: string;
    exchangeId: number = 0;
    marketId: number = 0;
    securityId: number = 0;
    repoTypeList: object[] = [];
    counterBorkerList: object[] = [];
    dateFormat: string = AppConstants.DATE_FORMAT;
    dateMask: string = AppConstants.DATE_MASK;
    isBondPricingMechanismPercentage: boolean = true;
    todayDate = new Date();
    @ViewChild('orderSubmittedDlg', { static: false }) orderSubmittedDlg: wjcInput.Popup;
    @ViewChild('orderCancelledDlg', { static: false }) orderCancelledDlg: wjcInput.Popup;
    @ViewChild('orderAffirmDlg', { static: false }) orderAffirmDlg: wjcInput.Popup;
    @ViewChild('orderRejectDlg', { static: false }) orderRejectDlg: wjcInput.Popup;
    @ViewChild('orderExtendDlg', { static: false }) orderExtendDlg: wjcInput.Popup;
    @ViewChild('orderRepriceDlg', { static: false }) orderRepriceDlg: wjcInput.Popup;

    @ViewChild('collateral', { static: false }) collateral: wjcInput.ComboBox;
    @ViewChild('cleanPrice', { static: false }) cleanPrice: wjcInput.ComboBox;
    @ViewChild('dirtyPrice', { static: false }) dirtyPrice: wjcInput.ComboBox;
    @ViewChild('quantity', { static: false }) quantity: wjcInput.InputNumber;

    @ViewChild('nominalValue', { static: false }) nominalValue: wjcInput.ComboBox;
    @ViewChild('marketValue', { static: false }) marketValue: wjcInput.ComboBox;
    @ViewChild('repoType', { static: false }) repoType: wjcInput.ComboBox;
    @ViewChild('haircut', { static: false }) haircut: wjcInput.ComboBox;

    @ViewChild('purchasePrice', { static: false }) purchasePrice: wjcInput.ComboBox;
    @ViewChild('initialDate', { static: false }) initialDate: wjcInput.InputDate;
    @ViewChild('terminationDate', { static: false }) terminationDate: wjcInput.InputDate;
    @ViewChild('repurchase_rate', { static: false }) repurchase_rate: wjcInput.ComboBox;

    @ViewChild('repurchasePrice', { static: false }) repurchasePrice: wjcInput.ComboBox;
    @ViewChild('account', { static: false }) account: wjcInput.ComboBox;

    @ViewChild('borker', { static: false }) borker: wjcInput.ComboBox;
    @ViewChild('counterBroker', { static: false }) counterBroker: wjcInput.ComboBox;
    @ViewChild('counterAccount', { static: false }) counterAccount: wjcInput.ComboBox;
    @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;
    accruedInterest: number = 0;
    alertMessage: AlertMessage;
    isConfirmationSuccess: boolean = false;
    isConfirmationRejected: boolean = false;
    bondPaymentsSchedule: Object[];
    accruedProfit: number = 0;
    weeklyHolidays: any[] = [];
    nationalHolidays: any[] = [];
  statusMsg: string = "";
  modal: boolean = true;
  brokersList: any[] = [];
  disabledSubmit: boolean = false;
  isRepoTypeBuyBack: boolean = true;
  category : string = AppConstants.ASSET_CLASS_BONDS.toUpperCase();
  couponType : string = AppConstants.COUPON_TYPE_FIXED_INCOME.toUpperCase();
  isDisabled: boolean = false;
  isDisabledAffirmFields : boolean = false;
  isDisabledExtendFields : boolean = false;
  isDisabledRepriceFields : boolean = false;
  currencyCode : String = AppConstants.LOCAL_CURRENCY_AOA_CODE;


    constructor(private appState: AppState, public authService: AuthService2, public authServiceOMS: AuthService, private dataService: DataServiceOMS,
        private listingService: ListingService, private toast: ToastrService,  private orderService: OrderService,  
        private _fb: FormBuilder, private translate: TranslateService, public shareOrderService: ShareOrderService, private loader: FuseLoaderScreenService,
        public cdr: ChangeDetectorRef, public router: Router, private socket: WebSocketService) {

        this.claims = this.authService.claims;
        this.loggedInUserType = AppConstants.userType;
        this.authService.tradeChange.subscribe((value) => {
            this.tradeType = value;
        });

        this.participantId = AppConstants.participantId;
        this.participantCode = AppConstants.participantCode;
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

        let date = new Date();
        date.setDate(date.getDate() + 1); 
        this.todayDate = date;
      

        this.currencyCode = AppConstants.LOCAL_CURRENCY_AOA_CODE;
       

    }

    ngOnDestroy(): void { }

    ngOnInit() {
       
        this.getWeeklyHolidays(AppConstants.exchangeId);
        this.getNationalHolidays(AppConstants.exchangeId);
        this.getClientsList(AppConstants.exchangeId);
        this.symbolList();
        this.addFromValidations();
        this.clearFields();
        
    }

    ngOnChanges(changes: SimpleChanges): void {
         if(changes.repoAffirmData || changes.affirmOrReject || changes.passIndex){
             this.fillRepoFromJson();
         }
    }


    radioClicked(type) {
        if (type === 'inter') {
            this.intra = false;
            this.generatecounterBorkerList();
          //  this.repo.counter_client_code = AppConstants.PLEASE_SELECT_STR;
        } else if (type === 'intra') {
            this.intra = true;
            this.repo.counter_broker_code = this.participantCode;
          
        }
    }

    clearFields() {
          
        if (AppUtility.isValidVariable(this.myForm)) {
            this.myForm.markAsPristine();
          }
       
        this.intra = true;
       // this.symbolList();
        this.securityMarketDetails = new SecurityMarketDetails();
        this.securityMarketDetails.fisDetail = new SecurityFisDetail();
        this.securityMarketDetails.fisDetail.couponFrequency = new CouponFrequency();
        this.symbolStats = new SymbolStats();
        this.alertMessage = new AlertMessage();
        this.repo = new Order();
        this.repo.participant = this.participantCode;
        this.repo.repo_type = "BuyBack";
         
        let date = new Date();
        date.setDate(date.getDate() + 1); 
        this.repo.terminationDate = date;
        this.todayDate = date;
        this.updateTerminationDate(this.repo.terminationDate, false);
        this.repo.symbolMktExch = "";
       // this.collateral.text = AppConstants.PLEASE_SELECT_STR;
        this.repo.price_ = 0;
        this.repo.dirtyPrice = 0;
        this.repo.volume = 0;
        this.repo.nominalValue = 0;
        this.repo.marketValue = 0;
        this.repo.repo_haircut_ = 0;
        this.repo.repo_haircut = "";
        this.repo.sellPrice = 0;
        this.repo.settlementValueCurrency = 0;
        this.repo.repurchase_rate_ = 0;
        this.repo.repurchase_rate = "";
        this.repo.repurchase_price_ = 0;
        this.repo.repurchase_price = "";
        this.repo.repurchasePriceCurrency = 0;
        this.repo.account = "";
        this.repo.side = 'sell';
        this.securityId = null;
        this.marketId = null;
        this.exchangeId = null;

        // const intra = document.getElementById('intra') as HTMLInputElement | null;
        // if (intra != null) {
        //     intra.checked = true;
        // }
        // const inter = document.getElementById('inter') as HTMLInputElement | null;
        // if (inter != null) {
        //     inter.checked = false;
        // }
    }

    generateRepoTypeList() {
        let typeList: any[] = [];
        let cmbItem , cmbItem1 : ComboItem;
        cmbItem = new ComboItem('BuyBack', 'BuyBack');
        cmbItem1 = new ComboItem('Buy/Sell Back' , 'SellBack');
        typeList.push(cmbItem);
        typeList.push(cmbItem1);
        this.repoTypeList = typeList
        this.repo.repo_type = typeList[0].value
    }

    

    ngAfterViewInit(): void {
        this.authServiceOMS.socket.on('order_confirmation', (dataorderConfirmation) => {   this.updateorderConfirmation(dataorderConfirmation); });
        this.authServiceOMS.socket.on('symbol_stat', (dataSS) => {  ; this.updateSymbolStatsData(dataSS); });    
    }

    onClose() {
        jQuery('#repo-order').modal('hide');
        jQuery('#repo-order-reject-affirm').modal('hide');
        this.clearFields();

    }



    public fillRepoFromJson = () => {

      // P ---> PartiallyAccepted
      // R ---> Rejected
      // C ---> Cancelled
      // A ---> Affirm
      // E ---> MaturityExtended
      // AME --> Accept Maturity Extended
      // RP --> Repriced
      
      if(AppUtility.isValidVariable(this.repoAffirmData) && !AppUtility.isNullOrEmpty(this.affirmOrReject)){
 
        if(this.affirmOrReject === 'P' || this.affirmOrReject === 'R' || this.affirmOrReject === 'C' ){   //partiallyAccepted, Rejected, Cancelled
           this.isDisabled = true;
           this.isDisabledAffirmFields = true;
           this.isDisabledExtendFields = true;
           this.isDisabledRepriceFields = true; 
        }
        else if(this.affirmOrReject === 'A'){     //Accept Repo Order
           this.isDisabled = true;
           this.isDisabledExtendFields = true;
           if((this.repoAffirmData.broker === this.repo.counter_broker_code)){
            this.isDisabledAffirmFields = true;
            this.isDisabledRepriceFields = true; 
           }else{
            this.isDisabledAffirmFields = false;
            this.isDisabledRepriceFields = false; 
           }
        }else if(this.affirmOrReject === 'E'){     //Maturity Extended
          this.isDisabled = true;
          this.isDisabledAffirmFields = true;
          this.isDisabledRepriceFields = true; 
          this.isDisabledExtendFields = false;
        }
        else if(this.affirmOrReject === 'AME'){   //Accept Maturity Extended
          this.isDisabled = true;
          this.isDisabledAffirmFields = true;
          this.isDisabledRepriceFields = true; 
          this.isDisabledExtendFields = true;
        }
        else if(this.affirmOrReject === 'RP'){   //Accept Maturity Extended
          this.isDisabled = true;
          this.isDisabledAffirmFields = true;
          this.isDisabledExtendFields = true;
          this.isDisabledRepriceFields = false; 
        }
        else{
          this.isDisabled = false;
          this.isDisabledAffirmFields = false;
          this.isDisabledExtendFields = false;
          this.isDisabledRepriceFields = false; 
        }

          this.repo = new Order();
          this.collateral.selectedValue = AppUtility.symbolMarketExchangeComb(this.repoAffirmData.symbol , this.repoAffirmData.market, this.repoAffirmData.exchange);
          this.repo.symbolMktExch = AppUtility.symbolMarketExchangeComb(this.repoAffirmData.symbol , this.repoAffirmData.market, this.repoAffirmData.exchange);

          if(this.affirmOrReject === 'RP'){
            this.repo.contract_initial_date = new Date();
          }else{
            this.repo.contract_initial_date = new Date(this.repoAffirmData.contract_initial_date);
          }

          this.repo.price = this.repoAffirmData.price;
          this.repo.price_ = Number(this.repoAffirmData.price);
          this.repo.volume = Number(AppUtility.removeCommaFromValue(this.repoAffirmData.volume));
          this.repo.repo_haircut = this.repoAffirmData.repo_haircut;
          this.repo.repo_haircut_ = Number(this.repoAffirmData.repo_haircut);
          this.repo.repurchase_rate_ = Number(this.repoAffirmData.repurchase_rate);
          this.repo.repurchase_rate = this.repoAffirmData.repurchase_rate;
          setTimeout(() => {
            this.repo.repo_type = this.repoAffirmData.repo_type;
          //  this.onChangeRepoType(this.repo.repo_type);
          }, 500);
         
          this.repo.sellPrice = this.repoAffirmData.repurchase_settlement_amount;
         
          this.repo.terminationDate = new Date(this.repoAffirmData.expiry_date);
          this.todayDate = new Date(this.repoAffirmData.expiry_date);

          this.repo.actual_client_code = this.repoAffirmData.actual_client_code;
          this.repo.actual_broker_code = this.repoAffirmData.actual_broker_code;
          this.repo.account = this.repoAffirmData.account;
          this.repo.participant = this.repoAffirmData.broker;
    
          this.repo.counter_broker_code = this.repoAffirmData.actual_counter_broker_code;
          this.repo.counter_username = this.repoAffirmData.counter_username;
          this.repo.counter_client_code = this.repoAffirmData.counter_account;
          this.repo.username = this.repoAffirmData.username;
       
          this.repo.counter_order_no = this.repoAffirmData.counter_order_no;
          this.repo.order_no = this.repoAffirmData.order_no;
          this.repo.ref_no = this.repoAffirmData.ref_no;
          this.repo.repo_leg = this.repoAffirmData.repo_leg;
          this.repo.side = this.repoAffirmData.side;
          this.repo.order_state = this.repoAffirmData.order_state;
          this.repo.counter_order_no = this.repoAffirmData.counter_order_no;
          this.repo.negotiated_order_status = this.repoAffirmData.negotiated_order_status;
          this.repo.negotiated_order_state = this.repoAffirmData.negotiated_order_state;
          this.repo.contract_id = this.repoAffirmData.contract_id;
          this.repo.accrudeProfit = this.repoAffirmData.accrudeProfit;
          this.repo.actual_volume = this.repoAffirmData.actual_volume;
          this.repo.actual_settlement_amount = this.repoAffirmData.actual_settlement_amount;
          this.repo.broker = this.repoAffirmData.broker;

         if(this.repo.participant === this.repo.counter_broker_code){
          this.intra = true;
          this.myForm.get('repo').setValue('intra');
         }else{
          this.intra = false;
          this.myForm.get('repo').setValue('inter');
         }
 
          this.collateral.focus();
    
          this.cdr.detectChanges();
      }
    
    }
 



    closeAlert() {
      this.isConfirmationSuccess = false;
      this.isConfirmationRejected = false;
    }
  



    resetForm(): void {
       
        this.repo = new Order();
        this.repo.symbolMktExch = "";
        this.securityId = null;
        this.marketId = null;
        this.exchangeId = null;
        this.repo.exchange = "";
        this.repo.market = "";
        this.repo.symbol = "";
        this.repo.price_ = 0;
        this.repo.price = "0";
        this.repo.yield = 0;
        this.repo.dirtyPrice = 0;
        this.repo.volume = 0;
        this.repo.nominalValue = 0;
        this.repo.marketValue = 0;
        this.repo.repo_haircut_ = 0;
        this.repo.repo_haircut = "";
        this.repo.sellPrice = 0;
        this.repo.settlementValueCurrency = 0;
        this.repo.repurchase_rate_ = 0;
        this.repo.repurchase_rate = "";
        this.repo.repurchase_price_ = 0;
        this.repo.repurchase_price = "";
        this.repo.repurchasePriceCurrency = 0;
        this.repo.account = "";
        this.repo.counter_client_code = "";
        this.repo.counter_broker_code = this.participantCode;
        this.repo.side = 'sell';
        this.repo.repo_type = "BuyBack";
        this.repo.participant = this.participantCode;
        let date = new Date();
        date.setDate(date.getDate() + 1); 
        this.repo.terminationDate = date;
        this.updateTerminationDate(this.repo.terminationDate, false);
    }

    onSubmit(model: any, isValid: boolean) {
       
      if (this.validateOrder()) {
        this.repo.price = this.repo.price_.toString();
        this.repo.market = this.repo.market.toUpperCase();
        if(this.repo.repo_type === 'BuyBack'){
           this.repo.side ='sell';
        }else if(this.repo.repo_type === 'SellBack'){
          this.repo.side ='buy';
        }

        this.repo.gtd = this.repo.terminationDate;
        this.repo.expiryDate = this.repo.terminationDate.toISOString();
        this.repo.is_negotiated = true;

        this.repo.repo_haircut = String(this.repo.repo_haircut_);
        this.repo.repurchase_rate = String(this.repo.repurchase_rate_);
        this.repo.repurchase_price = String(this.repo.repurchase_price_);
        this.repo.sender_username = AppConstants.username;

       
        if(this.affirmOrReject === ''){
          this.statusMsg = this.repo.formatOrderSubmitMsg('Repo');
          this.showDialog(this.orderSubmittedDlg);
        }
        else if(this.affirmOrReject === 'C'){            //Cancelled
          this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'C');
          this.showDialog(this.orderCancelledDlg);
        }
        else if(this.affirmOrReject === 'R'){       //Rejected
          this.repo.negotiated_order_state = 'Reject';
          this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'R');
          this.showDialog(this.orderRejectDlg);
        }
        else if(this.affirmOrReject === 'A'){      //Accepted
          if(Number(this.repo.volume) !== Number(this.repoAffirmData.volume) || Number(this.repo.repo_haircut) !== Number(this.repoAffirmData.repo_haircut) ||
          Number(this.repo.repurchase_rate_) !== Number(this.repoAffirmData.repurchase_rate)) {
           this.repo.negotiated_order_state = 'PartiallyAccepted';
         }else{
          this.repo.negotiated_order_state = 'Accept';
         }
          this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'A');
          this.showDialog(this.orderAffirmDlg);
        }
        else if(this.affirmOrReject === 'P'){       //partiallyAccepted
          this.repo.negotiated_order_state = 'Accept';
          this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'A');
          this.showDialog(this.orderAffirmDlg);
        }
        else if(this.affirmOrReject === 'E'){    //maturityExtended
            this.repo.negotiated_order_state = 'Initiate';
            this.repo.negotiated_order_status = 'MaturityExtended';
           this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'E');
           this.showDialog(this.orderExtendDlg);
        }
        else if(this.affirmOrReject === 'RP'){    //Repriced
          this.repo.negotiated_order_state = 'Initiate';
          this.repo.negotiated_order_status = 'Repriced';
         this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'RP');
         this.showDialog(this.orderRepriceDlg);
      }
        else if(this.affirmOrReject === 'AME'){   //Accept Maturity Extended and Repriced
          this.repo.negotiated_order_state = 'Accept';
         this.statusMsg = this.repo.formatREPOAffirmRejectCancelMsg('Repo' , 'A');
         this.showDialog(this.orderExtendDlg);
      }
       
      }
    }


    cancelOrder(): void {
      this.loader.show();
      let cancelOrder = new CancelOrder();
      cancelOrder.order = this.repo;
      this.orderService.cancelOrder(cancelOrder).subscribe((res) => {
         // this.loader.hide();
      }, error => {
         // this.loader.hide();
      });
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




    submitOrder() {
      this.loader.show();
      this.disabledSubmit = true;
      this.repo.counter_broker_code = this.repo.counter_broker_code.toUpperCase();
      let alertMessage: AlertMessage = new AlertMessage();
      if (this.repo.settlementValue === undefined || this.repo.settlementValue === null || Number.isNaN(this.repo.settlementValue)) {
        this.repo.settlementValue = 0;
      }
      this.orderService.submitOrder(this.repo).subscribe(
        data => {
          this.disabledSubmit = false;
          this.resetForm();
        },
        (error) => {
           
          this.disabledSubmit = false;
          this.resetForm();
          this.loader.hide();
           alertMessage.message = AppUtility.ucFirstLetter(AppUtility.removeQuotesFromStartAndEndOfString(JSON.parse(JSON.stringify(error)).error));
          if (alertMessage.message.length > 0) {
            alertMessage.type = 'danger';
          }
          else {
            alertMessage.type = 'success';
          }
          this.alertMessage = alertMessage;
          this.showOrderConfirmationMsg();
  
        });
  
     // this.onAlertOk();
    }





    onAlertOk(): void {
      this.resetForm();
      this.collateral.focus();
    }



    onAlertCancel(): void {
      this.collateral.focus();
    }

    validateOrder(): boolean {
        let errorMsg: string = '';
        if (this.collateral.text === '' || this.collateral.text === AppConstants.PLEASE_SELECT_STR) {
          this.collateral.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.price_) || this.repo.price_ < 1) {
          this.cleanPrice.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.volume) || this.repo.volume < 1) {
          this.quantity.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.repo_haircut_) || this.repo.repo_haircut_ < 1) {
          this.haircut.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.terminationDate)) {
          this.terminationDate.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.repurchase_rate_) || this.repo.repurchase_rate_ < 1) {
          this.repurchase_rate.focus();
          return false;
        }
        else if (!AppUtility.isValidVariable(this.repo.account) || this.repo.account == AppConstants.PLEASE_SELECT_STR) {
          this.account.focus();
          return false;
        }

        if(!this.intra){
          if (!AppUtility.isValidVariable(this.repo.counter_broker_code) || this.repo.counter_broker_code == '' || this.repo.counter_broker_code == AppConstants.PLEASE_SELECT_STR) {
            this.counterBroker.focus();
            return false;
          }
        }else{
          if (!AppUtility.isValidVariable(this.repo.counter_client_code) || this.repo.counter_client_code == '' || this.repo.counter_client_code == AppConstants.PLEASE_SELECT_STR) {
            this.counterAccount.focus();
            return false;
          }
        }
        return true;
    }



    symbolList() {
        if (AppUtility.isValidVariable(AppConstants.participantId))

            this.listingService.getParticipantSecurityExchangesNew(AppConstants.participantId)
                .subscribe(restData => {
                    if (AppUtility.isValidVariable(restData)) {
                        this.updateSymbolList(restData);
                    }
                },
                    error => {
                        this.errorMessage = <any>error.message;
                       // this.toast.error(this.errorMessage, 'Error');
                    });
    }


    updateSymbolList(data) {
       
        let symbolList: any[] = [];
        let cmbItem: ComboItem;
        let repoIndex: number = 0;

        if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].marketCode.toUpperCase() === AppConstants.MARKET_TYPE_REPO_) {
                    symbolList[repoIndex] = data[i];
                    symbolList[repoIndex].value = data[i].displayName_;
                    repoIndex++;
                }
            }

            cmbItem = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
            symbolList.unshift(cmbItem);
            this.repo.symbol = '';

        }
        this.collateralList = symbolList;
    }

    onSymbolChange(): void {
        this.repo.symbol = '';
        this.repo.market = '';
        this.repo.exchange = '';
        this.splitSymbolExchMkt();
        this.generateRepoTypeList();
        this.getBondDetails();

        if (this.intra) {
            this.repo.counter_broker_code = this.participantCode;
        }
        else {
           // this.generatecounterBorkerList();
        }

    }




  onChangeRepoType = (event) => {
    if(AppUtility.isValidVariable(event)){
       if(event === 'BuyBack'){
        this.isRepoTypeBuyBack = true;
        this.repo.side = 'sell';
       }else{
        this.isRepoTypeBuyBack = false;
        this.repo.side = 'buy';
       }
    }
  }




    splitSymbolExchMkt() {
        let strArr: any[];
        if (this.collateral.selectedValue != null && this.collateral.selectedValue.length > 0) {
            strArr = AppUtility.isSplitSymbolMarketExchange(this.collateral.selectedValue);
            this.repo.symbol = (typeof strArr[0] === 'undefined') ? '' : strArr[0];
            this.repo.market = (typeof strArr[1] === 'undefined') ? '' : strArr[1];
            this.repo.exchange = (typeof strArr[2] === 'undefined') ? '' : strArr[2];
           
            this.updateExchangeMarketIds();
            if (this.dataService.isValidRepoSymbol(this.repo.exchange, this.repo.market, this.repo.symbol)) {
                this.shareOrderService.setExchange(this.repo.exchange);
                this.shareOrderService.setMarket(this.repo.market);
                this.shareOrderService.setSymbol(this.repo.symbol);
                this.socket.fetchFromChannel("best_orders", { "exchange": this.repo.exchange, "market": this.repo.market, "symbol": this.repo.symbol });
                this.errorMessage = undefined;
                this.authServiceOMS.socket.emit('symbol_sub', { 'exchange': this.repo.exchange, 'market': this.repo.market, 'symbol': this.repo.symbol });
                this.getBestMarketAndSymbolSummary(this.repo.exchange, this.repo.market, this.repo.symbol);
            }
        }
        else {
           // this.clientList = [];
           // this.resetForm();
        }


    }


    showOrderConfirmationMsg() {
        if (this.alertMessage.type === 'success') {
          this.isConfirmationSuccess = true;
          this.isConfirmationRejected = false;
        } else if (this.alertMessage.type === 'danger') {
          this.isConfirmationRejected = true;
          this.isConfirmationSuccess = false;
        }

        this.cdr.detectChanges();
        setTimeout(() => {
          this.isConfirmationRejected = false;
          this.isConfirmationSuccess = false;
        }, AppConstants.TIME_OUT_CONFIRMATION_MSG);
      }


    updateorderConfirmation(data) {
        
        if(data.market === AppConstants.MARKET_TYPE_REPO_){
          let alertMessage: AlertMessage = this.repo.formatOrderConfirmationMsg(data, 'Repo');
          this.alertMessage = alertMessage;
          this.loader.hide();
          this.showOrderConfirmationMsg();
          this.resetForm();
        }
      
      }



    updateSymbolStatsData(data) {
         
        if (this.repo.symbol === data.symbol) {
          this.symbolStats.updateSymbolStatsForOrderWindow(data);
          this.cdr.detectChanges();
        }
      }


      updateBestMarketAndSymbolStats(data) {
        if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
          // update symbol stats
          if (AppUtility.isValidVariable(data.symbol_summary.stats)) {
            if (this.repo.exchange === data.symbol_summary.stats.exchange
              && AppConstants.MARKET_TYPE_DEBT_  === data.symbol_summary.stats.market
              && this.repo.symbol.toString().toUpperCase() === data.symbol_summary.symbol.code.toString().toUpperCase()) {
              data.symbol_summary.stats.symbol = data.symbol_summary.symbol.code;
              this.updateSymbolStatsData(data.symbol_summary.stats);
            }
          }
        }
    
      }



      getBestMarketAndSymbolSummary(exchangeCode, marketCode, securityCode) {
        if (AppUtility.isValidVariable(exchangeCode) &&
          AppUtility.isValidVariable(marketCode) &&
          AppUtility.isValidVariable(securityCode)) {
            
          this.orderService.getBestMarketAndSymbolStats(exchangeCode, AppConstants.MARKET_TYPE_DEBT_, securityCode)
            .subscribe(data => {
              this.appState.showLoader = false;
              if (AppUtility.isValidVariable(data)) {
                this.updateBestMarketAndSymbolStats(data);
              }
            },
              error => {
                this.appState.showLoader = false; this.errorMessage = <any>error;
              });
        }
      }


    getBondDetails() {
       
        this.securityMarketDetails = new SecurityMarketDetails();
        this.securityMarketDetails.fisDetail.couponRate = 0;
        if (this.exchangeId > 0 && this.marketId > 0 && this.securityId > 0) {
          this.appState.showLoader = true;
          this.listingService.getSymbolMarket(this.exchangeId, this.marketId, this.securityId)
            .subscribe(data => {
    
              this.appState.showLoader = false;
              if (AppUtility.isValidVariable(data)) {
                this.securityMarketDetails.updateSecurityMarketData(data);
                if(AppUtility.isNullOrEmpty(this.affirmOrReject) && !AppUtility.isValidVariable(this.repoAffirmData)){
                  this.repo.price_ = Number(this.symbolStats.last_trade_price) == null || Number(this.symbolStats.last_trade_price) == 0 ? Number(this.symbolStats.last_day_close_price) : Number(this.symbolStats.last_trade_price);
                  this.updateDirtyPrice(this.repo.price_);
                }else{
                  this.updateDirtyPrice(this.repo.price_);
                }
              
              }
            },
              error => {
    
                this.appState.showLoader = false;
                this.errorMessage = <any>error;
    
              });
        }
      }



    public onCleanPriceChange = () => {
         this.updateDirtyPrice(this.repo.price_);
    }

      updateDirtyPrice(cleanPrice) {
         
        let dirtyPrice = 0;
        this.calculateAccrued();
        dirtyPrice = Number(cleanPrice) + (Number(this.securityMarketDetails.accrudeProfitRepo) * 100);
        this.repo.dirtyPrice = dirtyPrice; 
        this.updateNominalMarketValue(dirtyPrice);
        this.repo.yield = this.securityMarketDetails.calculatePriceToYield(this.repo.price_, this.repo.volume, 0, this.isBondPricingMechanismPercentage);
      }



    public onVolumeChange = () => {
        if(AppUtility.isValidVariable(this.repo.volume)){
           this.updateNominalMarketValue(this.repo.dirtyPrice);
           this.calculateAccrued();
            this.calculatePurchasePrice(this.repo.repo_haircut_);
            this.getBondPaymentSchedule();
            this.calculateRepoPrice();
        }
    }




    calculateRepoPrice = () => {
          
        let repoPrice = 0;
        let purchasePrice = Number(this.repo.sellPrice);
        let daysInPeriod = this.securityMarketDetails.daysInPeriod;
        let interestRate = Number(this.repo.repurchase_rate_);

        if (purchasePrice != 0 && daysInPeriod && Number(daysInPeriod) > 0 ) {
      
          let interestAmount = (purchasePrice * interestRate) / 100;
          let days = AppUtility.getDaysBetweenDates(this.repo.contract_initial_date , this.repo.terminationDate);
          repoPrice = purchasePrice + interestAmount * (days / Number(daysInPeriod));
      
          let couponPaymentWithInterest = this.getCouponPaymentWithInterest(this.repo.terminationDate);
      
          if (couponPaymentWithInterest > 0) {
            repoPrice = repoPrice - couponPaymentWithInterest;
          }
      
          this.repo.repurchase_price_ = repoPrice;
          this.repo.repurchasePriceCurrency = Number(this.repo.repurchase_price_) * Number(this.securityMarketDetails.currencyRate);
        }
      };
      


      getCouponPaymentWithInterest(terminationDate) {
         
        let couponPaymentWithInterest = 0;
        let cashFlow = 0;
        let interestOnCouponPayment = 0;
        let couponPayment = 0;
        let quantity = Number(this.repo.volume);
        let repoRate = Number(this.repo.repurchase_rate_);
        const d1 = new Date(this.repo.terminationDate);
        const d2 = new Date(this.securityMarketDetails.nextCouponDate);

        // If there is a coupon before the termination date 
        if (AppUtility.isValidVariable(this.securityMarketDetails.fisDetail) && AppUtility.isValidVariable(this.securityMarketDetails.fisDetail.bondType) 
        && this.securityMarketDetails.fisDetail.bondType.bondTypeId != AppConstants.BOND_TYPE_ZERO_COUPON_ID  && (d1.getTime() >= d2.getTime())) {
      
          let couponFrequency = 1;
      
          if (this.securityMarketDetails.fisDetail.couponFrequency.frequencyCode == "A") {
            couponFrequency = 1;
          } else if (this.securityMarketDetails.fisDetail.couponFrequency.frequencyCode == "B") {
            couponFrequency = 2;
          } else if (this.securityMarketDetails.fisDetail.couponFrequency.frequencyCode == "Q") {
            couponFrequency = 4;
          } else if (this.securityMarketDetails.fisDetail.couponFrequency.frequencyCode == "M") {
            couponFrequency = 12;
          }
      
          cashFlow = (Number(this.securityMarketDetails.fisDetail.parValue) * quantity *
            (Number(this.securityMarketDetails.fisDetail.couponRate) / 100)) / couponFrequency;
      
      
          if (true) {
            cashFlow = cashFlow * (1 - Number(this.securityMarketDetails.capitalTax) / 100);
          }
          // Loop until repurchase/expiry date and calculate of of coupon payment between this period.
          
      
          let bondPaymentSchedule = null;
          let days = 0;
          let couponPaymentV = 0; 
          let couponPayment = 0;
          for (let key in this.bondPaymentsSchedule) {
      
            bondPaymentSchedule = this.bondPaymentsSchedule[key];
            let paymentDate = new Date(bondPaymentSchedule.paymentDate);
            
            if ((new Date(paymentDate).getTime()) >= (new Date().getTime()) && (new Date(terminationDate).getTime()) >= (new Date(paymentDate).getTime())) {
              
             couponPaymentV = couponPaymentV + Number(bondPaymentSchedule.markup) ;
              couponPayment = Number(couponPayment) + Number(cashFlow);
              days = AppUtility.getDaysBetweenDates(new Date(paymentDate.toDateString()) , new Date(terminationDate.toDateString()));
          
      
              let daysInPeriod = this.securityMarketDetails.daysInPeriod;
              interestOnCouponPayment = interestOnCouponPayment + (cashFlow *
                (days / daysInPeriod * (repoRate / 100)));
            }
          }
      
          couponPaymentWithInterest = couponPayment + interestOnCouponPayment;
      
        }
      
        return couponPaymentWithInterest;
      }



      onInitialDateChange = (event) => {
           
          this.repo.contract_initial_date = new Date(event.target.value);
          this.calculateRepoPrice();
        
       
      };
      
      // ----------------------------------------------------------------------
      onTerminationDateChange = (event) => {
         
      //  this.repo.terminationDate = new Date(event.target.value);
        this.updateTerminationDate(this.repo.terminationDate , false)
        this.calculateRepoPrice();
      };
      // -----------------------------------------------------------------------








    getBondPaymentSchedule(): void {
          if(AppUtility.isValidVariable(this.securityId)){
            this.listingService.getPaymentScheduleForSecurity(this.securityId, false).subscribe((restData) => {
                restData.pop()
                if (restData.length > 0) {
                    this.bondPaymentsSchedule = restData;
                }else{
                    this.bondPaymentsSchedule = [];
                }  
              }, (error) => {
                this.dialogCmp.statusMsg = 'Something Went Wrong';
               
              });
          }
      }



      onChangeInterestRate = () => {
        if(Number(this.repo.repurchase_rate_) > 0){
            this.calculateRepoPrice();
        }
       
      };

 
    onChangeHaircut = () => {
        if (Number(this.repo.repo_haircut_) > 0) {
          this.calculatePurchasePrice(this.repo.repo_haircut_);
          this.calculateRepoPrice();
        }
      };




    calculatePurchasePrice = (haircut) => {

        let purchasePrice = 0;
        let marketValue = this.repo.marketValue;
      
        if (haircut > 0) {
          purchasePrice = marketValue - marketValue * (haircut / 100);
        } else {
          purchasePrice = marketValue;
        }
        this.repo.repo_haircut_ = haircut;
        this.repo.sellPrice = purchasePrice;
        this.repo.settlementValueCurrency = Number(this.repo.sellPrice) * Number(this.securityMarketDetails.currencyRate);
        this.getBondPaymentSchedule();
      }




      updateNominalMarketValue(dirtyPrice) {
         
        let nominalValue = 0;
        let marketValue = 0;
        let quantity = this.repo.volume;
      
        if (quantity == 0 || quantity == null) {
          quantity = 1;
        }
      
        if (this.securityMarketDetails.securityType !== undefined && this.securityMarketDetails.securityType.toUpperCase() == AppConstants.SECURITY_TYPE_BONDS.toUpperCase()) {
          nominalValue = quantity * Number(this.securityMarketDetails.parValue);
      
          // marketValue = nominalValue * (Number(AppUtility.format(dirtyPrice, this.state.selectedMarket.PRECISION) ) / 100);
          marketValue = nominalValue * (Number(dirtyPrice) / 100);
          this.repo.nominalValue = nominalValue;
          this.repo.marketValue = marketValue;
        } else {
      
          marketValue = quantity * Number(this.repo.price_);
          this.repo.nominalValue = 0;
          this.repo.marketValue = marketValue;
          
       
        }
      
        this.calculatePurchasePrice(this.repo.repo_haircut_);
         this.calculateRepoPrice();
      }




      updateTerminationDate = (date, shouldbeDateTomorrow) => {
         
          if (date != null && !shouldbeDateTomorrow) {
          this.checkWeeklyHolidays(date);
          this.checkNationalHolidays(date);
          if (date.toDateString() == new Date().toDateString()) {
            return;
          }
          this.repo.terminationDate = new Date(date);
        }
      
        this.calculateRepoPrice();
      }




    public getWeeklyHolidays = (exchangeId : number) => {
         this.listingService.getWeeklyOffByExchange(exchangeId).subscribe((res : any) => {
               if(AppUtility.isValidVariable(res) && !AppUtility.isEmptyArray(res)){
                    this.weeklyHolidays = res; 
                }else{
                    this.weeklyHolidays = [];
                }
         }, (error : any) => { 
             this.errorMessage = error;
         })
    }


    public getNationalHolidays = (exchangeId : number) => {
        this.listingService.getPublicHolidaysByExchange(exchangeId).subscribe((res : any) => {
              if(AppUtility.isValidVariable(res) && !AppUtility.isEmptyArray(res)){
                   this.nationalHolidays = res; 
               }else{
                   this.nationalHolidays = [];
               }
        }, (error : any) => { 
            this.errorMessage = error;
        })
   }



      checkWeeklyHolidays = (date) => {
         let subscribedWeeklyHolidays = this.weeklyHolidays;
      
        let isDayOff = false;
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const selectedDay = days[date.getDay()];
        for (let index = 0; index < subscribedWeeklyHolidays.length; index++) {
          const element = subscribedWeeklyHolidays[index];
          if (element.weekDay == selectedDay.toUpperCase()) {
            this.isNextDayIsHoliday(date, "WEEKLYOFF")
          }
        };
        return isDayOff = false;
      }
      
      //---------------------------------------------------------------------------------------
      
      
      checkNationalHolidays = (date) => {
         let subscribedNationalHolidays : any[] = []; 
         subscribedNationalHolidays = this.nationalHolidays;
      
        let isDayOff = false;
        if (AppUtility.isValidVariable(subscribedNationalHolidays)) {
          if (Array.isArray(subscribedNationalHolidays)){
            for (let index = 0; index < subscribedNationalHolidays.length; index++) {
                const element = subscribedNationalHolidays[index];
                const dateFromHoliday = new Date(element.holidayDate).toDateString();
                const dateFromUser = date.toDateString();
                if (dateFromHoliday == dateFromUser) {
                  this.isNextDayIsHoliday(date, "NATIONALHOLIDAY")
                }
              }
          }
        }
      
        return isDayOff = false;
      }
      
      //--------------------------------------------------------------------------------------------
      
      isNextDayIsHoliday = (date, typeOfHoliday) => {
      
        let weeklyOff = false;
        date.setDate(date.getDate() + 1);
        if (typeOfHoliday == "WEEKLYOFF") {
          this.checkWeeklyHolidays(date);
        } else if (typeOfHoliday == "NATIONALHOLIDAY") {
          this.checkNationalHolidays(date)
        }
      }









      calculateAccrued() {
        // zero coupon check 
        if (AppUtility.isValidVariable(this.securityMarketDetails)
        && AppUtility.isValidVariable(this.securityMarketDetails.exchangeCode)
        && AppUtility.isValidVariable(this.securityMarketDetails.fisDetail)
        && AppUtility.isValidVariable( this.securityMarketDetails.fisDetail.bondType)
        && AppUtility.isValidVariable(this.securityMarketDetails.fisDetail.bondType.bondTypeId)) {
    
          this.accruedInterest = this.calculateAccruedProfitForRepo(Number(this.repo.volume) , this.repo.contract_initial_date);
          this.accruedInterest = this.securityMarketDetails.toTrunc(this.accruedInterest, 4);
          this.securityMarketDetails.accrudeProfit = this.calculateAccruedInterest(Number(this.repo.volume));    
          if (this.securityMarketDetails.capitalTax > 0) {
            this.addTaxExpWithAccruedProfiteRepo();
            this.addTaxExpWithAccruedProfite();
          }
         
          this.updateSettlementAmount();
    
        } else {
          this.accruedInterest = 0;
          this.securityMarketDetails.accrudeProfit = 0;
          this.securityMarketDetails.accrudeProfitRepo = 0;
          this.updateSettlementAmount();
        }
      }


      calculateAccruedProfitForRepo(quantity, initialDate) {
         
        let accruedProfit = 0;
        let freqNumber = 1;
        this.securityMarketDetails.accrudeProfitRepo = 0;
        if (quantity === undefined || quantity == null || quantity == 0) {
          quantity = 1;
        }
    
        if (AppUtility.getDaysBetweenDates(new Date(initialDate), new Date(this.securityMarketDetails.nextCouponDate)) == 0) {
          accruedProfit = 0;
        } 
        else
        {
          let accruedDaysDifference = AppUtility.getDaysBetweenDates(new Date(new Date(this.securityMarketDetails.lastCouponDate).toDateString()), new Date(initialDate.toDateString()));
          let coupansDaysDifference = AppUtility.getDaysBetweenDates(new Date(new Date(this.securityMarketDetails.lastCouponDate).toDateString()), new Date(this.securityMarketDetails.nextCouponDate));
          let accruedDaysRatio = accruedDaysDifference / coupansDaysDifference;
          let tenurecoupanRate = 0;
          if (this.securityMarketDetails.couponFrequency.frequencyCode == "A") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 1;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "B") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 2;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "Q") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 4;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "M") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 12;
          }
          tenurecoupanRate = tenurecoupanRate / 100;
          accruedProfit = Number(Number(tenurecoupanRate * accruedDaysRatio).toFixed(9));
        }
        this.securityMarketDetails.accrudeProfitRepo = accruedProfit;
        return this.securityMarketDetails.accrudeProfitRepo;
        //this.updateSettlementAmount();
      }



      calculateAccruedInterest(quantity) {
         
        let accruedProfit = 0;
        let freqNumber = 1;
        this.securityMarketDetails.accrudeProfit = 0;
    
        if (quantity === undefined || quantity == null || quantity == 0) {
          quantity = 1;
        }
    
        if (AppUtility.getDaysBetweenDates(
          new Date(this.securityMarketDetails.settlementDate), new Date(this.securityMarketDetails.nextCouponDate)) == 0) {
          accruedProfit = 0;
        } else {
          let accruedDaysDifference = AppUtility.getDaysBetweenDates(new Date(this.securityMarketDetails.lastCouponDate).toDateString(), new Date(new Date(this.repo.contract_initial_date).toDateString()));
          let coupansDaysDifference = AppUtility.getDaysBetweenDates(new Date(new Date(this.securityMarketDetails.lastCouponDate).toDateString()), new Date(this.securityMarketDetails.nextCouponDate));
          let accruedDaysRatio = accruedDaysDifference / coupansDaysDifference;
          let tenurecoupanRate = 0;
          if (this.securityMarketDetails.couponFrequency.frequencyCode == "A") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 1;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "B") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 2;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "Q") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 4;
          } else if (this.securityMarketDetails.couponFrequency.frequencyCode == "M") {
            tenurecoupanRate = this.securityMarketDetails.couponRate / 12;
          }
    
          tenurecoupanRate = tenurecoupanRate / 100;
          let tenureAccruedRatio = Number(tenurecoupanRate * accruedDaysRatio).toFixed(9);
          accruedProfit = Number(this.securityMarketDetails.parValue) * quantity * Number(tenureAccruedRatio);
        }
    
        this.securityMarketDetails.accrudeProfit = accruedProfit;
        return  this.securityMarketDetails.accrudeProfit;
        //this.updateSettlementAmount();
      }







      addTaxExpWithAccruedProfiteRepo() {
        // difference
        let calculatedAccruedProfit = this.securityMarketDetails.accrudeProfitRepo;
        let newAccruedProfit = 0;
        if (AppUtility.isValidVariable(this.securityMarketDetails.capitalTax) && this.securityMarketDetails.capitalTax > 0) {
          newAccruedProfit =   calculatedAccruedProfit * (1 - Number(this.securityMarketDetails.capitalTax / 100));
          this.accruedInterest = this.securityMarketDetails.toTrunc(newAccruedProfit, 4);
          this.securityMarketDetails.setAccruedProfitRepo(newAccruedProfit);
        }
      }

      addTaxExpWithAccruedProfite() {
        // difference
        let calculatedAccruedProfit = this.securityMarketDetails.accrudeProfit;
        let newAccruedProfit = 0;
        if (AppUtility.isValidVariable(this.securityMarketDetails.capitalTax) && this.securityMarketDetails.capitalTax > 0) {
          newAccruedProfit =   calculatedAccruedProfit * (1 - Number(this.securityMarketDetails.capitalTax / 100));
          this.accruedInterest = this.securityMarketDetails.toTrunc(newAccruedProfit, 4);
          this.securityMarketDetails.setAccruedProfit(newAccruedProfit);
        }
      }



      updateSettlementAmount() {
     
        if (Number(this.repo.volume) == 0 || Number(this.repo.price_) == 0) {
          this.repo.settlementValue = 0
        }
        else {
          if (this.securityMarketDetails != null && this.securityMarketDetails.fisDetail != null
            && this.securityMarketDetails.fisDetail.bondType != null
            && this.securityMarketDetails.fisDetail.bondType.bondTypeId != 0) {
            if (this.isBondPricingMechanismPercentage)
              this.repo.value = (Number(this.repo.volume) * this.securityMarketDetails.parValue) * (Number(this.repo.price_) / 100);
            else
              this.repo.value = (Number(this.repo.volume) * this.securityMarketDetails.parValue) * (Number(this.repo.price_));
          } else {
            this.repo.value = Number(this.repo.volume) * Number(this.repo.price_);
          }
          this.repo.settlementValue = Number(this.repo.value) + Number(this.securityMarketDetails.accrudeProfit);
        }
    
      }




    updateExchangeMarketIds() {
        this.exchangeId = 0;
        this.marketId = 0;
        this.securityId = 0;
        if (AppUtility.isValidVariable(this.collateralList) && !AppUtility.isEmpty(this.collateralList)) {
            for (let i = 0; i < this.collateralList.length; i++) {
                if (this.collateralList[i].exchangeCode === this.repo.exchange &&
                    this.collateralList[i].marketCode === this.repo.market &&
                    this.collateralList[i].securityCode === this.repo.symbol) {

                    this.exchangeId = this.collateralList[i].exchangeId;
                    this.marketId = this.collateralList[i].marketId;
                    this.securityId = this.collateralList[i].securityId;
                    
                }
            }
           // this.getClientsList(this.exchangeId);
        }
    }

    getClientsList(exchangeId) {
        this.listingService.getClientListByExchangeBrokerShort(exchangeId, AppConstants.participantId, true, true)
            .subscribe(restData => {
                if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
                    this.clientList = restData;
                    if(AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE){
                      let x = { "displayValue_": AppConstants.PLEASE_SELECT_STR, "clientCode": AppConstants.PLEASE_SELECT_STR };
                      this.clientList.unshift(x);
                    }
                  
                    this.repo.account = this.clientList[0].clientCode;
                } else {
                    this.clientList = [];
                    if(AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE){
                      let x = { "displayValue_": AppConstants.PLEASE_SELECT_STR, "clientCode": AppConstants.PLEASE_SELECT_STR };
                      this.clientList.unshift(x);
                    }
                    this.repo.account = this.clientList[0].clientCode;
                }
                this.cdr.detectChanges();
            },
                error => {
                    this.errorMessage = <any>error.message
                    //this.toast.error(this.errorMessage, 'Error')

                });
    }




    generatecounterBorkerList = () => {
      this.listingService.getParticipantListbyCodeNameType("", "", false)
      .subscribe(
        restData => {
          if(AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)){
            this.brokersList = restData;
            if(!AppUtility.isEmpty(AppConstants.participantCode)){
              let indexToRemove = -1;
              this.brokersList.forEach((obj, index) => {
                if (obj.participantCode === AppConstants.participantCode) {
                  indexToRemove = index;
                }
              });
              
              if (indexToRemove !== -1) {
                this.brokersList.splice(indexToRemove, 1);
              }
            }
      
            let cmbItem: ComboItem;
            cmbItem = new ComboItem(AppConstants.PLEASE_SELECT_STR, '');
            this.brokersList.unshift(cmbItem);
            this.repo.counter_broker_code = this.brokersList[0].value;
          }else{
            this.brokersList = [];
          }
         
        },
        error => {
          this.errorMessage = <any>error.message;
        });
    }

    addFromValidations() {
        this.myForm = this._fb.group({
            repo : ['intra', Validators.compose([Validators.required])],
            collateral: ['', Validators.compose([Validators.required])],
            cleanPrice: ['', Validators.compose([Validators.required])],
            dirtyPrice: ['', Validators.compose([Validators.required])],
            quantity: ['', Validators.compose([Validators.required])],
            nominalValue: ['', Validators.compose([Validators.required])],
            marketValue: ['', Validators.compose([Validators.required])],
            repoType: ['', Validators.compose([Validators.required])],
            haircut: ['', Validators.compose([Validators.required])],
            sellPrice: ['', Validators.compose([Validators.required])],
            sellPriceCurrency : [''],
            repurchasePriceCurrency : [''],
            initialDate: ['', Validators.compose([Validators.required])],
            terminationDate: ['', Validators.compose([Validators.required])],
            repurchase_rate: ['', Validators.compose([Validators.required])],
            repurchasePrice: ['', Validators.compose([Validators.required])],
            account: ['', Validators.compose([Validators.required])],
            borker: ['', Validators.compose([Validators.required])],
            counterBroker: ['', Validators.compose([Validators.required])],
            counterAccount: ['', Validators.compose([Validators.required])],

            subCategory : [''],
            bondType : [''],
            couponRate : [''],
            lastCouponDate : [''],
            nextCouponDate : [''],
            maturityDate : [''],
            tenure : [''],
            parValue : [''],
            currency : [''],
            couponFrequency : [''],

        });
    }


}