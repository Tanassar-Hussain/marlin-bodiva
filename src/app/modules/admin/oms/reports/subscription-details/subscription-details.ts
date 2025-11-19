

import { DatePipe } from '@angular/common';
import { Component, ViewChild, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';

import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Exchange } from 'app/models/exchange';
import { Market } from 'app/models/market';
import { Symbol } from 'app/models/symbol';
import { TradingDashboardGraphComponent } from 'app/modules/admin/trading-portal/trading-dashboard/trading-dashboard-graph/trading-dashboard-graph.component';
import { ListingService } from 'app/services/listing.service';
declare var jQuery : any;





////////////////////////////////////////////////////////////////

@Component({
    selector: 'subscription-details',
    templateUrl: './subscription-details.html',
    styleUrls: ['../component.style.scss'],
})
export class SubscriptionDetails implements OnInit{

     

    public myForm: FormGroup;
    errorMsg: string = '';
    isMarketDisabled: boolean = true;
    lang:any
    itemsList: any[] = [];
    itemsListPayment : any[] = [];
    errorMessage: String = "";
    @ViewChild('billingContact') billingContact: wjcInput.Popup
    subscriptionName: any;
    dueDate: any;
    validTill: any;
    totalDiffDaysSubs: any;
    isAdvancedPayment: boolean = false;
    minSubscriptionStrength: number = 0;
    intimationDays: number = 0;
    totalDiffDaysUntilToday: number = null;
    subscriptionStrength: number = 0;
    subscriptionStrengthIntimation: number = 0;
    remainingDaysTitle: string = "";
    isNoPayment: boolean = false;
    billingCycle: any;
    subscriptionStatus: any;
    isActiveSubDetail: boolean = true;
    billingAddress: any;
    billingPhone: any;
    billingEmail: any;
    billingCompanyName: any;
    // --------------------------------------------------------------------------

    constructor(private appState: AppState, private listingService : ListingService, private _fb: FormBuilder,
        private translate: TranslateService, private splash: FuseLoaderScreenService,   private datePipe: DatePipe,)
    {
    //_______________________________for ngx_translate_________________________________________

    this.lang=localStorage.getItem("lang");
    if(this.lang==null){ this.lang='en'}
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________
    
    this.itemsList = [];
    this.itemsListPayment = [];
}

    // --------------------------------------------------------------------------

    ngOnInit()
    {
        
        this.checkSubscriptionExist();
        this.getParticipantDetail();
       
    }





    showPopup() {
        jQuery('#billingContact').modal({ backdrop: 'static', keyboard: true });
        jQuery('#billingContact').modal('show');
    }


    hidePopup() {
        jQuery('#billingContact').modal('hide');
        jQuery('#new-order-all-market').modal('hide');
    }




    public checkSubscriptionExist = () => {
        
       this.splash.show();
        if (AppUtility.isValidVariable(AppConstants.participantId) && (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE)) {
            this.listingService.getSubscriptionByParticipant(AppConstants.participantId).subscribe((res: any) => {
                if (AppUtility.isValidVariable(res)) {
                  
                    if (AppUtility.isValidVariable(res.pricing)) {
                        
                        if(AppUtility.isValidVariable(res.pricing.billingCode)){
                            if(res.pricing.billingCode === AppConstants.BILLING_CODE_MONTHLY){ this.billingCycle = AppConstants.BILLING_NAME_MONTHLY; }
                            else if(res.pricing.billingCode === AppConstants.BILLING_CODE_BI_MONTHLY){ this.billingCycle = AppConstants.BILLING_NAME_BI_MONTHLY; }
                            else if(res.pricing.billingCode === AppConstants.BILLING_CODE_QUARTERLY){ this.billingCycle = AppConstants.BILLING_NAME_QUARTERLY; }
                            else if(res.pricing.billingCode === AppConstants.BILLING_CODE_BI_ANNUAL){ this.billingCycle = AppConstants.BILLING_NAME_BI_ANNUAL; }
                            else if(res.pricing.billingCode === AppConstants.BILLING_CODE_ANNUAL){ this.billingCycle = AppConstants.BILLING_NAME_ANNUAL; }
                        }
                        if(AppUtility.isValidVariable(res.active)){
                            if(res.active === true){
                                this.subscriptionStatus = AppConstants.INV_ACTIVE;
                                this.isActiveSubDetail = true;
                            }
                            else{
                                this.subscriptionStatus = AppConstants.INV_INACTIVE;
                                this.isActiveSubDetail = false;
                            }
                        }
                           
                        this.subscriptionName = res.pricing.subscriptionName;
                        this.dueDate = res.startDate;
                        this.intimationDays = res.intimationDays;
                    }
                    this.splash.hide();
                    this.getSubscription();
                }
            }, error => {
                if(error.message){
                    this.errorMessage = error.message;
                }
                else{
                    this.errorMessage = error;
                }
            });
        }

    }









