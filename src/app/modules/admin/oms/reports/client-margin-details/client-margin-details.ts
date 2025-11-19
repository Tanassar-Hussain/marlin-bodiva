import { Component, ViewEncapsulation, ViewChild, Injector } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import * as wjcGrid from '@grapecity/wijmo.grid';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcInput from '@grapecity/wijmo.input';
import { TranslateService } from '@ngx-translate/core';
import { DialogCmpReports } from '../dialog-cmp-reports';
import { AppState } from 'app/app.service';
import { AppConstants, AppUtility } from 'app/app.utility';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { OrderService } from 'app/services-oms/order-oms.service';
import { AuthService } from 'app/services-oms/auth-oms.service';
import { Exchange } from 'app/models/exchange';
import { Custodian } from 'app/models/custodian';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import * as wjcGridXlsx from '@grapecity/wijmo.grid.xlsx';
import * as pdf from '@grapecity/wijmo.pdf';
import * as gridPdf from '@grapecity/wijmo.grid.pdf';

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { DatePipe } from '@angular/common';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

declare var jQuery: any;

@Component({
  selector: '[client-margin-details]',
  templateUrl: './client-margin-details.html',
  encapsulation: ViewEncapsulation.None,
})

export class ClientMarginDetails {

  includeColumnHeader: boolean = true;
  scaleMode = gridPdf.ScaleMode.ActualSize;
  orientation = pdf.PdfPageOrientation.Landscape;
  exportMode = gridPdf.ExportMode.All;


  public pdfFields = [
    { label: 'Client Code :', value: '' },
    { label: 'Cash :', value: '' },
    { label: 'Margin % :', value: '' },
    { label: 'Buying Power :', value: '' },
    { label: 'Open Position :', value: '' },
    { label: 'Remaining Buying Power :', value: '' },
  ];


  public myForm: FormGroup;
  isSubmitted: boolean = false;
  exchanges: any[];
  custodians: any[];
  exchange: string = '';
  exchangeId: number = -1;
  participantCode: string = '';
  participantId = 0;
  errorMessage: string = '';
  clientCode1: string = '';
  clientCode2: string = '';
  cash: number = 0;
  margin: number = 0;
  buyingPower: number = 0;
  openPosition: number = 0;
  remainingBuyingPower: number = 0;
  depositWorth : boolean;
  active: boolean = false;
  allowShortSell: boolean = false;
  riskAssessment: boolean = false;
  useOpenPosition: boolean = false;
  cmddata: any[] = [];
  holding: any[] = [];
  lang: any

  fromClientList: any[] = [];
  claims: any;
  isCustodian: boolean;

  @ViewChild('flexGrid', { static: false }) flexGrid: wjcGrid.FlexGrid;
  @ViewChild('cmbExchange', { static: false }) cmbExchange: wjcInput.ComboBox;
  @ViewChild('cmbCustodian', { static: false }) cmbCustodian: wjcInput.ComboBox;
  @ViewChild('dialogCmp', { static: false }) dialogCmp: DialogCmpReports;
  holdingDataPDF: any[] = [];

  constructor(private appState: AppState, private listingService: ListingService,
    private _fb: FormBuilder, private orderService: OrderService, private authService: AuthService, private translate: TranslateService,
    public splash: FuseLoaderScreenService, public datePipe: DatePipe) {
    this.isSubmitted = false;
    this.claims = authService.claims;
    this.participantCode = AppConstants.participantCode;
    //_______________________________for ngx_translate_________________________________________

    this.lang = localStorage.getItem("lang");
    if (this.lang == null) { this.lang = 'en' }
    this.translate.use(this.lang)
    //______________________________for ngx_translate__________________________________________


    this.isCustodian = AppConstants.CUSTODIAN_MODEL;

  }

  ngOnInit() {
    this.addFromValidations();
    this.loadExchanges();
  }

  onExchangeChange(value): void {
    this.exchangeId = value;
    this.custodians = <any>[];
    if (value != -1) {
      this.loadCustodian(value);
      this.getClientsList(value);
    }
  }

  onCustodianChange(value): void {
    this.participantId = value;
  }

