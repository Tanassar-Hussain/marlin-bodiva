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
import { CollectionView, SortDescription, IPagedCollectionView, } from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import { SubscriptionItems } from 'app/models/subscription-items';
import { Privilege } from 'app/models/privilege';
import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';

@Component({
    selector: 'subscription-items',
    templateUrl: './subscription-items.html',
    styleUrls: ['./subscription-items.scss'],
})

export class SubscriptionItemsComponent implements OnInit{
 
    lang: any
    BillingCombo : any[] = [];
    itemsList: any[];
    errorMessage: any;
    myForm : FormGroup;
    isShow : boolean = false;
    isEditing : boolean = false;
    subscriptionTypesList: any[] = [];
    subscriptionItemsList: any[];
 
    subscriptionNameId: Number;
    subscriptionBillingList: any[] = [];
    subscriptionBillingId: any;
    subscriptionsItemsList: any;
    isSubmitted: boolean = false;
    private _pageSize = 0;
    @ViewChild('flex') flex: wjcGrid.FlexGrid;
    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    public selectedItems : SubscriptionItems;

    constructor(
         
       
        private toast: ToastrService,
        private translate: TranslateService,
        private listingService : ListingService,
        private fb : FormBuilder,
        private spinner : FuseLoaderScreenService

  
    ) {
    
    //_______________________________for ngx_translate_________________________________________
    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________

 

    this.itemsList = [];
   

    }
   

