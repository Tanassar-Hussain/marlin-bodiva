import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';



import { TranslateService } from '@ngx-translate/core';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { Exchange } from 'app/models/exchange';
import { Market } from 'app/models/market';
import { Params, ReportParams } from 'app/models/report-params';
import { ListingService } from 'app/services/listing.service';
import { ReportService } from 'app/services/report.service';
import { DialogCmp } from '../../../user-site/dialog/dialog.component';
import { Migrator } from 'app/models/migrator';
import { ComboItem } from 'app/models/combo-item';
import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { DatePipe } from '@angular/common';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

declare var jQuery: any;
var downloadAPI = require('../../../../../../scripts/download-document');
@Component({

  selector: 'repo-trade',
  templateUrl: './repo-trade.html',
  encapsulation: ViewEncapsulation.None,

})

export class RepoTrade implements OnInit {

    scaleMode = gridPdf.ScaleMode.PageWidth;
    orientation = pdf.PdfPageOrientation.Landscape;
    exportMode = gridPdf.ExportMode.All;
    includeColumnHeader: boolean = true;


    dateTimeFormat: string = AppConstants.DATE_TIME_FORMAT;
    utcLocaleHours: string = AppConstants.UTC_LOCALE_HOURS;

    filterColumns = ['exchange', 'market', 'symbol', 'order_no', 'username', 'custodian', 'account', 'price', 'volume',
    'type_', 'qualifier', 'state_time', 'discQuantity', 'triggerPrice', 'tifOption', 'gtd'];


  public myForm: FormGroup;
  public searchForm: FormGroup;

  //claims: any;

  reportParams: ReportParams;
  params: Params;
  email: boolean = false;

  dateFormat: string = AppConstants.DATE_FORMAT;
  dateMask: string = AppConstants.DATE_MASK;

  exchangeList: any[] = [];
  marketList: any[] = [];
  assetClassList: any[] = [];
  clientCustodianList: any[] = [];
  toClientList: any[] = [];
  fromClientList: any[] = [];
  securityList: any[] = [];
  entryTypeList: any[] = [];

  entryType: string = null;

  custodianExist: boolean = false;
  custodianId: Number = null;

  isItemsListStatusNew: boolean = false;

  itemsList: wjcCore.CollectionView;
  data: any;

  exchangeId: number = 0;
  errorMessage: string;

  public isSubmitted: boolean;
  public isValidStartDate: boolean;

  private _pageSize = 0;
  lang: any
  pdfSrc: String
  pdf = false
  fileNameForDownload = "RepoTradeReport.pdf"
  public recExist: boolean;
  participantExchangeId: any
  itemsListPDF : any[] = [];

  @ViewChild('flexGrid') flexGrid: wjcGrid.FlexGrid;
  @ViewChild('inputEntryType') inputEntryType: wjcInput.ComboBox;
  @ViewChild('inputSecurity') inputSecurity: wjcInput.ComboBox;
  @ViewChild('inputClient') inputClient: wjcInput.ComboBox;
  @ViewChild('dialogCmp') dialogCmp: DialogCmp;
  @ViewChild('GridFrom', { static: false }) GridFrom: wjcGrid.FlexGrid;
  @ViewChild('GridTo', { static: false }) GridTo: wjcGrid.FlexGrid;
    clientList: any;
    logoBase64: string = "";
    contentType: string = "";
  repoTradeData: any[] = [];


  constructor(private reportService: ReportService, private listingService: ListingService,
    private _fb: FormBuilder, private _fb2: FormBuilder, public datePipe : DatePipe,
    private appState: AppState, private translate: TranslateService, private loader: FuseLoaderScreenService) {

    this.initForm();
    this.isSubmitted = false;
    this.isValidStartDate = true;
    //this.claims = authService.claims;


    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    if (this.lang == 'pt') {
      AppConstants.PLEASE_SELECT_STR = "Selecione";
    }
    //______________________________for ngxtranslate__________________________________________
    this.participantExchangeId = AppConstants.claims2.participant.exchangeId
  }
  ngOnInit() {
    // Add Form Validations
    this.addFromValidations();
    this.getClientsList(this.participantExchangeId);
    this.symbolList();
    this.getPaticipantsLogo();
  }
  ngAfterViewInit() {

  }