  loadExchanges() {

    this.splash.show();
    this.listingService.getExchangeList()
      .subscribe(restData => {
        if (AppUtility.isValidVariable(restData)) {
          this.exchanges = restData;
          let exchange: Exchange = new Exchange(-1, AppConstants.PLEASE_SELECT_STR);
          this.exchanges.unshift(exchange);
          this.exchangeId = (AppConstants.exchangeId === null) ? this.exchanges[0].exchangeId : AppConstants.exchangeId;
        }
      },
        error => {
          this.splash.hide();
          this.errorMessage = <any>error
        });
  }

  loadCustodian(exchangeId: number) {
    this.splash.show();
    this.listingService.getCustodianByExchange(exchangeId)
      .subscribe(resData => {
        this.splash.hide();
        if (AppUtility.isValidVariable(resData)) {
          this.custodians = resData;
          let cust: Custodian = new Custodian(0, AppConstants.PLEASE_SELECT_STR);
          this.custodians.unshift(cust);
          this.participantId = this.custodians[0].participantId;
        }
      },
        error => {
          this.splash.hide();
          this.errorMessage = <any>error
        });
  }

  onSubmit(model: any, isValid: boolean) {
    this.isSubmitted = true;
    if (isValid) {
      if (this.participantCode != null && this.participantCode !== AppConstants.PLEASE_SELECT_STR)
        this.getClientMarginDetails(this.participantCode, this.cmbExchange.text, this.clientCode1, AppConstants.username);
      else
        this.getClientMarginDetails(AppConstants.loggedinBrokerCode, this.cmbExchange.text, this.clientCode1, AppConstants.username);
    }
  }

  getClientMarginDetails(lBC: string, eC: string, cC: string, user: string) {
    this.splash.show();
    this.clearFields();
    this.orderService.getClientMarginDetails(lBC, eC, cC, user).
      subscribe(resdata => {
        this.splash.hide();
        if (!AppUtility.isEmptyArray(resdata)) {
          let tempData: any = resdata;
          if (tempData.holding != null)
            this.holdingDataPDF = tempData.holding;
          this.formatHoldingData(tempData.holding);
          this.clientCode2 = tempData.code;
          this.cash = Number(tempData.cash);
          this.margin = Number(tempData.margin);
          this.buyingPower = Number(tempData.buying_power);

          this.openPosition = Number(tempData.open_position);
          if (this.openPosition < 1 && this.openPosition > -1) { //If open position is less than 1 and greather than -1, It should be 0 ... By Usama Attique with the coordination of Sir Hassan.
            this.openPosition = 0
          }
          this.remainingBuyingPower = Number(tempData.remaining_buying_power);
          this.depositWorth = tempData.depositWorth;

          this.pdfFields = [
            { label: 'Client Code :', value: tempData.code },
            { label: 'Cash :', value: tempData.cash },
            { label: 'Margin % :', value: tempData.margin },
            { label: 'Buying Power :', value: tempData.buying_power },
            { label: 'Open Position :', value: tempData.open_position },
            { label: 'Remaining Buying Power :', value: tempData.remaining_buying_power },
          ];

          this.active = tempData.active;
          this.allowShortSell = tempData.allow_short_sell;
          this.riskAssessment = !tempData.risk_assessment;  //  because backend sends the inverse value of this param @ 14/Apr/2017 - AiK
          this.useOpenPosition = tempData.use_open_position;
        }
        else {
          this.dialogCmp.statusMsg = AppConstants.MSG_NO_DATA_FOUND;
          this.dialogCmp.showAlartDialog('Error');
        }
      },
        error => {

          this.splash.hide();
          if (error.status === 404) {
            this.dialogCmp.statusMsg = 'Data not found.'; //  Defect id: 1177 @ 01/Aug/2017 - AiK
            if (this.lang == 'pt') {
              this.dialogCmp.statusMsg = 'Dados não encontrados.'; //  Defect id: 1177 @ 01/Aug/2017 - AiK
            }
          }
          else if (error.status === 406) {
            this.dialogCmp.statusMsg = 'Current user has no persmissions for the requested client.';
            if (this.lang == 'pt') {
              this.dialogCmp.statusMsg = 'O usuário atual não tem permissões para o cliente solicitado.'; //  Defect id: 1177 @ 01/Aug/2017 - AiK
            }
          }
          else
            this.dialogCmp.statusMsg = error.statusText;
          this.dialogCmp.showAlartDialog('Error');
        }
      );
  }

