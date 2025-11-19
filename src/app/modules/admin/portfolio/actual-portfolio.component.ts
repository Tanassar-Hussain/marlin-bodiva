import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';


import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

import pdfMake from "pdfmake/build/pdfmake";  
import pdfFonts from "pdfmake/build/vfs_fonts";  
pdfMake.vfs = pdfFonts.pdfMake.vfs; 


import { ToastrService } from 'ngx-toastr';
import { MatTableDataSource } from '@angular/material/table';

import { PortfolioService } from './portfolio.service';


import { fuseAnimations } from "../../../../@fuse/animations";

import { AppState } from 'app/app.service';
import { AuthService } from 'app/core/auth/auth.service';
import { FormBuilder } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen/loader-screen.service';
import * as wijmo from '@grapecity/wijmo';
import * as chart from '@grapecity/wijmo.chart';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcInput from '@grapecity/wijmo.input';
import { CollectionView, SortDescription, IPagedCollectionView, } from '@grapecity/wijmo';
import { AppConstants, AppUtility } from 'app/app.utility';
import { BehaviorSubject } from 'rxjs';
import { ListingService } from 'app/services/listing.service';
import { DialogCmp } from '../back-office/user-site/dialog/dialog.component';
import { DatePipe } from '@angular/common';
import { Client } from 'app/models/client';
import { PortfolioDetail } from 'app/models/portfolio-detail';
import { type } from 'jquery';
import { NewOrderAll } from '../oms/order/new-order-all/new-order-all';
import { DialogCmpReports } from '../oms/reports/dialog-cmp-reports';
 