  /*********************************
 *      Public & Action Methods
 *********************************/
  initForm() {

    this.reportParams = new ReportParams();
    this.params = new Params();
    this.params.START_DATE = new Date();
    this.params.END_DATE = new Date();
    this.toClientList = [];
    this.fromClientList = [];
    this.clearFields();
  }
  public clearFields() {
    if (AppUtility.isValidVariable(this.myForm)) {
      this.myForm.markAsPristine();
    }
    if (AppUtility.isValidVariable(this.searchForm)) {
      this.searchForm.markAsPristine();
    }

    this.toClientList = [];
    this.fromClientList = [];
    this.email = false;
    this.isSubmitted = false;

  }

  get pageSize(): number {
    return this._pageSize;
  }
  set pageSize(value: number) {
    if (this._pageSize != value) {
      this._pageSize = value;
      if (this.flexGrid) {
        (<wjcCore.IPagedCollectionView>this.flexGrid.collectionView).pageSize = value;
      }
    }
  }











  getClientsList(exchangeId) {
    this.listingService.getClientListByExchangeBrokerShort(exchangeId, AppConstants.participantId, true, true)
        .subscribe(restData => {
            if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
                this.clientList = restData;
                if (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
                  let x = { "displayValue_": AppConstants.ALL_STR, "clientCode": AppConstants.ALL_VAL };
                  this.clientList.unshift(x);
                }
              
                this.params.FROM_ACCOUNT = this.clientList[0].clientCode;
            } else {
                this.clientList = [];
                if (AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_CODE || AppConstants.userType === AppConstants.USER_TYPE_PARTICIPANT_ADMIN_CODE) {
                  let x = { "displayValue_": AppConstants.ALL_STR, "clientCode": AppConstants.ALL_VAL };
                  this.clientList.unshift(x);
                }
                this.params.FROM_ACCOUNT = this.clientList[0].clientCode;
            }
        },
            error => {
                this.errorMessage = <any>error.message
                

            });
}


  getExchangeBrokerFromClients(exchangeId) {
    this.fromClientList = [];
    if (AppUtility.isValidVariable(exchangeId)) {
      this.loader.show();
      this.appState.showLoader = true;
      this.listingService.getClientBasicInfoListByExchangeBroker(exchangeId, AppConstants.participantId, false, true)
        .subscribe(restData => {
          this.loader.hide();
          this.appState.showLoader = false;
          if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
            this.fromClientList = restData;
          }
        },
          error => {
            this.loader.hide();
            this.appState.showLoader = false;
            this.errorMessage = <any>error
          });
    }
  }





  symbolList() {
    if (AppUtility.isValidVariable(AppConstants.participantId))

        this.listingService.getParticipantSecurityExchanges(AppConstants.participantId)
            .subscribe(restData => {
                if (AppUtility.isValidVariable(restData)) {
                    this.updateSymbolList(restData);
                }
            },
                error => {
                    this.errorMessage = <any>error.message
                });
}

updateSymbolList(data) {
    let symbolList: any[] = [];
    let cmbItem: ComboItem;
    let repoIndex: number = 0;

    if (AppUtility.isValidVariable(data) && !AppUtility.isEmpty(data)) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].marketCode.toUpperCase() === AppConstants.MARKET_TYPE_REPO_) {
                symbolList[repoIndex] = data[i];
                symbolList[repoIndex].value = data[i].displayName_;
                repoIndex++;
            }
        }

        cmbItem = new ComboItem(AppConstants.ALL_STR, '-1');
        symbolList.unshift(cmbItem);
        this.params.SECURITY_CODE = '';

    }
    this.securityList = symbolList;
}



 

