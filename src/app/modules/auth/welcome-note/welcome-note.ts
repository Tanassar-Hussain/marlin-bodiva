import { Component, OnChanges, OnInit } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { ListingService } from 'app/services/listing.service';
import { AppConstants } from 'app/app.utility';

@Component({
    selector: 'welcome-note',
    templateUrl: './welcome-note.html',

})
export class WelcomeComponent implements OnInit, OnChanges {
    lang: any
    userName: string = "Usama"
    phoneNumber: string = "+922366541545"
    userId: number;
    errorMessage: string;
    welcomeMsg: any = ""

    constructor(private translate: TranslateService, private loader: FuseLoaderScreenService, private listingService: ListingService) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
        this.userId = AppConstants.userId
    }

    ngOnChanges() {
    }

    ngOnInit() {
        this.getWelcomeMsgByUserId();
    }



    getWelcomeMsgByUserId() {
        
        this.loader.show();
        this.listingService.getWelcomeMsgByUserId(this.userId, this.lang).subscribe(res => {
            this.loader.hide();
            this.welcomeMsg = res.welcomeMsg;

        }, error => {
            this.loader.hide();
            if (error.message) {
                this.errorMessage = <any>error.message;
            }
            else {
                this.errorMessage = <any>error;
            }
            // this.dialogCmp.statusMsg = this.errorMessage;
            // this.dialogCmp.showAlartDialog('Error');
        })
    }

}