    ngOnInit() {
        this.addFormValidations();
        this.clearFields();
        this.populateSubscriptionItemsList();
        this.getSubscriptionsTypes();
        this.getSubscriptionBilling();

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


 

    public clearFields() {
        if (AppUtility.isValidVariable(this.myForm)) {
            this.myForm.markAsPristine();
        }
         this.selectedItems = new SubscriptionItems();
         this.selectedItems.subscriptionId = null;
        this.subscriptionItemsList = [];
        this.isEditing = false;
        this.isSubmitted = false;
        this.unCheckAll();
 
         
    }



    public unCheckAll() {
        for (let i = 0; i < this.itemsList.length; i++) {
            if (this.itemsList[i].hasChild) {
                for (let j = 0; j < this.itemsList[i].childs.length; j++) {
                    this.itemsList[i].childs[j].allowed = false;
                    if (this.itemsList[i].childs[j].hasChild) {
                        for (let k = 0; k < this.itemsList[i].childs[j].childs.length; k++) {
                            this.itemsList[i].childs[j].childs[k].allowed = false;
                            if (this.itemsList[i].childs[j].childs[k].hasChild) {
                                for (let l = 0; l < this.itemsList[i].childs[j].childs[k].childs.length; l++) {
                                    this.itemsList[i].childs[j].childs[k].childs[l].allowed = false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }




   public getSubscriptionItemsById = (event) => {
                this.unCheckAll();
                if(AppUtility.isValidVariable(event)){
                    this.listingService.getSubscriptionItemsBySubsId(event).subscribe((res : any)=>{
                        this.subscriptionsItemsList = res;
                        if (!AppUtility.isEmpty(this.subscriptionsItemsList)) {
                            this.isEditing = true;
                            for (let a = 0; a < res.length; a++) {
                                for (let i = 0; i < this.itemsList.length; i++) {
                                    if (this.itemsList[i].hasChild) {
                                        for (let j = 0; j < this.itemsList[i].childs.length; j++) {
                                            if (this.itemsList[i].childs[j].privilegeId == this.subscriptionsItemsList[a].moduleOptionId) {
                                                this.itemsList[i].childs[j].allowed = true;
                                                continue;
                                            }
                                            if (this.itemsList[i].childs[j].hasChild) {
                                                for (let k = 0; k < this.itemsList[i].childs[j].childs.length; k++) {
                                                    if (this.itemsList[i].childs[j].childs[k].privilegeId == this.subscriptionsItemsList[a].moduleOptionId) {
                                                        this.itemsList[i].childs[j].childs[k].allowed = true;
                                                        continue;
                                                    }
                                                    if (this.itemsList[i].childs[j].childs[k].hasChild) {
                                                        for (let l = 0; l < this.itemsList[i].childs[j].childs[k].childs.length; l++) {
                                                            if (this.itemsList[i].childs[j].childs[k].childs[l].privilegeId == this.subscriptionsItemsList[a].moduleOptionId) {
                                                                this.itemsList[i].childs[j].childs[k].childs[l].allowed = true;
                                                                continue;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else{
                            this.isEditing = false;
                            this.unCheckAll();
                        }
                    }, error => {
                        this.spinner.hide();
                        if(error.message){
                            this.errorMessage = error.message;
                        }
                        else{
                            this.errorMessage = error;
                        }
                       
                    })
                }
                else{
                    this.isEditing = false;
                    this.unCheckAll();
                }
   }















    public onSaveAction = (value , isValid) => {
        
          this.isSubmitted = true;
          this.selectedItems.privileges = [];
          var privilege = [];
          var ind = 0;
          if(AppUtility.isValidVariable(this.selectedItems.subscriptionId)){

            for (let i = 0; i < this.itemsList.length; i++) {
                if (this.itemsList[i].hasChild) {
                    for (let j = 0; j < this.itemsList[i].childs.length; j++) {
                        if (this.itemsList[i].childs[j].hasChild) {
                            for (let k = 0; k < this.itemsList[i].childs[j].childs.length; k++) {
                                
                                    if (this.itemsList[i].childs[j].childs[k].allowed == true) {
                                        privilege[ind] = this.itemsList[i].childs[j].childs[k];
                                        ind++;
                                    }
                              
                            }
                        }
                    }
                }
            }


            if (privilege.length <= 0) {
                if(this.lang === 'pt'){
                    this.dialogCmp.statusMsg = "Selecione alguns itens.";
                }
                else{
                    this.dialogCmp.statusMsg = "Please select some items.";
                }
              
                this.dialogCmp.showAlartDialog('Notification');
                return;
            }else{
                this.spinner.show();
                if(this.isEditing){
                    this.selectedItems.privileges = privilege;
                    this.listingService.updateSubscriptionItems(this.selectedItems).subscribe((res : any)=>{
                        this.spinner.hide();
                        this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_UPDATED;
                        this.dialogCmp.showAlartDialog('Success');
                    }, error => {
                        this.spinner.hide();
                       if(error.message){
                           this.errorMessage = error.message;
                       }
                       else{
                           this.errorMessage = error;
                       }
                       this.dialogCmp.statusMsg = this.errorMessage;
                       this.dialogCmp.showAlartDialog('Error');
                    })
                }
                else{
                    this.selectedItems.privileges = privilege;
                     this.listingService.saveSubscriptionItems(this.selectedItems).subscribe((res : any)=>{
                        this.spinner.hide();
                        this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
                        this.dialogCmp.showAlartDialog('Success');
                     }, error => {
                        this.spinner.hide();
                        if(error.message){
                            this.errorMessage = error.message;
                        }
                        else{
                            this.errorMessage = error;
                        }
                        this.dialogCmp.statusMsg = this.errorMessage;
                        this.dialogCmp.showAlartDialog('Error');
                     })
                }
            }
            
            
          }
         

 

    }

 

   

    public getNotification(btnClicked) {
        if (btnClicked == 'Success'){
            
            
        }
        
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
                  this.selectedItems.subscriptionId = this.subscriptionTypesList[0].subscriptionId;
                  this.subscriptionNameId = this.subscriptionTypesList[0].subscriptionId;
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
                  this.subscriptionBillingId = this.subscriptionBillingList[0].billingId;
            }
            else{
                this.subscriptionBillingList = [];
            }
        })
      }







      private populateSubscriptionItemsList() {
        this.spinner.show();
        this.listingService.getSubscriptionItemsList()
            .subscribe(
                restData => {
                    
                    this.spinner.hide();
                    if (AppUtility.isEmpty(restData)) {
                        this.itemsList = [];
                    } else {
                        this.itemsList = restData;
                    }
                },
                (error) => { 
                    this.spinner.hide();
                    this.errorMessage = <any>error.message}
                );
            }







 
 
    public allowCheckBoxEvent(optionId, state) {
        
      //  if (state.target.checked) {
        for (let i = 0; i < this.itemsList.length; i++) {
            if (this.itemsList[i].hasChild) {
                for(let j = 0; j < this.itemsList[i].childs.length; j++) {
                    
                    if (this.itemsList[i].childs[j].privilegeId == optionId) {
                        this.itemsList[i].childs[j].allowed = state.target.checked;
                        break;
                    }

                    if (this.itemsList[i].childs[j].hasChild) {
                        for (let k = 0; k < this.itemsList[i].childs[j].childs.length; k++) {
                            if (this.itemsList[i].childs[j].childs[k].privilegeId == optionId) {
                                this.itemsList[i].childs[j].childs[k].allowed = state.target.checked;
                                break;
                            }
                            

                        }
                    }
                }
            }
        }
      //  }
    }








public addFormValidations(){
  this.myForm = this.fb.group({
        name : ['' , Validators.compose([Validators.required])],
        active : ['']
    })
}








    


}