public getPaticipantsLogo = () => {
    this.listingService.getParticipantLogo(AppConstants.participantId).subscribe((res: any) => {

        if (AppUtility.isValidVariable(res)) {
            this.logoBase64 = res.logoBase64;
            this.contentType = res.contentType;
        }

    }, error => {
        if (error.message) {
            this.errorMessage = error.message;
        }
        else {
            this.errorMessage = error;
        }
    })
}





  public getData(isValid: boolean) {
     
    this.isSubmitted = true;
    var securityCode = "";
    AppUtility.printConsole("onSave Action, isValid: " + isValid);
    //AppUtility.printConsole("Stock deposit:"+JSON.stringify(this.selectedItem));
  
    if(isValid){
      this.loader.show();
      if(!AppUtility.isNullOrEmpty(this.params.SECURITY_CODE) && this.params.SECURITY_CODE !== "-1"){
        let data = AppUtility.isSplitSymbolMarketExchange(this.params.SECURITY_CODE);
        securityCode = data[0];
      }else{
        securityCode = this.params.SECURITY_CODE;
      }
    
      let startDate = this.datePipe.transform(this.params.START_DATE , 'yyyy-MM-dd');
      let endDate = this.datePipe.transform(this.params.END_DATE , 'yyyy-MM-dd');
      this.listingService.getRepoTradeReport(startDate, endDate , AppConstants.participantId, this.params.FROM_ACCOUNT, securityCode).subscribe((res : any)=>{
        this.loader.hide();
        if(AppUtility.isEmptyArray(res)){
          this.repoTradeData = [];
          this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
          this.dialogCmp.showAlartDialog('Error');
        }else{
          res.forEach(element => {
            if(element.buySell === 'Buy'){
              element.side = 'buy';
            }else if(element.buySell === 'Sell'){
              element.side = 'sell';
            }
 

          })
           this.repoTradeData = res;
        }
      } , (error : any) => {
        this.loader.hide();
        if(error.message){
          this.errorMessage = error.message;
        }else{
          this.errorMessage = error;
        }
        this.repoTradeData = [];
        this.dialogCmp.statusMsg = this.errorMessage;
        this.dialogCmp.showAlartDialog('Error'); 
      })
    }
   
    }



 
 


  UpdateRecords(oExport_: Migrator, fileName_: String) {
    AppUtility.printConsole('in UpdateRecords');
    // this.dialogCmp.statusMsg = oExport_.serverResponse;
    // this.dialogCmp.showAlartDialog('Notification');
    this.onDownloadDocumentAction(oExport_.responseFileBase64, fileName_);
  }


  public onDownloadDocumentAction(filecontent_: string, fileName_: String) {
    AppUtility.printConsole('file: ' + filecontent_);
    let base64Data = filecontent_;
    let contentType = 'application/vnd.text';
    let fileName = fileName_ + '.csv';
    downloadAPI(base64Data, fileName, contentType);
  }



  public onSearch() {
    this.itemsList = new wjcCore.CollectionView();
    this.recExist = false;
    this.GridFrom.refresh();
    this.GridTo.refresh();
  }

  public updateControlsFrom() {
    this.params.FROM_ACCOUNT = this.GridFrom.collectionView.currentItem.clientCode;
    this.itemsList = new wjcCore.CollectionView();
    this.recExist = false;
    this.GridFrom.refresh();
  }

  public updateControlsTo() {
    this.params.TO_ACCOUNT = this.GridTo.collectionView.currentItem.clientCode;
    this.itemsList = new wjcCore.CollectionView();
    this.recExist = false;
    this.GridTo.refresh();
  }

  public clearControls() {
    this.itemsList = new wjcCore.CollectionView();
    this.GridFrom.refresh();
    this.GridTo.refresh();
    this.recExist = false;
  }

 


  exportExcel() {
    let fileName = "";
    if(this.lang === 'pt'){ }
    wjcGridXlsx.FlexGridXlsxConverter.save(this.flexGrid, { includeColumnHeaders: this.includeColumnHeader, includeCellStyles: false }, 'RepoTradeReport.xlsx');
}




