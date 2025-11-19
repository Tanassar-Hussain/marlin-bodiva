import {
    AfterViewInit,
    Component,
    Input,
    OnInit,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants, AppUtility } from 'app/app.utility';
import { DashboardBoService } from '../dashboard-bo.service';



@Component({
    selector: 'top-sellers',
    templateUrl: './top-sellers.html',
    styleUrls: ['../dashboard-bo.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
})




export class TopSellersComponent implements OnInit, AfterViewInit {
    lang: string;
    dataLimitVal: number;
    dataSortType: string;
    dataLimit: any[] = []
    dataSort: any[] = []
    tableColumns: string[] = ['Code', 'Name', 'Value', 'Volume'];
    participantId: number
    data: MatTableDataSource<any> = new MatTableDataSource();

    @Input() fromDate = '';
    @Input() toDate = '';

    initialData: any[] = [{}]
    date: any;

    constructor(private translate: TranslateService, private dashboardBoService: DashboardBoService, private splash: FuseLoaderScreenService,) {
        //_______________________________for ngx_translate_________________________________________

        this.lang = localStorage.getItem("lang");
        if (this.lang == null) { this.lang = 'en' }
        this.translate.use(this.lang)
        //______________________________for ngxtranslate__________________________________________

        this.participantId = AppConstants.claims2.participant.id
        this.dataLimitArr();
        this.dataSortArr();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.getTopSellers()
    }

    ngOnInit(): void {
        this.date = AppUtility.formatDate__DD_MM_YYYY(new Date)
    }

    public ngAfterViewInit(): void {
    }

    dataLimitChanges(val) {
        this.getTopSellers()
    }

    sortData(val) {
        this.getTopSellers()
    }

  

    getTopSellers() {
        this.splash.show();
        this.dashboardBoService.topSellers(this.participantId, this.fromDate, this.toDate, this.dataSortType, this.dataLimitVal).subscribe(res => {
            this.splash.hide();
            if (this.dataSortType == 'value') {
                res = res.sort(function (a, b) { return b.totalValue - a.totalValue });
            }
            else if (this.dataSortType == 'volume') {
                res = res.sort(function (a, b) { return b.totalVolume - a.totalVolume });
            }
        
            this.data.data = res

        }, error => {
            this.splash.hide();
        });

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

    dataSortArr() {
        let levelArray = [];
        this.translate.get(['Translation.Value', 'Translation.Volume']).subscribe((res: any) => {
            levelArray.push(res['Translation.Value']);
            levelArray.push(res['Translation.Volume']);

            let valueArr = ['value', 'volume'];
            let levelCmbList = [];
            let cmbItem = {};

            for (let i = 0; i < levelArray.length; i++) {
                cmbItem = { 'value': levelArray[i], 'id': valueArr[i] }
                levelCmbList.push(cmbItem);
            }
            this.dataSort = levelCmbList;
            this.dataSortType = this.dataSort[0].id
        })
    }

}