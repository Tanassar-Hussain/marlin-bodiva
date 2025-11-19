import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { ComboItem } from 'app/models/combo-item';
import { ListingService } from 'app/services/listing.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionTypes } from 'app/models/subscription-types';
import { SubscriptionBilling } from 'app/models/subscription-billing';
import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';
import { CollectionView, SortDescription, IPagedCollectionView, } from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import { SubscriptionPricing } from 'app/models/subscription-pricing';
import { Currency } from 'app/models/currency';
import { SubscriptionPayment } from 'app/models/subscription-payment';
import { Participant } from 'app/models/participant';
import { DatePipe } from '@angular/common';
import { rest } from 'lodash';
declare var jQuery: any;

@Component({
    selector: 'subscription-payment',
    templateUrl: './subscription-payment.html',
    styleUrls: ['./subscription-payment.scss'],
})
export class SubscriptionPaymentComponent implements OnInit{
 
    lang: any
    BillingCombo : any[] = [];
    itemsList: any[] = [];
    errorMessage: any = "";
    myForm : FormGroup;
    isShow : boolean = false;
    subscriptionTypesList: any[] = [];
 
    subscriptionNameId: Number;
    subscriptionBillingList: any[] = [];
    subscriptionBillingId: any;
    isSubmitted : boolean = false;
  
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    private _pageSize = 0;
    @ViewChild('flex') flex: wjcGrid.FlexGrid;
    selectedItem: SubscriptionPayment;
    currencyList: any;
    isEditing: boolean = false;
    hideForm: boolean = false;
  participantsList: any;
  currencyName: string = "";
  todayDate: Date;
  dueDate: Date;
  billingCode: String = "";

    constructor(
        private splash: FuseLoaderScreenService,
        private toast: ToastrService,
        private translate: TranslateService,
        private listingService : ListingService,
        private fb : FormBuilder,
        public datePipe : DatePipe,
        public cdr : ChangeDetectorRef
  
    ) {
           //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________


    this.todayDate = new Date();

    this.selectedItem = new SubscriptionPayment();
 

    this.itemsList = [];

    }
   

    ngOnInit() {

        this.clearFields();

        this.addFormValidations();
        this.getSubscriptionsTypes();
        this.getSubscriptionBilling();
        this.populateAllCurrencies();
        this.getParticipantsList();
        this.getSubscriptionPaymentGridList();
    }





    get pageSize(): number {
        return this._pageSize;
      }
    
      set pageSize(value: number) {
        if (this._pageSize != value) {
          this._pageSize = value;
          if (this.flex) {
            (<IPagedCollectionView><unknown>this.flex.collectionView).pageSize = value;
          }
        }
      }

   

    public onNewAction = () => {
      
        this.isSubmitted = false;
        this.isEditing = false;
        this.clearFields();
    }


    public clearFields = () => {
       let todayDate = new Date();
      this.selectedItem = new SubscriptionPayment();
      this.selectedItem.participantId = null;
      this.selectedItem.productSubscriptionId = null;
      this.selectedItem.billingId = null;
      this.selectedItem.price = 0;
      this.selectedItem.currencyId = null;
      this.selectedItem.dueDate = null;
      this.selectedItem.validTill = null;
      this.selectedItem.paymentDate = todayDate;
      this.selectedItem.amount = 0;
      this.selectedItem.discount = 0;
      this.billingCode = "";
      this.dueDate = null;
      this.currencyName = "";
    }



    public onEditAction() {
      
      this.clearFields();
      let rowIndex = this.flex.selection.row;
      let item = JSON.parse(JSON.stringify(this.flex.rows[rowIndex].dataItem));

      if (!AppUtility.isEmpty(item)) {
          this.isEditing = true;
          this.selectedItem = JSON.parse(JSON.stringify(item));
          this.showModal();
      }
  }