exportPDF() {
    gridPdf.FlexGridPdfConverter.export(this.flexGrid, 'RepoTradeReport' + new Date().toLocaleString() + '.pdf', {
        maxPages: 5000,
        exportMode: this.exportMode,
        scaleMode: this.scaleMode,
        documentOptions: {
            pageSettings: {
                layout: this.orientation
            },
            header: {
                declarative: {
                    text: '\t&[Page]\\&[Pages]'
                }
            },
            footer: {
                declarative: {
                    text: '\t&[Page]\\&[Pages]'
                }
            }
        },
        styles: {
            cellStyle: {
                backgroundColor: '#ffffff',
                borderColor: '#c6c6c6'
            },
            altCellStyle: {
                backgroundColor: '#f9f9f9'
            },
            groupCellStyle: {
                backgroundColor: '#dddddd'
            },
            headerCellStyle: {
                backgroundColor: '#eaeaea'
            }
        }
    });
}


generatePDF() {
    const docDefinition = {
        pageOrientation: 'landscape',
        footer: function (currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; },
        content: [
            {
                image: 'data:' + this.contentType + ';base64,' + this.logoBase64,
                width: 60,
                alignment: 'left'
            },
            { text: 'Repo Trade Report', style: 'header', alignment: 'center' },
            {
                text: `Date: ${new Date().toLocaleString()}`,
                alignment: 'right',
                fontSize: 10,
                margin: [0, 0, 0, 20]
            },


            {
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', "auto", 'auto', 'auto', 'auto', 'auto', "auto", 'auto','auto', 'auto', 'auto', 'auto'],

                    body: [
                        [{ text: 'Trade No.', style: 'tableHeader' }, { text: 'Collateral', style: 'tableHeader' }, { text: 'QTY', style: 'tableHeader' }, { text: 'Clean Price', style: 'tableHeader' }, { text: 'Repurchase Price', style: 'tableHeader' }, { text: 'Dirty Price', style: 'tableHeader' }, { text: 'Nominal Value', style: 'tableHeader' }, { text: 'Market Value', style: 'tableHeader' }, { text: 'Repo Type', style: 'tableHeader' }, { text: 'Haircut', style: 'tableHeader' }, { text: 'Purchase Price', style: 'tableHeader' }, { text: 'Initial Date', style: 'tableHeader' }, { text: 'Termination Date', style: 'tableHeader' }, { text: 'Repo Rate', style: 'tableHeader' } ,{ text: 'Participant', style: 'tableHeader' }, { text: 'Account', style: 'tableHeader' }, { text: 'Counter Participant', style: 'tableHeader' },{ text: 'Counter Account', style: 'tableHeader' }, { text: 'Status', style: 'tableHeader' }],
                        ...this.repoTradeData.map(p => [{ text: p.ticketNo, style: 'tableText' }, { text: p.symbol, style: 'tableText' }, { text: p.volume, style: 'tableText' }, { text: p.price, style: 'tableText' }, { text: p.repurchasePrice, style: 'tableText' }, { text: p.dirtyPrice, style: 'tableText' }, { text: p.nominalValue, style: 'tableText' }, { text: p.marketValue, style: 'tableText' }, { text: p.repoType, style: 'tableText' }, { text: p.haircut, style: 'tableText' }, { text: p.settlementAmount, style: 'tableText' }, { text: p.contractInitialDate, style: 'tableText' }, { text: p.contractterminationDate, style: 'tableText' }, { text: p.repoRate, style: 'tableText' },{ text: p.actualBrokerCode, style: 'tableText' },{ text: p.actualClientCode, style: 'tableText' }, { text: p.actualCounterBrokerCode, style: 'tableText' },{ text: p.actualCounterClientCode, style: 'tableText' },{ text: p.negotiatedStatusDesc, style: 'tableText' }])
                    ],

                },
                margin: [0, 20, 0, 10]
            },
        ],
        styles: {
            header: { fontSize: 16, bold: true, marginBottom: 5, marginTop: -40, alignment: 'center' },
            tableHeader: { bold: true, fontSize: 7 },
            tableText: { fontSize: 6 },

        },
    };

    pdfMake.createPdf(docDefinition).download('Repo Trade Report.pdf');

}





  public getNotification(btnClicked) {
  }

  private addFromValidations() {
    this.myForm = this._fb.group({
      
       
        account: ['', Validators.compose([Validators.required])],
      fromDate: ['', Validators.compose([Validators.required])],
      toDate: ['', Validators.compose([Validators.required])],
      symbol: ['', Validators.compose([Validators.required])],
       
    });
  }
}
