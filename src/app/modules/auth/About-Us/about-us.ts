import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AuthService } from 'app/core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';

interface TextArr {
    pageHeading: string;
    pageDetail1: string;
    pageDetail2: string;
    pageDetail3: string;
  }

@Component({
    selector: 'about-us',
    templateUrl: './about-us.html',

    encapsulation: ViewEncapsulation.None,
})
export class AboutUsComponent implements OnInit, OnChanges {

    identifier = 'ABOUT_US'
    lang: string;
    textArr: TextArr = { pageHeading: "", pageDetail1: "", pageDetail2: "", pageDetail3: "" }
    @Input() parentLang = '';
    @Input() loggedIn: boolean;
    isloggedIn = true

    constructor(private splash: FuseLoaderScreenService,
        private auth_service: AuthService,
        private toast: ToastrService,

    ) {
        this.splash.hide();
        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
    }

    ngOnChanges() {
        if (this.parentLang != undefined && this.parentLang != null && this.parentLang != "") {
            this.lang = this.parentLang
        }
        if (this.loggedIn != undefined && this.loggedIn != null) {
            this.isloggedIn = this.loggedIn
        }
    }

    ngOnInit() {
        this.getAboutUsData()
    }

    getAboutUsData() {
        this.splash.show();

        this.auth_service.pages(this.identifier, this.lang).subscribe(res => {
            this.splash.hide();     
            this.textArr = {
                pageHeading: res.pageHeading,
                pageDetail1: res.pageDetail1,
                pageDetail2: res.pageDetail2,
                pageDetail3: res.pageDetail3
            }
        }, (error) => {
            this.splash.hide();
            this.toast.error('Something went wrong', 'Error');
        })
    }

}