  public showModal() {
    jQuery("#add_new").modal("show");
}


public hideModal() {
  jQuery("#add_new").modal("hide");   //hiding the modal on save/updating the record
}







public onChangeDueFor = (event) => {
    if(AppUtility.isValidVariable(event) && AppUtility.isValidVariable(this.selectedItem.billingId)){
      if(AppUtility.isValidVariable(this.selectedItem.billingId)  && this.selectedItem.billingId === AppConstants.BILLING_ID_MONTHLY){
        var myDate = new Date(event);
       this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 1));
       }
       else if(AppUtility.isValidVariable(this.selectedItem.billingId) && this.selectedItem.billingId === AppConstants.BILLING_ID_BI_MONTHLY){
        var myDate = new Date(event);
       this.selectedItem.validTill = new Date(myDate.setDate(myDate.getDate() + 15));
       }
       else if(AppUtility.isValidVariable(this.selectedItem.billingId) && this.selectedItem.billingId === AppConstants.BILLING_ID_QUARTERLY){
        var myDate = new Date(event);
       this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 3));
       }
       else if(AppUtility.isValidVariable(this.selectedItem.billingId) && this.selectedItem.billingId === AppConstants.BILLING_ID_BI_ANNUAL){
        var myDate = new Date(event);
       this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 6));
       }
       else if(AppUtility.isValidVariable(this.selectedItem.billingId) && this.selectedItem.billingId === AppConstants.BILLING_ID_ANNUAL){
        var myDate = new Date(event);
       this.selectedItem.validTill = new Date(myDate.setFullYear(myDate.getFullYear() + 1));
       }
    }
}








public onChangeParticipant = (event) =>{
  
  this.currencyName  = "";
  this.billingCode = "";
  this.selectedItem.discount = 0;
     if(AppUtility.isValidVariable(event)){
         this.getSubscriptionByParticipant(event);
         this.getPaymentByParticipant(event);
     }
}



public getSubscriptionByParticipant=(event)=>{
  this.listingService.getSubscriptionByParticipant(event).subscribe((res : any) => {
              
    if(AppUtility.isValidVariable(res)){
      this.selectedItem.productSubscriptionId = res.pricing.subscriptionId;
      this.selectedItem.discount = res.discount;
      this.selectedItem.amount = res.netAmount;
      this.selectedItem.billingId = res.pricing.billingId;
      this.billingCode = res.pricing.billingCode;
      this.selectedItem.price = res.pricing.price;
      this.selectedItem.currencyId = res.pricing.currencyId;
      this.currencyName  = res.pricing.currencyName;
      this.dueDate = res.startDate;
      
       
    }
    else{
      this.selectedItem.discount = 0;
      this.selectedItem.amount = 0;
      this.selectedItem.billingId = null;
      this.selectedItem.productSubscriptionId = null;
      this.selectedItem.price = 0;
      this.selectedItem.currencyId = null;
      this.selectedItem.validTill = null;
      this.currencyName  = "";
      this.dueDate = null;
      
    }
      
        
  }, err => {

    this.selectedItem.discount = 0;
    this.selectedItem.amount = 0;
    this.selectedItem.billingId = null;
    this.selectedItem.productSubscriptionId = null;
    this.selectedItem.price = 0;
    this.selectedItem.currencyId = null;
    this.selectedItem.validTill = null;
    this.currencyName  = "";
    this.dueDate = null;
    if (err.message) {
      this.errorMessage = err.message;
    }
    else {
      this.errorMessage = err;
    }
    // this.dialogCmp.statusMsg = this.errorMessage;
    // this.dialogCmp.showAlartDialog('Error');
  });
}


