import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/core/auth/auth.service';
import { contactUs } from 'app/models/contactUs';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'contact-us',
    templateUrl: './contact-us.html',
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
})
export class ContactUsComponent implements OnInit, OnChanges {

    contactUsForm: FormGroup;
    selectedItem: contactUs
    notificationMsgsArr: any[] = []
    resArr: any[] = []
    lang: string;
    @Input() loggedIn: boolean;
    isloggedIn = true

    constructor(
        private auth_service: AuthService,
        private _formBuilder: FormBuilder,
        private splash: FuseLoaderScreenService,
        private toast: ToastrService,
        private translate: TranslateService

    ) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________ 
    }

    ngOnChanges() {
        if (this.loggedIn != undefined && this.loggedIn != null) {
            this.isloggedIn = this.loggedIn
        }
    }

    ngOnInit() {
        this.clearFields();
        this.notificationMsgs();
    }
    clearFields() {
        this.selectedItem = new contactUs()
        this.formFields()
    }

    formFields() {
        this.contactUsForm = this._formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            subject: [''],
            emailAddress: ['', [Validators.required, Validators.email]],
            message: ['', Validators.compose([Validators.required, Validators.maxLength(1000)])]

        });
    }

    onSubmit() {

        if (this.contactUsForm.valid) {

            this.splash.show();
            this.contactUsForm.disable();

            let formData = this.contactUsForm.getRawValue();
            // this.selectedItem

            this.auth_service.contactUs(formData).subscribe((res) => {
                this.contactUsForm.enable();
                this.splash.hide();
                this.toast.success(this.notificationMsgsArr[0], this.resArr[0]);
            }, (error) => {
                this.splash.hide();
                this.contactUsForm.enable();
               // this.toast.error(this.notificationMsgsArr[1], this.resArr[1]);

            })
        }
    }

    notificationMsgs() {
        this.translate.get(['Translation.Query sent successfully', 'Translation.Something went wrong, Please try again later', 'Translation.Please Fill missing Fields', 'Translation.Success', 'Translation.Error']).subscribe((res: any) => {
            this.notificationMsgsArr.push(res['Translation.Query sent successfully']);  //0
            this.notificationMsgsArr.push(res['Translation.Something went wrong, Please try again later']); //1
            this.notificationMsgsArr.push(res['Translation.Please Fill missing Fields']); //2

            this.resArr.push(res['Translation.Success']);  //0
            this.resArr.push(res['Translation.Error']);  //1

        })
    }

}