@Component({
  selector: 'actual-portfolio',
  templateUrl: './actual-portfolio.component.html',
  styleUrls: ['./actual-portfolio.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})

export class ActualPortfolioComponent implements OnInit {

  investmentValue : string = "LI";
  localCurrencyCode : string = AppConstants.LOCAL_CURRENCY_AOA_CODE;
  foreignCurrencyCode : string = AppConstants.FOREIGN_CURRENCY_USD_CODE;
  summaryLocalInvestment : Number = 0;
  summaryForeignInvestment : Number = 0;
  summaryTotalInvestment : Number = 0;
  summaryTotalVolume : Number = 0;
  summaryCurrentValue : Number = 0;
  summaryNetPL : number = 0;
  palleteColors = ['l(0,0,0,1)#25D325-#5fe85f',  'l(0,0,0,1)#D6B800-#ffb300' , 'l(0,0,1,0)#3DA7FF-#63a6ff' ];

  minWidth: String = "10%";

  equityBarPercent: String;
  equityColor: String = AppConstants.equityColor
  equityPLColor: String = "#FFFFFF"

  bondsBarPercent: String;
  bondsColor: String = AppConstants.bondsColor
  bondsPLColor: String = "#FFFFFF"

  etfBarPercent: String;
  etfColor: String = AppConstants.etfColor
  etfPLColor: String = "#FFFFFF"

  clientIdSearch: any;
  loading: boolean = false;
  NoDataFound: boolean = false;
  @ViewChild('cmbClient', { static: false }) cmbClient: wjcInput.ComboBox;
  @ViewChild('cmbInvestment', { static: false }) cmbInvestment: wjcInput.ComboBox;
  lang: any
  Wjdata: any[];
  WjdataWeight: any[];
  wjDataWeightBarChart: any[];
  tooltipContent = '<b>{x} </b><br/ > {y}';
  tooltipContentPie = '<b>{x} </b>';
  equitiesGraph: number = 10
  bondsGraph: number = 5
  etfGraph: number = 2;
  _pageSize = 0;
  public selectedTab: string = AppConstants.ASSET_CLASS_EQUITIES;
  menu: string[] = ['Name', 'Volume', 'AveragePrice', 'CurrentPrice', 'MarketValue', 'DayP/L', 'TotalP/L', 'LastPurchaseDate', 'BuySell'];
  portfolioDetailDataSource: MatTableDataSource<any> = new MatTableDataSource();
  itemsList: wjcCore.CollectionView;
  public portfolioWeight: string = "PORTFOLIO WEIGHT";

  @ViewChild('flex', { static: false }) flex: wjcGrid.FlexGrid;
  @ViewChild('newOrderAll') newOrderAll: NewOrderAll;
  @ViewChild(DialogCmpReports) dialogCmp: DialogCmpReports;

  errorMessage: any;
  equitiesPortfolioSum: any = null;
  bondsPortfolioSum: any = null;
  etfPortfolioSum: any = null;
  fromClientList: any[];
  fromUserList: any[];
  userType: string;
  equitiesTranslate: any;
  bondsTranslate: any;
  investorProfileStatus: any;
  public portfolioSummaryGridData: any[] = [];
  participantId: number = null;
  tradeType: String = "";
  userId: number;
  actualTradeType = AppConstants.ACTUAL_TRADE_TYPE
  virtualTradeType = AppConstants.VIRTUAL_TRADE_TYPE
  userIdSearch: any;
  showEquitiesTitle: boolean = false;
  showBondsTitle: boolean = false;
  showETFTitle: boolean = false;
  getGraphSymbol: any[] = [];
  investmentList: any[] = [
    {display : "Local Investment" , value : "LI"},
    {display : "Foreign Investment" , value : "FI"}];
  errorMsg: string;

  constructor(
    private _portfolioService: PortfolioService,
    private sanitizer: DomSanitizer,
    private appState: AppState, public authServiceOMS: AuthService,
    private listingSvc: ListingService, private _fb: FormBuilder, private translate: TranslateService, private splash: FuseLoaderScreenService,
    private toast: ToastrService, private datePipe: DatePipe,

  ) {
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________
    this.userType = AppConstants.userType;
    this.userId = AppConstants.userId;
    this.participantId = AppConstants.participantId;
    this.tradeType = AppConstants.tradeType;


    this.translate.get(['EQUITIES', 'BONDS']).subscribe((res: any) => {
      this.equitiesTranslate = (res['EQUITIES']);
      this.bondsTranslate = (res['BONDS']);
    });





   











  }

  ngOnInit(): void { 
    
    if (this.lang == 'pt') {
      this.portfolioWeight = "PESO DA CARTEIRA";
    }
    //ActiualTrade
    if ((this.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) && AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE) {
      this.getClientsList();
    }

    if (this.userType === AppConstants.USER_TYPE_CLIENT_CODE && AppUtility.isValidVariable(AppConstants.participantId) && (AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE)) {
      this.getUserProfileStatus();
    }
    //VirtualTrade
    if ((this.userId != 0) && (this.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || this.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) && (AppConstants.tradeType === AppConstants.VIRTUAL_TRADE_TYPE)) {
      this.getUsersList();
    }

    if ((this.userId != 0) && (this.userType === AppConstants.USER_TYPE_CLIENT_CODE) && (AppConstants.tradeType === AppConstants.VIRTUAL_TRADE_TYPE)) {
      this.getPortfolioByUser();
    }

  }







public exportPDF = () => {

  this.splash.show();
  var date = new Date();
  let transDate = this.datePipe.transform(date, "yyyy-MM-dd");

  //////////////////////////////////////Actual Portfolio Data/////////////////////////
if(this.tradeType === AppConstants.ACTUAL_TRADE_TYPE){

  this.listingSvc.getActualPortfolioDetail(AppConstants.ALL_VAL, this.clientIdSearch, transDate).subscribe((restData: any) => { 
       this.splash.hide();
         if(AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)){
          if(this.lang === 'pt'){
            var docDefinition = {  
              pageOrientation: 'landscape',
              header: function(currentPage, pageCount, pageSize) {
                // computations...
                return {
                  columns: [
                    { text: '', /* extra style attributes */},
                    { text: 'Detalhes do Portfólio', /* extra style attributes */},
                  ],
                };
              },
              footer: function(currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount;},
              content: [  
                {  
                    table: {  
                        headerRows: 1,  
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto' , '*'],  
                        body: [  
                            ['Nome', 'Volume', 'Preço médio', 'Preço atual' , 'Valor de mercado' , "Moeda" ,'Dia P/L' , 'Total P/L', 'LP Data'],  
                            ...restData.map(p => ([p.symbol, p.holding, p.avgPrice, p.currentPrice , p.mktValue, p.currencyCode , p.todayPL , p.totalPL , (p.lastTradeDate) = this.datePipe.transform(p.lastTradeDate, "yyyy-MM-dd")])) 
                        ]
                    }  
                }  
             ],  
            }; 
           }
           else{
            var docDefinition = {  
              pageOrientation: 'landscape',
              header: function(currentPage, pageCount, pageSize) {
                // computations...
                return {
                  columns: [
                    { text: '', /* extra style attributes */},
                    { text: 'Portfolio Details', /* extra style attributes */},
                  ],
                };
              },
              footer: function(currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; },
              content: [  
                {  
                    table: {  
                        headerRows: 1,  
                        widths: ['*', 'auto',   'auto', 'auto', 'auto', 'auto' , 'auto' , 'auto' , '*'],  
                        body: [  
                            ['Name', 'Volume', 'Average Price', 'Current Price' , 'Market Value', "Currency" , 'Day P/L' , 'Total P/L', 'LP Date'],  
                            ...restData.map(p => ([p.symbol, p.holding, p.avgPrice, p.currentPrice , p.mktValue ,  p.currencyCode ,   p.todayPL , p.totalPL , (p.lastTradeDate) = this.datePipe.transform(p.lastTradeDate, "yyyy-MM-dd")])) 
                        ]  
                    },
                    
                },
                
             ],  
           
            }; 
           }
         }
         else{
          this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
          this.dialogCmp.statusMsg = this.errorMsg;
          this.dialogCmp.showAlartDialog('Error');
         }
       
      pdfMake.createPdf(docDefinition).download(); 

  } , (error) =>{
       if(error.message){
         this.errorMsg = error.message;
          this.dialogCmp.statusMsg = this.errorMsg;
          this.dialogCmp.showAlartDialog('Error');
       }
       else{
        this.errorMsg = error;
        this.dialogCmp.statusMsg = this.errorMsg;
        this.dialogCmp.showAlartDialog('Error');
       }
  })

 
}
//////////////////////////////////////Virtual Portfolio Data/////////////////////////
if(this.tradeType === AppConstants.VIRTUAL_TRADE_TYPE){
  this.listingSvc.getVirtualPortfolioDetail(AppConstants.ALL_VAL, this.userIdSearch, transDate).subscribe((restData: any) => { 
    this.splash.hide();
    if(AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)){
      if(this.lang === 'pt'){
        var docDefinition = {  
          pageOrientation: 'landscape',
          header: function(currentPage, pageCount, pageSize) {
            // computations...
            return {
              columns: [
                { text: '', /* extra style attributes */},
                { text: 'Detalhes do Portfólio Virtual', /* extra style attributes */},
              ],
            };
          },
          content: [  
            {  
                table: {  
                    headerRows: 1,  
                    widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto' , '*'],  
                    body: [  
                        ['Nome', 'Volume', 'Preço médio', 'Preço atual' , 'Valor de mercado' , 'Dia P/L' , 'Total P/L', 'LP Data'],  
                        ...restData.map(p => ([p.symbol, p.holding, p.avgPrice, p.currentPrice , p.mktValue , p.todayPL , p.totalPL ,(p.lastTradeDate) = this.datePipe.transform(p.lastTradeDate, "yyyy-MM-dd")])) 
                    ]  
                }  
            }  
         ],  
      
        }; 
       }
       else{
        var docDefinition = {  
          pageOrientation: 'landscape',
          header: function(currentPage, pageCount, pageSize) {
            // computations...
            return {
              columns: [
                { text: '', /* extra style attributes */},
                { text: 'Virtual Portfolio Details', /* extra style attributes */},
              ],
            };
          },
          content: [  
            {  
                table: {  
                    headerRows: 1,  
                    widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto' , '*'],  
                    body: [  
                        ['Name', 'Volume', 'Average Price', 'Current Price' , 'Market Value' , 'Day P/L' , 'Total P/L', 'LP Date'],  
                        ...restData.map(p => ([p.symbol, p.holding, p.avgPrice, p.currentPrice , p.mktValue , p.todayPL , p.totalPL , (p.lastTradeDate) = this.datePipe.transform(p.lastTradeDate, "yyyy-MM-dd")])) 
                    ]  
                }  
            }  
         ],  
      
        }; 
       }
    }
    else{
      this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
      this.dialogCmp.statusMsg = this.errorMsg;
      this.dialogCmp.showAlartDialog('Error');
    }
    
   pdfMake.createPdf(docDefinition).download(); 
} , (error) =>{
  if(error.message){
    this.errorMsg = error.message;
     this.dialogCmp.statusMsg = this.errorMsg;
     this.dialogCmp.showAlartDialog('Error');
  }
  else{
   this.errorMsg = error;
   this.dialogCmp.statusMsg = this.errorMsg;
   this.dialogCmp.showAlartDialog('Error');
  }
})

}

}




 public exportExcel=()=> {
    this.splash.show();
    var date = new Date();
    let transDate = this.datePipe.transform(date, "yyyy-MM-dd");
    if(AppConstants.tradeType === AppConstants.ACTUAL_TRADE_TYPE){
      this.listingSvc.getActualPortfolioDetail(AppConstants.ALL_VAL, this.clientIdSearch, transDate).subscribe((restData: any) => {
        this.splash.hide();
        if(AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)){
          if (AppUtility.isValidVariable(restData)) {
            restData.map(element => {
              element.todayPL = Number(element.todayPL);
              element.totalPL = Number(element.totalPL);
              element.avgPrice = Number(element.avgPrice);
              element.currentPrice = Number(element.currentPrice);
              element.mktValue = Number(element.mktValue);
              element.holding = Number(element.holding);
            })
    
            let workbook = new Workbook();
            let worksheet = workbook.addWorksheet('PortfolioData');
            if(this.lang === 'pt'){
              worksheet.columns = [
                { header: 'Nome', key: 'symbol', width: 32 },
                { header: 'Volume', key: 'holding', width:  20},
                { header: 'Preço médio', key: 'avg_price', width: 20 },
                { header: 'Preço atual', key: 'current_price', width: 20 },
                { header: 'Valor de mercado', key: 'market_value', width: 20 }, 
                { header: 'Moeda', key: 'currency', width: 20 }, 
                { header: 'Dia P/L', key: 'day_pl', width: 20 },
                { header: 'Total P/L', key: 'total_pl', width: 20 },
                { header: 'Data da última compra', key: 'lpd', width: 30 }, 
              ];
          
            }
            else{
              worksheet.columns = [
                { header: 'Name', key: 'symbol', width: 32 },
                { header: 'Volume', key: 'holding', width:  20},
                { header: 'Average Price', key: 'avg_price', width: 20 },
                { header: 'Current Price', key: 'current_price', width: 20 },
                { header: 'Market Value', key: 'market_value', width: 20 }, 
                { header: 'Currency', key: 'currency', width: 20 }, 
                { header: 'Day P/L', key: 'day_pl', width: 20 },
                { header: 'Total P/L', key: 'total_pl', width: 20 },
                { header: 'Last Purchase Date', key: 'lpd', width: 30 }, 
              ];         
            }

           
            restData.forEach(e => {
              worksheet.addRow({symbol: e.symbol, holding: e.holding , avg_price: e.avgPrice, current_price: e.currentPrice,  market_value: e.mktValue, currency : e.currencyCode ,day_pl : e.todayPL,  total_pl : e.totalPL, lpd : e.lastTradeDate    },"n");
            });
           
            workbook.xlsx.writeBuffer().then((data) => {
              let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              fs.saveAs(blob, 'PortfolioData.xlsx');
            })
    
          }
        }
        else{
          this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
          this.dialogCmp.statusMsg = this.errorMsg;
          this.dialogCmp.showAlartDialog('Error');
        }
      
  
      }, error => {
        this.splash.hide();
        if (error.message) {
          this.errorMessage = <any>error.message;
          this.dialogCmp.statusMsg = this.errorMessage
          this.dialogCmp.showAlartDialog('Error');
        }
        else {
          this.errorMessage = <any>error;
          this.dialogCmp.statusMsg = this.errorMessage
          this.dialogCmp.showAlartDialog('Error');
        }
  
      });
    }
    else{
      ////////////////////////////////////Virtual Export Excel File
      this.listingSvc.getVirtualPortfolioDetail(AppConstants.ALL_VAL, this.userIdSearch, transDate).subscribe((restData: any) => {
        this.splash.hide();
        if(AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)){
          if (AppUtility.isValidVariable(restData)) {
            restData.map(element => {
              element.todayPL = Number(element.todayPL);
              element.totalPL = Number(element.totalPL);
              element.avgPrice = Number(element.avgPrice);
              element.currentPrice = Number(element.currentPrice);
              element.mktValue = Number(element.mktValue);
              element.holding = Number(element.holding);
            })
    
            let workbook = new Workbook();
            let worksheet = workbook.addWorksheet('PortfolioData');
            if(this.lang === 'pt'){
              worksheet.columns = [
                { header: 'Nome', key: 'symbol', width: 32 },
                { header: 'Volume', key: 'holding', width:  20},
                { header: 'Preço médio', key: 'avg_price', width: 20 },
                { header: 'Preço atual', key: 'current_price', width: 20 },
                { header: 'Valor de mercado', key: 'market_value', width: 20 }, 
                { header: 'Moeda', key: 'currency', width: 20 }, 
                { header: 'Dia P/L', key: 'day_pl', width: 20 },
                { header: 'Total P/L', key: 'total_pl', width: 20 },
                { header: 'Data da última compra', key: 'lpd', width: 30 }, 
              ];
          
            }
            else{
              worksheet.columns = [
                { header: 'Name', key: 'symbol', width: 32 },
                { header: 'Volume', key: 'holding', width:  20},
                { header: 'Average Price', key: 'avg_price', width: 20 },
                { header: 'Current Price', key: 'current_price', width: 20 },
                { header: 'Market Value', key: 'market_value', width: 20 }, 
                { header: 'Currency', key: 'currency', width: 20 }, 
                { header: 'Day P/L', key: 'day_pl', width: 20 },
                { header: 'Total P/L', key: 'total_pl', width: 20 },
                { header: 'Last Purchase Date', key: 'lpd', width: 30 }, 
              ];
          
            }
           
            restData.forEach(e => {
              worksheet.addRow({symbol: e.symbol, holding: e.holding , avg_price: e.avgPrice, current_price: e.currentPrice,  market_value: e.mktValue, currency : e.currencyCode, day_pl : e.todayPL,  total_pl : e.totalPL, lpd : e.lastTradeDate    },"n");
            });
           
            workbook.xlsx.writeBuffer().then((data) => {
              let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              fs.saveAs(blob, 'PortfolioData.xlsx');
            })
            
          }
        }
        else{
          this.errorMsg = AppConstants.MSG_NO_DATA_FOUND;
          this.dialogCmp.statusMsg = this.errorMsg;
          this.dialogCmp.showAlartDialog('Error');
        }
  
      }, error => {
        this.splash.hide();
        if (error.message) {
          this.errorMessage = <any>error.message;
          this.dialogCmp.statusMsg = this.errorMessage
          this.dialogCmp.showAlartDialog('Error');
        }
        else {
          this.errorMessage = <any>error;
          this.dialogCmp.statusMsg = this.errorMessage
          this.dialogCmp.showAlartDialog('Error');
        }
  
      });
    }


















   
  }








  public mouseHovering(assetClass) {
    if (assetClass === 'equities') {
      this.showEquitiesTitle = true;
      this.showBondsTitle = false;
      this.showETFTitle = false;
    }
    else if (assetClass === 'bonds') {
      this.showEquitiesTitle = false;
      this.showBondsTitle = true;
      this.showETFTitle = false;
    }
    else if (assetClass === 'etf') {
      this.showEquitiesTitle = false;
      this.showBondsTitle = false;
      this.showETFTitle = true;
    }
  }


  public mouseLeft() {
    this.showEquitiesTitle = false;
    this.showBondsTitle = false;
    this.showETFTitle = false;
  }





  public showModalForOrder = (data, side, assetClass) => {
    if (AppUtility.isValidVariable(assetClass) && assetClass === AppConstants.ASSET_CLASS_EQUITIES) {
      if (AppUtility.isValidVariable(data) && AppUtility.isValidVariable(side)) {
        data.securityCode = data.symbol;
        data.marketCode = AppConstants.MARKET_CODE_MAINBOARD;
        data.exchangeCode = AppConstants.exchangeCode;
        this.newOrderAll.show(data, side, assetClass);
      }
    }

    if (AppUtility.isValidVariable(assetClass) && assetClass === AppConstants.ASSET_CLASS_BONDS) {
      if (AppUtility.isValidVariable(data) && AppUtility.isValidVariable(side)) {
        data.securityCode = data.symbol;
        data.marketCode = AppConstants.MARKET_CODE_DEBT;
        data.exchangeCode = AppConstants.exchangeCode;
        this.newOrderAll.show(data, side, assetClass);
      }
    }

    if (AppUtility.isValidVariable(assetClass) && assetClass === AppConstants.ASSET_CLASS_ETF) {
      if (AppUtility.isValidVariable(data) && AppUtility.isValidVariable(side)) {
        data.securityCode = data.symbol;
        data.marketCode = AppConstants.MARKET_CODE_ETF;
        data.exchangeCode = AppConstants.exchangeCode;
        this.newOrderAll.show(data, side, assetClass);
      }
    }



  }










  public getUserProfileStatus = () => {

    this.listingSvc.getClientIdByUserId(AppConstants.userId).subscribe((restData: any) => {
      if (AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)) {
        this.investorProfileStatus = restData[0].statusCode;
        this.clientIdSearch = restData[0].clientId;
        this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.clientIdSearch);
        this.getActualPortfolioSummary(this.clientIdSearch);
      }
      else {
        this.investorProfileStatus = "";
      }
    }, error => {

      console.log(error);
    })
  }






  // --------------------------------------------------------------------------------

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    if (this._pageSize != value) {
      this._pageSize = value;
      if (this.flex) {
        (<IPagedCollectionView><unknown>this.flex.collectionView).pageSize = value;
      }
    }
  }

  // --------------------------------------------------------------------------------






  getClientsList() {
    this.splash.show();
    this.fromClientList = [];

    this.listingSvc.getClientListByExchangeBroker(AppConstants.exchangeId, AppConstants.participantId, true, true)
      .subscribe(restData => {

        if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
          this.splash.hide();
          this.fromClientList = restData;
          this.clientIdSearch = this.fromClientList[0].clientId;
          this.getActualPortfolioSummary(this.clientIdSearch);
          this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.clientIdSearch);



        } else {
          this.fromClientList = [];
          this.splash.hide();
        }
      },
        error => { this.splash.hide(); this.errorMessage = <any>error });



  }

  getUsersList() {
    this.splash.show();
    this.fromUserList = [];

    this.listingSvc.getUsersByParticipant(this.participantId).subscribe(res => {
      if (AppUtility.isValidVariable(res) && !AppUtility.isEmpty(res)) {
        this.splash.hide();
        this.fromUserList = res;
        this.userIdSearch = this.fromUserList[0].userId;
        this.getVirtualPortfolioSummary(this.userIdSearch);
        this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.userIdSearch);
      } else {
        this.fromClientList = [];
        this.splash.hide();
      }

    },
      error => { this.splash.hide(); this.errorMessage = <any>error });

  }

  getPortfolioByUser() {
    this.userIdSearch = this.userId
    this.getVirtualPortfolioSummary(this.userId);
    this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.userId);
  }


  public onChangeSearchClient = (event) => {
    if (AppUtility.isValidVariable(event)) {
      this.clientIdSearch = event;
    }
  }

  public onChangeSearchUser = (event) => {
    if (AppUtility.isValidVariable(event)) {
      this.userIdSearch = event
    }
  }



  public onSearchAction = () => {
    if (AppUtility.isValidVariable(this.clientIdSearch)) {
      this.getActualPortfolioSummary(this.clientIdSearch);
      this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.clientIdSearch);
    }
  }

  public onSearchUserAction = () => {
    if (AppUtility.isValidVariable(this.userIdSearch)) {
      this.getVirtualPortfolioSummary(this.userIdSearch);
      this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.userIdSearch);
    }
  }






  public getActualPortfolioSummary = (clientId) => {
    this.splash.show();
    this.selectedTab = AppConstants.ASSET_CLASS_EQUITIES;
    this.equitiesPortfolioSum = new PortfolioDetail();
    this.bondsPortfolioSum = new PortfolioDetail();
    this.etfPortfolioSum = new PortfolioDetail();
    this.equityBarPercent = "";
    this.bondsBarPercent = "";
    this.etfBarPercent = "";

    this.summaryLocalInvestment = 0;
    this.summaryForeignInvestment = 0;
    this.summaryTotalInvestment = 0;
    this.summaryTotalVolume = 0;
    this.summaryCurrentValue = 0;
    this.summaryNetPL = 0;

    let totalVolume;
    let equityPercentage;
    let bondsPercentage;
    let etfPercentage;
    this.Wjdata = this.getData(0, 0, 0);

    this.listingSvc.getActualPortfolioSummary(clientId).subscribe((restData: any) => {
      this.splash.hide();
      if (AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)) {
        this.NoDataFound = false;
        restData.forEach(element => {
          if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
            this.equitiesPortfolioSum = element;
            if (AppUtility.isValidVariable(this.equitiesPortfolioSum)) {
              this.equitiesPortfolioSum.volume = Number(this.equitiesPortfolioSum.holding);
              this.equitiesPortfolioSum.totalInvestment = Number(this.equitiesPortfolioSum.totalInvestment)
              this.equitiesPortfolioSum.currentValue = Number(this.equitiesPortfolioSum.currentValue)
              this.equitiesPortfolioSum.netPL = Number(this.equitiesPortfolioSum.netPL)
              this.equitiesPortfolioSum.localInvestment = Number(this.equitiesPortfolioSum.localInvestment)
              this.equitiesPortfolioSum.foreignInvestment = Number(this.equitiesPortfolioSum.foreignInvestment)
            }
            else {
              this.equitiesPortfolioSum.volume = 0;
            }
          }



          else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_BONDS) {
            this.bondsPortfolioSum = element;
            if (AppUtility.isValidVariable(this.bondsPortfolioSum)) {
              this.bondsPortfolioSum.volume = Number(this.bondsPortfolioSum.holding);
              this.bondsPortfolioSum.totalInvestment = Number(this.bondsPortfolioSum.totalInvestment)
              this.bondsPortfolioSum.currentValue = Number(this.bondsPortfolioSum.currentValue)
              this.bondsPortfolioSum.netPL = Number(this.bondsPortfolioSum.netPL)
              this.bondsPortfolioSum.localInvestment = Number(this.bondsPortfolioSum.localInvestment)
              this.bondsPortfolioSum.foreignInvestment = Number(this.bondsPortfolioSum.foreignInvestment)
            }
            else {
              this.bondsPortfolioSum.volume = 0;
            }
          }
          else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
            this.etfPortfolioSum = element;
            if (AppUtility.isValidVariable(this.etfPortfolioSum)) {
              this.etfPortfolioSum.volume = Number(this.etfPortfolioSum.holding);
              this.etfPortfolioSum.totalInvestment = Number(this.etfPortfolioSum.totalInvestment)
              this.etfPortfolioSum.currentValue = Number(this.etfPortfolioSum.currentValue)
              this.etfPortfolioSum.netPL = Number(this.etfPortfolioSum.netPL)
              this.etfPortfolioSum.localInvestment = Number(this.etfPortfolioSum.localInvestment)
              this.etfPortfolioSum.foreignInvestment = Number(this.etfPortfolioSum.foreignInvestment)
            }
            else {
              this.etfPortfolioSum.volume = 0;
            }
          }
        })


        let equityValue = Math.abs(this.equitiesPortfolioSum.currentValue).toFixed(2);
        let bondsValue = Math.abs(this.bondsPortfolioSum.currentValue).toFixed(2);
        let etfValue = Math.abs(this.etfPortfolioSum.currentValue).toFixed(2);

        let equityVolume = Math.abs(this.equitiesPortfolioSum.volume);
        let bondsVolume = Math.abs(this.bondsPortfolioSum.volume);
        let etfVolume = Math.abs(this.etfPortfolioSum.volume);

        totalVolume = equityVolume + bondsVolume + etfVolume;
       
        if(totalVolume !== 0){
          equityPercentage = (((equityVolume) / totalVolume) * 100).toFixed(2);
          bondsPercentage = (((bondsVolume) / totalVolume) * 100).toFixed(2);
          etfPercentage = (((etfVolume) / totalVolume) * 100).toFixed(2);
        }
       

        if (equityPercentage === '0.00' && bondsPercentage === "0.00" && etfPercentage === "0.00") {
          this.NoDataFound = true;
        }
        else {
          this.equityBarPercent = String(equityPercentage) + "%";
          this.bondsBarPercent = String(bondsPercentage) + "%";
          this.etfBarPercent = String(etfPercentage) + "%";
        }
         
        this.summaryForeignInvestment = Number(this.equitiesPortfolioSum?.foreignInvestment ?? 0) + Number(this.bondsPortfolioSum?.foreignInvestment ?? 0) + Number(this.etfPortfolioSum?.foreignInvestment ?? 0);
        this.summaryLocalInvestment = Number(this.equitiesPortfolioSum?.localInvestment ?? 0) + Number(this.bondsPortfolioSum?.localInvestment ?? 0) + Number(this.etfPortfolioSum?.localInvestment ?? 0);
        this.summaryTotalInvestment = Number(this.equitiesPortfolioSum.totalInvestment) + Number(this.bondsPortfolioSum.totalInvestment) + Number(this.etfPortfolioSum.totalInvestment);
        this.summaryTotalVolume = Number(this.equitiesPortfolioSum.volume) + Number(this.bondsPortfolioSum.holding) + Number(this.etfPortfolioSum.holding);
        this.summaryCurrentValue = Number(this.equitiesPortfolioSum.currentValue) + Number(this.bondsPortfolioSum.currentValue) + Number(this.etfPortfolioSum.currentValue);
        this.summaryNetPL = Number(this.equitiesPortfolioSum.netPL) + Number(this.bondsPortfolioSum.netPL) + Number(this.etfPortfolioSum.netPL);
    
        this.Wjdata = this.getData(Number(equityValue), Number(bondsValue), Number(etfValue));

      }
      else {
        this.NoDataFound = true;
        this.Wjdata = this.getData(0, 0, 0);
      }

    }, error => {
      this.splash.hide();
      if (error.message) {
        this.errorMessage = <any>error.message;
      }
      else {
        this.errorMessage = <any>error;
      }

    });
  }




  public getActualPortfolioDetail = (assetId, clientId) => {
    this.splash.show();
    this.portfolioSummaryGridData = [];
    this.portfolioDetailDataSource.data = [];
    let totalVolume = 0;
    var date = new Date();
    let transDate = this.datePipe.transform(date, "yyyy-MM-dd");
    this.listingSvc.getActualPortfolioDetail(assetId, clientId, transDate).subscribe((restData: any) => {
      this.splash.hide();
      if (AppUtility.isValidVariable(restData)) {

        restData.map(element => {
          element.todayPL = Number(element.todayPL);
          element.totalPL = Number(element.totalPL);
          element.avgPrice = Number(element.avgPrice);
          element.currentPrice = Number(element.currentPrice);
          element.mktValue = Number(element.mktValue);
          element.holding = Number(element.holding);
          totalVolume = Math.abs(totalVolume) + Math.abs(Number(element.holding));

        })

        this.WjdataWeight = this.getDataWeight(restData);
        
        this.wjDataWeightBarChart = this.getDataWeightBarValue(restData);


      }


      this.portfolioSummaryGridData = restData;
      this.portfolioDetailDataSource.data = restData;


    }, error => {
      this.splash.hide();
      if (error.message) {
        this.errorMessage = <any>error.message;
      }
      else {
        this.errorMessage = <any>error;
      }

    });
  }

  
  public getVirtualPortfolioSummary = (userId) => {
    this.splash.show();
    this.selectedTab = AppConstants.ASSET_CLASS_EQUITIES;
    this.equitiesPortfolioSum = new PortfolioDetail();
    this.bondsPortfolioSum = new PortfolioDetail();
    this.etfPortfolioSum = new PortfolioDetail();
    this.equityBarPercent = "";
    this.bondsBarPercent = "";
    this.etfBarPercent = "";

    this.summaryLocalInvestment = 0;
    this.summaryForeignInvestment = 0;
    this.summaryTotalInvestment = 0;
    this.summaryTotalVolume = 0;
    this.summaryCurrentValue = 0;
    this.summaryNetPL = 0;

    let totalVolume;
    let equityPercentage;
    let bondsPercentage;
    let etfPercentage;
    this.Wjdata = this.getData(0, 0, 0);

    this.listingSvc.getVirtualPortfolioSummary(userId).subscribe((restData: any) => {
      
      this.splash.hide();
      if (AppUtility.isValidVariable(restData) && !AppUtility.isEmptyArray(restData)) {
        this.NoDataFound = false;
        restData.forEach(element => {
          if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_EQUITIES) {
            this.equitiesPortfolioSum = element;
            if (AppUtility.isValidVariable(this.equitiesPortfolioSum)) {
              this.equitiesPortfolioSum.volume = Number(this.equitiesPortfolioSum.holding);
              this.equitiesPortfolioSum.totalInvestment = Number(this.equitiesPortfolioSum.totalInvestment)
              this.equitiesPortfolioSum.currentValue = Number(this.equitiesPortfolioSum.currentValue)
              this.equitiesPortfolioSum.netPL = Number(this.equitiesPortfolioSum.netPL)
              this.equitiesPortfolioSum.localInvestment = Number(this.equitiesPortfolioSum.localInvestment)
              this.equitiesPortfolioSum.foreignInvestment = Number(this.equitiesPortfolioSum.foreignInvestment)
            }
            else {
              this.equitiesPortfolioSum.volume = 0;
            }
          }



          else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_BONDS) {
            this.bondsPortfolioSum = element;
            if (AppUtility.isValidVariable(this.bondsPortfolioSum)) {
              this.bondsPortfolioSum.volume = Number(this.bondsPortfolioSum.holding);
              this.bondsPortfolioSum.totalInvestment = Number(this.bondsPortfolioSum.totalInvestment)
              this.bondsPortfolioSum.currentValue = Number(this.bondsPortfolioSum.currentValue)
              this.bondsPortfolioSum.netPL = Number(this.bondsPortfolioSum.netPL)
              this.bondsPortfolioSum.localInvestment = Number(this.bondsPortfolioSum.localInvestment)
              this.bondsPortfolioSum.foreignInvestment = Number(this.bondsPortfolioSum.foreignInvestment)
            }
            else {
              this.bondsPortfolioSum.volume = 0;
            }
          }
          else if (element.assetClass.assetId === AppConstants.ASSET_CLASS_ID_ETFS) {
            this.etfPortfolioSum = element;
            if (AppUtility.isValidVariable(this.etfPortfolioSum)) {
              this.etfPortfolioSum.volume = Number(this.etfPortfolioSum.holding);
              this.etfPortfolioSum.totalInvestment = Number(this.etfPortfolioSum.totalInvestment)
              this.etfPortfolioSum.currentValue = Number(this.etfPortfolioSum.currentValue)
              this.etfPortfolioSum.netPL = Number(this.etfPortfolioSum.netPL)
              this.etfPortfolioSum.localInvestment = Number(this.etfPortfolioSum.localInvestment)
              this.etfPortfolioSum.foreignInvestment = Number(this.etfPortfolioSum.foreignInvestment)
            }
            else {
              this.etfPortfolioSum.volume = 0;
            }
          }
        })

        let equityValue = Math.abs(this.equitiesPortfolioSum.currentValue).toFixed(2);
        let bondsValue = Math.abs(this.bondsPortfolioSum.currentValue).toFixed(2);
        let etfValue = Math.abs(this.etfPortfolioSum.currentValue).toFixed(2);

        let equityVolume = Math.abs(this.equitiesPortfolioSum.volume);
        let bondsVolume = Math.abs(this.bondsPortfolioSum.volume);
        let etfVolume = Math.abs(this.etfPortfolioSum.volume);

        totalVolume = equityVolume + bondsVolume + etfVolume;
        if(totalVolume !== 0){
          equityPercentage = (((equityVolume) / totalVolume) * 100).toFixed(2);
          bondsPercentage = (((bondsVolume) / totalVolume) * 100).toFixed(2);
          etfPercentage = (((etfVolume) / totalVolume) * 100).toFixed(2);
        }
        else{
          equityPercentage = "0.00";
          bondsPercentage = "0.00";
          etfPercentage = "0.00";
        }
       

        if (equityPercentage === '0.00' && bondsPercentage === "0.00" && etfPercentage === "0.00") {
          this.NoDataFound = true;
        }
        else {
          this.equityBarPercent = String(equityPercentage) + "%";
          this.bondsBarPercent = String(bondsPercentage) + "%";
          this.etfBarPercent = String(etfPercentage) + "%";
        }


        this.summaryForeignInvestment = Number(this.equitiesPortfolioSum.foreignInvestment) + Number(this.bondsPortfolioSum.foreignInvestment) + Number(this.etfPortfolioSum.foreignInvestment);
        this.summaryLocalInvestment = Number(this.equitiesPortfolioSum.localInvestment) + Number(this.bondsPortfolioSum.localInvestment) + Number(this.etfPortfolioSum.localInvestment);
        this.summaryTotalInvestment = Number(this.equitiesPortfolioSum.totalInvestment) + Number(this.bondsPortfolioSum.totalInvestment) + Number(this.etfPortfolioSum.totalInvestment);
        this.summaryTotalVolume = Number(this.equitiesPortfolioSum.volume) + Number(this.bondsPortfolioSum.holding) + Number(this.etfPortfolioSum.holding);
        this.summaryCurrentValue = Number(this.equitiesPortfolioSum.currentValue) + Number(this.bondsPortfolioSum.currentValue) + Number(this.etfPortfolioSum.currentValue);
        this.summaryNetPL = Number(this.equitiesPortfolioSum.netPL) + Number(this.bondsPortfolioSum.netPL) + Number(this.etfPortfolioSum.netPL);
      
        this.Wjdata = this.getData(Number(equityValue), Number(bondsValue), Number(etfValue));

      }
      else {
        this.NoDataFound = true;
        this.Wjdata = this.getData(0, 0, 0);
      }

    }, error => {
      this.splash.hide();
      if (error.message) {
        this.errorMessage = <any>error.message;
      }
      else {
        this.errorMessage = <any>error;
      }

    });
  }

  public getVirtualPortfolioDetail = (assetId, userId) => {
    this.splash.show();
    this.portfolioSummaryGridData = [];
    this.portfolioDetailDataSource.data = [];
    let totalVolume = 0;
    var date = new Date();
    let transDate = this.datePipe.transform(date, "yyyy-MM-dd");
    this.listingSvc.getVirtualPortfolioDetail(assetId, userId, transDate).subscribe((restData: any) => {
      this.splash.hide();
      if (AppUtility.isValidVariable(restData)) {

        restData.map(element => {
          element.todayPL = Number(element.todayPL);
          element.totalPL = Number(element.totalPL);
          element.avgPrice = Number(element.avgPrice);
          element.currentPrice = Number(element.currentPrice);
          element.mktValue = Number(element.mktValue);
          element.holding = Number(element.holding);
          totalVolume = Math.abs(totalVolume) + Math.abs(Number(element.holding));

        })

        this.WjdataWeight = this.getDataWeight(restData);
        this.wjDataWeightBarChart = this.getDataWeightBarValue(restData);


      }


      this.portfolioSummaryGridData = restData;
      this.portfolioDetailDataSource.data = restData;


    }, error => {
      this.splash.hide();
      if (error.message) {
        this.errorMessage = <any>error.message;
      }
      else {
        this.errorMessage = <any>error;
      }

    });
  }



