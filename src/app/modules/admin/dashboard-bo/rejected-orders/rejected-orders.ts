import {
    AfterViewInit,
    Component,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { MatTableDataSource } from "@angular/material/table";
import { fuseAnimations } from '@fuse/animations';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Market } from 'app/models/market';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardBoService } from '../dashboard-bo.service';



@Component({
    selector: 'rejected-orders',
    templateUrl: './rejected-orders.html',
    styleUrls: ['../dashboard-bo.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})




export class RejectedOrdersComponent implements OnInit {
    lang: string;
    tableColumns: string[] = ['Security', 'Account', 'OrderNo', 'DateTime', "Currency" ,'Price', 'Value', 'Volume', 'RejectionReason'];
    dataLimitVal: number;
    dataLimit: any[] = []
    selectedMarketCode: string
    dataSortType: string;
    marketList: any[] = []
    dataSort: any[] = [
        { id: 'value', value: 'Value' },
        { id: 'volume', value: 'Volume' },
    ]

    todayDate: string
    data: MatTableDataSource<any> = new MatTableDataSource();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    errorMessage: any;
    participantId: any;
    date: string;

    constructor(private translate: TranslateService, private listingService: ListingService, private loader: FuseLoaderScreenService, private dashboardService: DashboardBoService) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
        this.participantId = AppConstants.claims2.participant.id
        this.dataLimitArr();
        this.dataSortType = this.dataSort[0].id
    }

    ngOnInit(): void {
        this.todayDate = AppUtility.formatDate_YYYY_MM_DD(new Date)
        this.date = AppUtility.formatDate__DD_MM_YYYY(new Date)
        this.dashboardService.marketList
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {
                if (data.length != 0) {
                    this.marketList = data;
                    this.selectedMarketCode = this.marketList[3].marketCode
                    this.getRejectedOrders()
                }
            });


    }

    dataLimitChanges(val) {
        this.getRejectedOrders()
    }

    onMarketChange() {
        this.getRejectedOrders()
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getRejectedOrders() {

        this.dashboardService.getRejectedOrders(this.participantId, this.selectedMarketCode, this.dataLimitVal, this.todayDate).subscribe(res => {
            res.map(a => {
                if (a.security.imageUrl == null) {
                    a.security.imageUrl = 'assets/img/settlement.png'
                }
                a.value = Number(a.price) * Number(a.volume)
                if(AppUtility.isValidVariable(a.security) && AppUtility.isValidVariable(a.security.currency)){
                    a.currency = a.security.currency.currencyCode;
                }
            })
            this.data.data = res
        })
    }

    dataLimitArr() {
        let levelArray = [];
        this.translate.get(['Translation.Top']).subscribe((res: any) => {
            levelArray.push(res['Translation.Top'] + ' 5');
            levelArray.push(res['Translation.Top'] + ' 10');
            levelArray.push(res['Translation.Top'] + ' 20');

            let valueArr = [5, 10, 20];
            let levelCmbList = [];
            let cmbItem = {};

            for (let i = 0; i < levelArray.length; i++) {
                cmbItem = { 'value': levelArray[i], 'id': valueArr[i] }
                levelCmbList.push(cmbItem);
            }
            this.dataLimit = levelCmbList;
            this.dataLimitVal = this.dataLimit[1].id
        })
    }

}