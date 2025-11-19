import { state } from '@angular/animations';
import { Component, ElementRef, OnInit, AfterViewInit, Input } from '@angular/core';

import * as wjcCore from '@grapecity/wijmo';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from 'app/app.config';
import { AppUtility } from 'app/app.utility';
// import { AuthService } from 'app/core/auth/auth.service';
import { ShareOrderService } from 'app/modules/admin/oms/order/order.service';
import { AuthService } from 'app/services-oms/auth-oms.service';

 
declare var jQuery: any;

/////////////////////////////////////////////////////////////////////////////

@Component({
  selector: '[subscriptionpopup]',
  templateUrl: './subscription-popup.html'
})
export class SubscriptionPopup implements OnInit, AfterViewInit {
  $el: any;
  config: any;
  lang: any
 
  toDate: string = ''
  @Input('type') type: number;
 

  // --------------------------------------------------------------------

  constructor(el: ElementRef, config: AppConfig, private authService: AuthService, private translate: TranslateService, public shareOrderService: ShareOrderService) {
    this.$el = jQuery(el.nativeElement);
    this.config = config;
 
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________
  }

  // --------------------------------------------------------------------

  ngOnInit(): void {

 
 



  }

  // --------------------------------------------------------------------

  ngAfterViewInit() {
   
    

  }


    // --------------------------------------------------------------------
 

}