public onChangeInvestmentChart = (event) => {
     if(AppUtility.isValidVariable(event)){
       this.investmentValue = event;
       this.wjDataWeightBarChart = this.getDataWeightBarValue(this.portfolioSummaryGridData);
     }
}





  public onChangeTab = (tabName: string) => {
    if (this.tradeType === AppConstants.ACTUAL_TRADE_TYPE) {
      if (tabName === AppConstants.ASSET_CLASS_EQUITIES) {
        this.selectedTab = AppConstants.ASSET_CLASS_EQUITIES;
        this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.clientIdSearch);
      }
      else if (tabName === AppConstants.ASSET_CLASS_BONDS) {
        this.selectedTab = AppConstants.ASSET_CLASS_BONDS;
        this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_BONDS, this.clientIdSearch);
      }
      else if (tabName === AppConstants.ASSET_CLASS_ETF) {
        this.selectedTab = AppConstants.ASSET_CLASS_ETF;
        this.getActualPortfolioDetail(AppConstants.ASSET_CLASS_ID_ETFS, this.clientIdSearch);
      }
    }

    if (this.tradeType === AppConstants.VIRTUAL_TRADE_TYPE) {
      if (tabName === AppConstants.ASSET_CLASS_EQUITIES) {
        this.selectedTab = AppConstants.ASSET_CLASS_EQUITIES;
        this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_EQUITIES, this.userId);
      }
      else if (tabName === AppConstants.ASSET_CLASS_BONDS) {
        this.selectedTab = AppConstants.ASSET_CLASS_BONDS;
        this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_BONDS, this.userId);
      }
      else if (tabName === AppConstants.ASSET_CLASS_ETF) {
        this.selectedTab = AppConstants.ASSET_CLASS_ETF;
        this.getVirtualPortfolioDetail(AppConstants.ASSET_CLASS_ID_ETFS, this.userId);
      }
    }

  }





  getData(equityVol, BondsVol, etfVol) {

    let graphArr = [];
    this.palleteColors = ['l(0,0,0,1)#25D325-#5fe85f',  'l(0,0,0,1)#D6B800-#ffb300' , 'l(0,0,1,0)#3DA7FF-#63a6ff' ];

    if(equityVol === 0 && BondsVol === 0 && etfVol === 0){
      graphArr = [];
    }

    if(equityVol !== 0 && BondsVol !== 0 && etfVol !== 0){
      graphArr = [
        { "type": this.equitiesTranslate, "trade": equityVol },
        { "type": this.bondsTranslate, "trade": BondsVol },
        { "type": "ETFs", "trade": etfVol }
      ]
      this.palleteColors = ['l(0,0,0,1)#25D325-#5fe85f',  'l(0,0,0,1)#D6B800-#ffb300' , 'l(0,0,1,0)#3DA7FF-#63a6ff' ];
    }


    if (equityVol === 0  && BondsVol !== 0 && etfVol !== 0) {
      graphArr = [
        { "type": this.bondsTranslate, "trade": BondsVol },
        { "type": "ETFs", "trade": etfVol }
      ]
      this.palleteColors = ['l(0,0,0,1)#D6B800-#ffb300' , 'l(0,0,1,0)#3DA7FF-#63a6ff' ];
    }
    else if (BondsVol === 0 && equityVol !== 0 && etfVol !== 0) {
      graphArr = [
        { "type": this.equitiesTranslate, "trade": equityVol },
        { "type": "ETFs", "trade": etfVol }
      ]
      this.palleteColors = ['l(0,0,0,1)#25D325-#5fe85f', 'l(0,0,1,0)#3DA7FF-#63a6ff' ];
    }
    else if (etfVol === 0 && BondsVol !== 0 && equityVol !== 0) {
      graphArr = [
        { "type": this.equitiesTranslate, "trade": equityVol },
        { "type": this.bondsTranslate, "trade": BondsVol },
      ]
      this.palleteColors = ['l(0,0,0,1)#25D325-#5fe85f',  'l(0,0,0,1)#D6B800-#ffb300'];
    }
    else if (etfVol === 0 && BondsVol == 0 && equityVol !== 0) {
      graphArr = [
        { "type": this.equitiesTranslate, "trade": equityVol },
      ]
      this.palleteColors = ['l(0,0,0,1)#25D325-#5fe85f'];
    }
    else if (etfVol === 0 && BondsVol !== 0 && equityVol === 0) {
      graphArr = [
        { "type": this.bondsTranslate, "trade": BondsVol },
      ]
      this.palleteColors = ['l(0,0,0,1)#D6B800-#ffb300'];
    }
    else if (etfVol !== 0 && BondsVol == 0 && equityVol !== 0) {
      graphArr = [
        { "type": "ETFs", "trade": etfVol }
      ]
      this.palleteColors = ['l(0,0,1,0)#3DA7FF-#63a6ff' ];
    }

    return graphArr;
  }




  getDataWeight(data) {
    let graphArr = [];
    data.forEach((element: any) => {
      graphArr.push({ "type": element.symbol, "trade": element.holding });
   
    })

    return graphArr;

  }



  getDataWeightBarValue(data) {
    let graphArrBar = [];
    data.forEach((element: any) => {
      
      if(this.investmentValue === "LI" && element.foreignSec === '0'){
        graphArrBar.push({ "type": element.symbol, "trade": element.mktValue });
      }
     
      if(this.investmentValue === "FI" && element.foreignSec === '1'){
        graphArrBar.push({ "type": element.symbol, "trade": element.mktValue });
      }
    })

    return graphArrBar;

  }




  getLabelContent = (ht: chart.HitTestInfo) => {
    return wijmo.format('{name} {val}', { val: ht.value });
  }

  getLabelContentWeight = (ht: chart.HitTestInfo) => {
    return wijmo.format('{name} {val}', { val: ht.value });
  }




  public getNotification(btnClicked) {

  }







}