    public getSubscription = () => {
         this.itemsList = [];
        this.validTill = null;
        this.totalDiffDaysSubs = null;
        if (AppUtility.isValidVariable(AppConstants.participantId) && (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE)) {
            this.listingService.getSubscriptionPaymentByParticipant(AppConstants.participantId).subscribe((res: any) => {
                

                if (!AppUtility.isEmptyArray(res)) {

                    if (res.length === 1) {
                        this.dueDate = new Date(res[0].dueDate);
                        this.validTill = res[0].validTill;
                        this.subscriptionName = res[0].productSubscriptionName;
                    }
                    else if (res.length > 1) {
                        const dueDates = [];
                        res.forEach((element => {                                             
                            const todayDateForDue = new Date();                                
                            const dueDateForDue = new Date(element.dueDate);
                            const todayTime = todayDateForDue.getTime();
                            const dueDateTime = dueDateForDue.getTime();
                            if(dueDateTime <= todayTime){
                                dueDates.push(new Date(element.dueDate));
                            }
        
                        }) )

                       // this.dueDate = new Date(Math.max(...res.map(date => Date.parse(date.dueDate))));
                       this.dueDate = new Date(Math.max(...dueDates.map(date => Date.parse(date))));
                       this.validTill = new Date(Math.max(...res.map(date => Date.parse(date.validTill))));

                        res.forEach(element => {
                            if (this.datePipe.transform(this.dueDate, 'yyyy-MM-dd') === element.dueDate && this.datePipe.transform(this.validTill, 'yyyy-MM-dd') === element.validTill) {
                                this.subscriptionName = element.productSubscriptionName;
                            }
                        })

                    }


                   
                    res.map(element => {
                        if(element.billingName === AppConstants.BILLING_CODE_MONTHLY){ element.billingName = AppConstants.BILLING_NAME_MONTHLY; }
                        else if(element.billingName === AppConstants.BILLING_CODE_BI_MONTHLY){ element.billingName = AppConstants.BILLING_NAME_BI_MONTHLY; }
                        else if(element.billingName === AppConstants.BILLING_CODE_QUARTERLY){ element.billingName = AppConstants.BILLING_NAME_QUARTERLY; }
                        else if(element.billingName === AppConstants.BILLING_CODE_BI_ANNUAL){ element.billingName = AppConstants.BILLING_NAME_BI_ANNUAL; }
                        else if(element.billingName === AppConstants.BILLING_CODE_ANNUAL){ element.billingName = AppConstants.BILLING_NAME_ANNUAL; }
                     });
    
                     this.itemsListPayment = res;

                     let validTillDate = new Date(this.validTill);
                     const nextBillDate = new Date(validTillDate.getFullYear(), validTillDate.getMonth(), validTillDate.getDate() + 1);
                    let x = {
                        "productName" : AppConstants.PRODUCT_NAME,
                        "subscription" : this.subscriptionName,
                        "billing" : this.billingCycle,
                        "status" : this.subscriptionStatus,
                        "subscriptionDate" : this.dueDate,
                        "nextBillDate" : nextBillDate

                    }
                   let c : any[] = [];
                   c.push(x);
                    this.itemsList = c;
                }
                else {
                    this.subscriptionStrength = 0;
                    this.isNoPayment = true;
                }

               
            }, (error) => {
                if(error.message){
                    this.errorMessage = error.message;
                }
                else{
                    this.errorMessage = error;
                }
            })
        }
    }







 


    public getParticipantDetail = () => {
         
        this.listingService.getParticipantListbyCodeNameType(AppConstants.participantCode , "" , false).subscribe((res : any)=>{
             if(AppUtility.isValidVariable(res)){
               
                        this.billingAddress = res[0].contactDetail.address1;
                        this.billingPhone = res[0].contactDetail.phone1;
                        this.billingEmail = res[0].contactDetail.email;
                        if(AppUtility.isValidVariable(res[0].contactDetail.companyName)){
                            this.billingCompanyName = res[0].contactDetail.companyName;
                        }
                        else{
                            this.billingCompanyName = res[0].contactDetail.fullName;
                        }  
             }
        }, error => {
                if(error.message){
                    this.errorMessage = error.message;
                }
                else{
                    this.errorMessage = error;
                }
        })
    }

 







 
}
