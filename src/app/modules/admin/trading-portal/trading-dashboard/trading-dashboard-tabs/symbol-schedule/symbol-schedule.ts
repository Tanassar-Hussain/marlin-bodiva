import { Component, ViewEncapsulation, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, Input, OnChanges } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AppState } from 'app/app.service';

import { AuthService } from 'app/services-oms/auth-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { AuthService2 } from 'app/services/auth2.service';
import { DataServiceOMS } from 'app/services-oms/data-oms.service';

import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';

import { DialogCmp } from 'app/modules/admin/back-office/user-site/dialog/dialog.component';
import { ListingService } from 'app/services/listing.service';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { AppUtility } from 'app/app.utility';

@Component({
    selector: 'symbol-schedule',
    templateUrl: './symbol-schedule.html',
    encapsulation: ViewEncapsulation.None,
})
export class SymbolScheduleComponent implements OnInit, OnChanges {

    @Input() inheritedSymbolDetails: any;
    lang: string;
    bondPaymentScheduleArr: any = [];
    securityId: number = 0
    private _pageSize = 0;
    symbolDetails: any;

    @ViewChild('dialogCmp') dialogCmp: DialogCmp;
    @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;


    constructor(private appState: AppState, public authService: AuthService2, private dataService: DataServiceOMS,
        private listingService: ListingService, private orderService: OrderService, private splash: FuseLoaderScreenService,
        private _fb: FormBuilder, private translate: TranslateService,
        public auth2Service: AuthService2, private router: Router, private _changeDetectorRef: ChangeDetectorRef,) {

        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngx_translate__________________________________________

    }
    ngOnChanges(): void {
        this.viewSchedule();
    }

    ngOnInit(): void {

    }

    // -------------------------------------------------------------------------
    get pageSize(): number {
        return this._pageSize;
    }
    // -------------------------------------------------------------------------
    set pageSize(value: number) {
        if (this._pageSize !== value) {
            this._pageSize = value;
            if (this.flexGrid) {
                (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
            }
        }
    }

    viewSchedule(){

        let securityId = this.inheritedSymbolDetails.securityId
        if (AppUtility.isValidVariable(securityId)) {
            this.splash.show();
            this.bondPaymentScheduleArr = []
            this.listingService.getPaymentScheduleForSecurity(securityId, false).subscribe((restData) => {
                restData.pop()
                if (restData.length) {
                    this.bondPaymentScheduleArr = restData;
                    this._changeDetectorRef.detectChanges();
                }
                this.splash.hide();
            }, (error) => {
                this.splash.hide();
                this.dialogCmp.statusMsg = 'Something Went Wrong';
                this.dialogCmp.showAlartDialog('Error');
            });
        }
    }

}
