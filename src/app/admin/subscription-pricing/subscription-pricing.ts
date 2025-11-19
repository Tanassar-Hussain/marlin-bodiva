import { Component, Input, OnChanges, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
declare var jQuery: any;

@Component({
    selector: 'subscription-pricing',
    templateUrl: './subscription-pricing.html',
    styleUrls: ['./subscription-pricing.scss'],
})
export class SubscriptionPricingComponent implements OnInit{
 
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
    selectedItem: SubscriptionPricing;
    currencyList: any;
    isEditing: boolean = false;
    hideForm: boolean = false;

    constructor(
        private splash: FuseLoaderScreenService,
      
        private toast: ToastrService,
        private translate: TranslateService,
        private listingService : ListingService,
        private fb : FormBuilder
  
    ) {
           //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________

    this.selectedItem = new SubscriptionPricing();
 

    this.itemsList = [];

    }
   

    ngOnInit() {

  

        this.addFormValidations();
        this.getSubscriptionsTypes();
        this.getSubscriptionBilling();
        this.populateAllCurrencies();
        
        this.getSubscriptionPricingList();
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
         this.selectedItem = new SubscriptionPricing();
    }


    public clearFields = () => {
      this.selectedItem = new SubscriptionPricing();
      this.selectedItem.billingId = null;
      this.selectedItem.comments = "";
      this.selectedItem.currencyId = null;
      this.selectedItem.price = null;
      this.selectedItem.subscriptionId = null;
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




      public getSubscriptionsTypes=()=>{
        this.subscriptionTypesList = [];
        this.listingService.getSubsriptionsType().subscribe((res:any)=>{
            if(!AppUtility.isEmptyArray(res)){
                this.subscriptionTypesList = res;
                  let s = new SubscriptionTypes();
                  s.name = AppConstants.PLEASE_SELECT_STR;
                  s.subscriptionId = AppConstants.PLEASE_SELECT_VAL;
                  this.subscriptionTypesList.unshift(s);
                  this.selectedItem.subscriptionId = this.subscriptionTypesList[0].subscriptionId;
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




    

    public getSubscriptionPricingList = () => {
        this.splash.show();
        this.listingService.getSubscriptionPricingList().subscribe((restData:any)=>{
          this.splash.hide();
                   if(AppUtility.isEmptyArray(restData)){
                     this.itemsList = [];
                   }
                   else{
                    restData.map(element => {
                      if(element.billingCode === AppConstants.BILLING_CODE_MONTHLY){ element.billingCode = AppConstants.BILLING_NAME_MONTHLY; }
                      else if(element.billingCode === AppConstants.BILLING_CODE_BI_MONTHLY){ element.billingCode = AppConstants.BILLING_NAME_BI_MONTHLY; }
                      else if(element.billingCode === AppConstants.BILLING_CODE_QUARTERLY){ element.billingCode = AppConstants.BILLING_NAME_QUARTERLY; }
                      else if(element.billingCode === AppConstants.BILLING_CODE_BI_ANNUAL){ element.billingCode = AppConstants.BILLING_NAME_BI_ANNUAL; }
                      else if(element.billingCode === AppConstants.BILLING_CODE_ANNUAL){ element.billingCode = AppConstants.BILLING_NAME_ANNUAL; }
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
           this.getSubscriptionPricingList();
        }
        
      }


 

   public onSaveAction = (data , isValid) => {
    
      let a : any[] = [];
      this.isSubmitted = true;
      this.selectedItem.userId = AppConstants.userId;
      
      if(this.selectedItem.price === 0 || this.selectedItem.price === 0.00){
         isValid = false;
         return;
      }


     


       
      if(isValid){
        this.splash.show();
        if(this.isEditing){

          this.listingService.changeSubscriptionPricing(this.selectedItem).subscribe((res : any)=>{
            this.splash.hide();
            this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
            this.dialogCmp.showAlartDialog('Success');
        }, (error) => {
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
          if(!AppUtility.isEmptyArray(this.itemsList)){
            this.itemsList.forEach(element => {
                 if(element.subscriptionId === this.selectedItem.subscriptionId 
                  && element.billingId === this.selectedItem.billingId && element.currencyId === this.selectedItem.currencyId){
                    this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_ALREADY_EXIST;
                    this.dialogCmp.showAlartDialog('Error');
                    isValid = false;
                     return;
                 }
            })
      }
          this.listingService.saveSubscriptionPricing(this.selectedItem).subscribe((res : any)=>{
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
        name : ['' , Validators.compose([Validators.required])],
        billing : ['' , Validators.compose([Validators.required])],
        price : ['' , Validators.compose([Validators.required])],
        currency : ['', Validators.compose([Validators.required])],
        active : [''],
        comments : [''],
    })
}








    


}