  private clearFields() {
    this.clientCode2 = '';
    this.cash = 0;
    this.margin = 0;
    this.buyingPower = 0;
    this.openPosition = 0;
    this.remainingBuyingPower = 0;
    this.depositWorth = false;
    this.cmddata = [];
    this.active = false;
    this.allowShortSell = false;
    this.riskAssessment = false;
    this.useOpenPosition = false;
  }

  private addFromValidations() {
    this.myForm = this._fb.group({
      exchange: ['', Validators.compose([Validators.required, Validators.pattern(AppConstants.validatePatternNumeric)])],
      custodian: [''],
      clientCode1: ['', Validators.compose([Validators.required])],
    });
  }

  private formatHoldingData(holdingData) {
    if (AppUtility.isValidVariable(holdingData)) {
      for (let i = 0; i < holdingData.length; i++) {
        holdingData[i].market_rate = Number(holdingData[i].market_rate);
        holdingData[i].market_value = Number(holdingData[i].market_value);
        holdingData[i].haircut = Number(holdingData[i].haircut);
        holdingData[i].assess_value = Number(holdingData[i].assess_value);
      }
      this.cmddata = holdingData;
    }

  }

  public hideModal() {
    jQuery('#add_new').modal('hide');
  }

  public getNotification(btnClicked) {

  }



  getClientsList(exchangeId) {
    this.splash.show();
    this.listingService.getClientListByExchangeBroker(exchangeId, AppConstants.participantId, true, true)
      .subscribe(restData => {
        this.splash.hide();
        if (AppUtility.isValidVariable(restData) && !AppUtility.isEmpty(restData)) {
          this.fromClientList = restData;
        } else {
          this.fromClientList = [];
        }
      },
        error => { this.splash.hide(); this.errorMessage = <any>error });
  }







  exportExcel() {
    wjcGridXlsx.FlexGridXlsxConverter.save(this.flexGrid, { includeColumnHeaders: this.includeColumnHeader, includeCellStyles: false }, 'Client Margin Details.xlsx');
  }




  exportPDF() {
    gridPdf.FlexGridPdfConverter.export(this.flexGrid, 'Client Margin Details' + new Date().toLocaleString() + '.pdf', {
      maxPages: 10,
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

        { text: 'Client Margin Details', style: 'header' },
        {
          text: `Date: ${new Date().toLocaleString()}`,
          alignment: 'left',
          fontSize: 10,
          margin: [0, 0, 0, 20]
        },
        {
          columns: [
            [
              {
                text: `Client Code : ` + this.pdfFields[0].value,

              },
              {
                text: `Buying Power : ` + this.pdfFields[3].value,
              },
            ],
            [
              {
                text: `Cash : ` + this.pdfFields[1].value,
                alignment: 'center'
              },
              {
                text: `Open Position : ` + this.pdfFields[4].value,
                alignment: 'center'
              },

            ],
            [
              {
                text: `Margin % : ` + this.pdfFields[2].value,
                alignment: 'right'
              },
              {
                text: `Remaining Buying Power : ` + this.pdfFields[5].value,
                alignment: 'right'
              }
            ]
          ],
        },

        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [{ text: 'Security', style: 'tableHeader' }, { text: 'Holding', style: 'tableHeader' }, { text: 'Buy', style: 'tableHeader' }, { text: 'Sell', style: 'tableHeader' }, { text: 'Queued Orders (Sell)', style: 'tableHeader' }, { text: 'Net', style: 'tableHeader' }, { text: 'Market Price', style: 'tableHeader' }, { text: 'Market Value', style: 'tableHeader' }, { text: 'Haircut(%)', style: 'tableHeader' }, { text: 'Assess Value', style: 'tableHeader' }],
              ...this.holdingDataPDF.map(p => [p.security, p.holding, p.purchase_volume, p.sell_volume, p.queued_sell_volume, p.net, p.market_rate, p.market_value, p.haircut, p.assess_value])
            ],

          },
          margin: [0, 20, 0, 10]
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, marginBottom: 10, alignment: 'center' },
        tableHeader: { bold: true },


      },
    };

    pdfMake.createPdf(docDefinition).download('Client margin details.pdf');

  }




}





