public getPaymentByParticipant=(event)=>{
   
  this.listingService.getSubscriptionPaymentByParticipant(event).subscribe((res : any) => {
              if(AppUtility.isValidVariable(res) && !AppUtility.isEmptyArray(res)){
                
                let paymentDates : any = [];
                this.dueDate = null;
                var latestDate;
            
                res.forEach((element)=>{
                   paymentDates.push(element.validTill);
                });
                

                if(!AppUtility.isEmptyArray(paymentDates)){
                  
                  if(paymentDates.length === 1){  
                    latestDate = new Date(paymentDates[0]); 
                  }
                  else if(paymentDates.length > 1){ 
                    latestDate = new Date(Math.max(...(paymentDates).map(date => Date.parse(date))));    
                  }
                }
                
                const tomorrow = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate() + 1);
                this.selectedItem.dueDate =  new Date(tomorrow);
                setTimeout(() => {
                  if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_MONTHLY){
                    var myDate = new Date(this.selectedItem.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 1));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_BI_MONTHLY){
                    var myDate = new Date(this.selectedItem.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setDate(myDate.getDate() + 15));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_QUARTERLY){
                    var myDate = new Date(this.selectedItem.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 3));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_BI_ANNUAL){
                    var myDate = new Date(this.selectedItem.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 6));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_ANNUAL){
                    var myDate = new Date(this.selectedItem.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setFullYear(myDate.getFullYear() + 1));
                   }
                }, 150);
      
              
              }   
              else{
                
                setTimeout(() => {
                  this.selectedItem.dueDate =  this.dueDate;
                  if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_MONTHLY){
                    var myDate = new Date(this.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 1));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_BI_MONTHLY){
                    var myDate = new Date(this.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setDate(myDate.getDate() + 15));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_QUARTERLY){
                    var myDate = new Date(this.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 3));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_BI_ANNUAL){
                    var myDate = new Date(this.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setMonth(myDate.getMonth() + 6));
                   }
                   else if(this.billingCode != "" && this.billingCode === AppConstants.BILLING_CODE_ANNUAL){
                    var myDate = new Date(this.dueDate);
                   this.selectedItem.validTill = new Date(myDate.setFullYear(myDate.getFullYear() + 1));
                   }
                }, 150);
               
                 
              }
  }, err => {
    if (err.message) {
      this.errorMessage = err.message;
    }
    else {
      this.errorMessage = err;
    }
    // this.dialogCmp.statusMsg = this.errorMessage;
    // this.dialogCmp.showAlartDialog('Error');
  });
}


public onSaveAction = (data , isValid) => {
      
    let a : any[] = [];
    this.isSubmitted = true;
    this.selectedItem.userId = AppConstants.userId;
    if(this.selectedItem.price === 0 || this.selectedItem.price === 0.00){
      isValid = false;
      return;
   }


    if(this.selectedItem.amount === 0 || this.selectedItem.amount === 0.00){
       isValid = false;
       return;
    }
    
    let tempDueDate = this.datePipe.transform(this.selectedItem.dueDate , "yyyy-MM-dd");;
    this.selectedItem.dueDate = new Date(tempDueDate);
    let tempValidTill = this.datePipe.transform(this.selectedItem.validTill , "yyyy-MM-dd");;
    this.selectedItem.validTill = new Date(tempValidTill);

    if(isValid){
      this.splash.show();
      if(this.isEditing){
        this.listingService.changeSubscriptionPayment(this.selectedItem).subscribe((res : any)=>{
          this.splash.hide();
          this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
          this.dialogCmp.showAlartDialog('Success');
      }, (error)=>{
          this.splash.hide();
          if(error.message){
              this.errorMessage = error.message; 
          }
          else{
              this.errorMessage = error; 
          }

          this.dialogCmp.statusMsg = this.errorMessage;
          this.dialogCmp.showAlartDialog('Error');

      });
      }
      else{
        this.listingService.saveSubscriptionPayment(this.selectedItem).subscribe((res : any)=>{
          this.splash.hide();
          this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
          this.dialogCmp.showAlartDialog('Success');
      }, (error)=>{
          this.splash.hide();
          if(error.message){
              this.errorMessage = error.message; 
          }
          else{
              this.errorMessage = error; 
          }

          this.dialogCmp.statusMsg = this.errorMessage;
          this.dialogCmp.showAlartDialog('Error');

      });
      }
    
    }

 }





