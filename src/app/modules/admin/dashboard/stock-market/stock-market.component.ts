import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { User } from "../../../../core/user/user.types";

import SwiperCore, { Autoplay, Pagination, Navigation } from "swiper";
import { TranslateService } from '@ngx-translate/core';

SwiperCore.use([Autoplay, Pagination, Navigation]);

@Component({
    selector: 'stock-market',
    templateUrl: './stock-market.component.html',
    styleUrls: ['./stock-market.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class StockMarketComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentUser: User;
    lang: string;

    constructor(
        private _router: Router, private translate: TranslateService,) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
    }

    ngOnInit(): void {
        this.currentUser = JSON.parse(sessionStorage.getItem('user'));
    }

    becomeAnInvestor(): void {
        window.open(`http://192.168.36.61:4200/initial-reg/${this.currentUser.userId}`, '_blank');
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }


}
