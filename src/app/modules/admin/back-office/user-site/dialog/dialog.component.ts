import { Component, Inject, ViewEncapsulation, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'dialog-cmp',
    templateUrl:'./dialog.template.html',
})

export class DialogCmp {

    modal = true;
    dialogIsVisible: boolean = false;

    public statusMsg: string = '';
    public cssClass: string = '';
    lang:any

    @ViewChild('successDialog',{ static: false }) successDialog: wjcInput.Popup;
    @ViewChild('errorDialog',{ static: false }) errorDialog: wjcInput.Popup;
    @ViewChild('warningDialog',{ static: false }) warningDialog: wjcInput.Popup;
    @ViewChild('notificationDialog',{ static: false }) notificationDialog: wjcInput.Popup;
    @ViewChild('confirmationDialog',{ static: false }) confirmationDialog: wjcInput.Popup;
    @ViewChild('successDialogLocal',{ static: false }) successDialogLocal: wjcInput.Popup;
    @ViewChild('errorDialogLocal',{ static: false }) errorDialogLocal: wjcInput.Popup;

    @Output() btnClick: EventEmitter<any> = new EventEmitter();

    constructor(private translate: TranslateService,) {

   //_______________________________for ngx_translate_________________________________________

   this.lang = localStorage.getItem("lang");
   if (this.lang == null) { this.lang = 'en' }
   this.translate.use(this.lang)
   //______________________________for ngxtranslate__________________________________________


    }

    public showDialog(dlg: wjcInput.Popup) {
        if (dlg) {
            dlg.modal = this.modal;
            dlg.hideTrigger = dlg.modal ? wjcInput.PopupTrigger.None : wjcInput.PopupTrigger.Blur;
            dlg.show();
        }
    };

    public showAlartDialog(dialogName: String) {
        
        if (dialogName == 'Success')
            this.showDialog(this.successDialog);
        else if (dialogName == 'Error')
            this.showDialog(this.errorDialog);
            else if (dialogName == 'LocalError')
            this.showDialog(this.errorDialogLocal);
        else if (dialogName == 'Warning')
            this.showDialog(this.warningDialog);
        else if (dialogName == 'Notification')
            this.showDialog(this.notificationDialog);
        else if (dialogName == 'Confirmation')
            this.showDialog(this.confirmationDialog);
        else if (dialogName == 'LocalSuccess')
            this.showDialog(this.successDialogLocal);
    }

    onClick(btnClicked) {
        this.btnClick.emit(btnClicked);
    }
}