public getParticipantsList = () => {
  this.participantsList = [];
  this.listingService.getParticipantListbyCodeNameType("", "", false).subscribe((restData : any)=> {
         if(!AppUtility.isEmptyArray(restData)){
            this.participantsList = restData;
            let p = new Participant();
            p.displayName_ = AppConstants.PLEASE_SELECT_STR;
            p.participantId = AppConstants.PLEASE_SELECT_VAL;
            this.participantsList.unshift(p);
            this.selectedItem.participantId = this.participantsList[0].participantId;
         }
         else{
            this.participantsList = [];
         }
  })
}






      public getSubscriptionsTypes=()=>{
        this.subscriptionTypesList = [];
        this.listingService.getSubsriptionsType().subscribe((res:any)=>{
            if(!AppUtility.isEmptyArray(res)){
                this.subscriptionTypesList = res;
                  let s = new SubscriptionTypes();
                  s.name = AppConstants.PLEASE_SELECT_STR;
                  s.subscriptionId = AppConstants.PLEASE_SELECT_VAL;
                  this.subscriptionTypesList.unshift(s);
                  this.selectedItem.productSubscriptionId = this.subscriptionTypesList[0].subscriptionId;
            }
            else{
                this.subscriptionTypesList = [];
            }
        })
      }




      public getSubscriptionBilling=()=>{
        this.subscriptionBillingList = [];
        this.listingService.getSubscriptionsBilling().subscribe((res:any)=>{
            if(AppUtility.isValidVariable(res)){
                this.subscriptionBillingList = res;
                  let s = new SubscriptionBilling();
                  s.descriptions = AppConstants.PLEASE_SELECT_STR;
                  s.billingId = AppConstants.PLEASE_SELECT_VAL;
                  this.subscriptionBillingList.unshift(s);
                  this.selectedItem.billingId = this.subscriptionBillingList[0].billingId;
            }
            else{
                this.subscriptionBillingList = [];
            }
        })
      }




      public populateAllCurrencies = () => {
        this.listingService.getCurrencyList()
          .subscribe(
            restData => {
              this.currencyList = restData;
              var bc: Currency = new Currency();
              bc.currencyId = AppConstants.PLEASE_SELECT_VAL;
              bc.currencyCode = AppConstants.PLEASE_SELECT_STR;
              this.currencyList.unshift(bc);
             this.selectedItem.currencyId = this.currencyList[0].currencyId;
              
            },
            err => {
        
              if (err.message) {
                this.errorMessage = err.message;
              }
              else {
                this.errorMessage = err;
              }
            });
      }




    

    public getSubscriptionPaymentGridList = () => {
        this.splash.show();
        this.listingService.getSubscriptionPaymentList().subscribe((restData:any)=>{
          this.splash.hide();
          
                   if(AppUtility.isEmptyArray(restData)){
                     this.itemsList = [];
                   }
                   else{
                      restData.map(element => {
                         if(element.billingName === AppConstants.BILLING_CODE_MONTHLY){ element.billingName = AppConstants.BILLING_NAME_MONTHLY; }
                         else if(element.billingName === AppConstants.BILLING_CODE_BI_MONTHLY){ element.billingName = AppConstants.BILLING_NAME_BI_MONTHLY; }
                         else if(element.billingName === AppConstants.BILLING_CODE_QUARTERLY){ element.billingName = AppConstants.BILLING_NAME_QUARTERLY; }
                         else if(element.billingName === AppConstants.BILLING_CODE_BI_ANNUAL){ element.billingName = AppConstants.BILLING_NAME_BI_ANNUAL; }
                         else if(element.billingName === AppConstants.BILLING_CODE_ANNUAL){ element.billingName = AppConstants.BILLING_NAME_ANNUAL; }
                      });

                      this.itemsList = restData;
                   }
        }, (err)=> {
          this.splash.hide();
          if (err.message) {
            this.errorMessage = err.message;
          }
          else {
            this.errorMessage = err;
          }
        });
    }  



 






      public getNotification(btnClicked) {
        if (btnClicked == 'Success'){
           this.onCloseAction();
           this.getSubscriptionPaymentGridList();
        }
        
      }


 
 





 
  public onCloseAction=()=>{
    this.isSubmitted = false;
    this.isEditing = false; 
    this.myForm.markAsPristine();
    this.hideModal();
  }







public addFormValidations(){
  this.myForm = this.fb.group({
        participant : ['' , Validators.compose([Validators.required])],
        subscription : ['' , Validators.compose([Validators.required])],
        billing : ['' , Validators.compose([Validators.required])],
        price : ['' , Validators.compose([Validators.required])],
        discount : ['' , Validators.compose([Validators.required])],
        amount : ['', Validators.compose([Validators.required])],
        dueFor : ['' ,  Validators.compose([Validators.required])],
        validTill : ['',  Validators.compose([Validators.required])],
        paymentDate : ['' ,  Validators.compose([Validators.required])]
    })
}








    


}