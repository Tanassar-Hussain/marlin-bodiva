import {
    AfterViewInit,
    Component,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { MatTableDataSource } from "@angular/material/table";
import { fuseAnimations } from '@fuse/animations';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { DashboardBoService } from '../../dashboard-bo.service';

@Component({
    selector: 'cash-obligation',
    templateUrl: './cash-obligation.html',
    styleUrls: ['../../dashboard-bo.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})


export class CashObligationComponent implements OnInit, AfterViewInit {
    lang: string;
    tableColumns: string[] = ['Market', 'Side', 'Value',  'NetCash' ];
    data: MatTableDataSource<any> = new MatTableDataSource();
    totalCash: number = 0
    date: string = ''
    participantId: any;
    buy: any;
    sell: any;
    localCurrency : string = AppConstants.LOCAL_CURRENCY_AOA_CODE;
    foreignCurrency : string = AppConstants.FOREIGN_CURRENCY_USD_CODE;

    constructor(private translate: TranslateService, private dashboardBoService: DashboardBoService) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________
        this.participantId = AppConstants.claims2.participant.id
    }

    ngOnInit(): void {
        this.date = AppUtility.formatDate__DD_MM_YYYY(new Date)
        this.getCashObligationData()
        this.buySellVal()
    }

    public ngAfterViewInit(): void {

    }

    getCashObligationData() {
        this.dashboardBoService.getCahsObligationData(this.participantId).subscribe(res => {
            let levelArray = [];
            this.translate.get(['Translation.Net Obligation']).subscribe((tran: any) => {
                levelArray.push(tran['Translation.Net Obligation']);
                let total = { value: levelArray[0], netObligation: 0, total: true }
                res.map(a => {

                    a.buy = this.buy
                    a.sell = this.sell
                    total.netObligation += Number(a.net)
                    a.total = false

                })
                res.push(total)
                this.data.data = res
            })
        })
    }

    buySellVal(){
        let levelArray = [];
        this.translate.get(['Translation.Buy','Translation.Sell']).subscribe((tran: any) => {
            levelArray.push(tran['Translation.Buy']);
            levelArray.push(tran['Translation.Sell']);
            this.buy = levelArray[0]
            this.sell =levelArray[1]
        })
    }



}