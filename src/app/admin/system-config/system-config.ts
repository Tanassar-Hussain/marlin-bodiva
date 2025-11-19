'use strict';
import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Sector } from 'app/models/sector';
import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services/listing.service';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { IPagedCollectionView, } from '@grapecity/wijmo';
import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { SystemConfig } from 'app/models/system-config';


declare var jQuery: any;

@Component({

  selector: 'system-config',
  templateUrl: './system-config.html',
})

export class SystemConfigPage implements OnInit {

  public myForm: FormGroup;

  itemsList: wjcCore.CollectionView;
  selectedItem: SystemConfig;
  errorMessage: string;

  public hideForm = false;
  public isSubmitted: boolean;
  public isEditing: boolean;
  selectedIndex: number = 0;
  private _pageSize = 0;
  //claims: any;
  paramtersList : any = [
    {name : AppConstants.PLEASE_SELECT_STR, value : AppConstants.PLEASE_SELECT_VAL},
    {name : "MODE", value : "MODE"}
];

valuesList : any = [
    {name : AppConstants.PLEASE_SELECT_STR, value : AppConstants.PLEASE_SELECT_VAL},
    {name : "Online", value : '1'},
    {name : "Offline", value : '0'}
];

  @ViewChild('flex') flex: wjcGrid.FlexGrid;
  @ViewChild('sectorCode') sectorCode: wjcInput.InputMask;
  @ViewChild('dialogCmp') dialogCmp: DialogCmp;
  lang: string;

  constructor(private appState: AppState, private listingService: ListingService, private _fb: FormBuilder, public userService: AuthService2,
    private translate: TranslateService, private loader: FuseLoaderScreenService) {
    this.selectedItem = new SystemConfig();
    this.clearFields();
    this.hideForm = false;
    this.isSubmitted = false;
    this.isEditing = false;
    //this.claims = authService.claims;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngxtranslate__________________________________________
  }

  ngOnInit() {
   
    // Add Form Validations
    this.addFromValidations();
    this.getAllSystemConfigurations();

  }

  ngAfterViewInit() {
    var self = this;
    $('#add_new').on('shown.bs.modal', function (e) {
      self.sectorCode.focus();
    });
  }

  /*********************************
 *      Public & Action Methods
 *********************************/


  public clearFields() {
    if (AppUtility.isValidVariable(this.myForm)) {
      this.myForm.markAsPristine();
    }


    if (AppUtility.isValidVariable(this.itemsList)) {
      this.itemsList.cancelEdit();
      this.itemsList.cancelNew();
    }

    this.hideForm = false;
    this.isSubmitted = false;
    this.isEditing = false;

 
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

  public onCancelAction() {
    this.clearFields();
    this.hideForm = false;
  }

  public onNewAction() {
    this.clearFields();
    this.hideForm = true;
  }

  public onEditAction() {
    this.clearFields();
    this.selectedIndex = this.flex.selection.row;
    this.selectedItem = JSON.parse(JSON.stringify(this.flex.rows[this.selectedIndex].dataItem));
    if (!AppUtility.isEmpty(this.selectedItem)) {
      this.hideForm = true;
      this.isEditing = true;
    }
  }

  public onSaveAction(model: any, isValid: boolean) {
    this.isSubmitted = true;
    if (isValid) {
      this.loader.show();
      if (this.isEditing) {
        let x = {
            name : this.selectedItem.name,
            value : this.selectedItem.value,
            description : this.selectedItem.description
        }
        this.listingService.saveSystemConfig(x).subscribe(
            data => {
              this.loader.hide();
              this.getAllSystemConfigurations();
              this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
              this.dialogCmp.showAlartDialog('Success');
            },
            err => {
              this.loader.hide();
              this.hideForm = true;
              if(err.message){
                this.errorMessage = err.message;
              }
              else {
                this.errorMessage = err;
              }
              this.dialogCmp.statusMsg = this.errorMessage;
              this.dialogCmp.showAlartDialog('Error');
            }
          );
      }
      else {
        this.listingService.saveSystemConfig(this.selectedItem).subscribe(
          data => {
            this.loader.hide();
            this.getAllSystemConfigurations();
            this.dialogCmp.statusMsg = AppConstants.MSG_RECORD_SAVED;
            this.dialogCmp.showAlartDialog('Success');
          },
          err => {
            this.loader.hide();
            this.hideForm = true;
            if(err.message){
              this.errorMessage = err.message;
            }
            else {
              this.errorMessage = err;
            }
            this.dialogCmp.statusMsg = this.errorMessage;
            this.dialogCmp.showAlartDialog('Error');
          }
        );
      }
    }
  }

  /***************************************
 *          Private Methods
 **************************************/

  private getAllSystemConfigurations = () => {
    this.loader.show();
    this.listingService.getSystemConfig().subscribe(
        restData => {
          this.loader.hide();
          if (AppUtility.isEmptyArray(restData)) {
            this.errorMessage = AppConstants.MSG_NO_DATA_FOUND;
          } else {
            restData.forEach((element : any , index : any) => {
                element.srNo = index+1;
                if(element.value === '1'){
                    element.valueStr = "Online";
                }else if(element.value === '0'){
                    element.valueStr = "Offline";
                }
            })
            this.itemsList = new wjcCore.CollectionView(restData);
          }
        },
        error => {
          this.loader.hide();
          this.errorMessage = <any>error.message;
        })
  }

 

  private addFromValidations() {
    this.myForm = this._fb.group({
        parameter: ['', Validators.compose([Validators.required])],
        scValue: ['', Validators.compose([Validators.required])],
      
    });
  }

  public hideModal() {
    jQuery('#add_new').modal('hide');   // hiding the modal on save/updating the record
  }

  public getNotification(btnClicked) {
    if (btnClicked == 'Success')
      this.hideModal();
  }
}