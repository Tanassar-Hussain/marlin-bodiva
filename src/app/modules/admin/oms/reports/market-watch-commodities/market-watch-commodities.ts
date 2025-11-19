import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { AppState } from "app/app.service";
import { AuthService2 } from 'app/services/auth2.service';
import { ListingService } from 'app/services-oms/listing-oms.service';
import { DataServiceOMS } from "app/services-oms/data-oms.service";
import { OrderService } from 'app/services-oms/order-oms.service';
 
import { TranslateService } from "@ngx-translate/core";
import { Router } from "@angular/router";
import { AppUtility } from "app/app.utility";
import {
    trigger,
    style,
    animate,
    transition,
    keyframes,
    state
  } from "@angular/animations";
import { RowClassArgs } from "@progress/kendo-angular-grid";
import { MarketWatchCommoditiesService } from "../market-watch-commo.service";

@Component({
    selector: '[market-watch-commodities]',
    templateUrl: './market-watch-commodities.html',
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('toggleClick', [     // trigger block
        state('true', style({      // final CSS following animation
          backgroundColor: 'green'
        })),
        state('false', style({
          backgroundColor: 'red'
        })),
        transition('true => false', animate('1000ms linear')),  // animation timing
        transition('false => true', animate('1000ms linear'))
      ])
      ],
  })

  

  
  export class MarketWatchCommodities implements OnInit, OnDestroy, AfterViewInit {
    isGreen: string = 'true';

    public DATA : any[] = [{
        "symbol_code": "GO100OZ-MAY24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      }, {
        "symbol_code": "TOLAGOLD-MAY24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "GO100OZ-AP24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      }, {
        "symbol_code": "PLATINUM5-MA24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "PLATINUM50-MA24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "COPPER-AP24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "COPPER25K-AP24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "SL10OZ-MA24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "SL100OZ-MA24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
      {
        "symbol_code": "COPPER-MA24",
        "Type": "Gold",
        "bid": 1.10345,
        "ask": 1.10345,
        "latency": 4887,
        "feed_type": "raw",
        "original_ask": 2035.9,
        "original_bid": 2035.8,
       
      },
    ];


  

 
       
    


    public previousData : any[] = [];
    public symbolListItems: Array<string> = [];
    public selectedValues: string = "Gold";
    tempData: any[];
    gridData: any;
    prevDataItem!: any;
    marketWatchData: any[];
    socketSubscription: any;

    constructor(private appState: AppState, private authService: AuthService2, private listingSvc: ListingService, private dataService: DataServiceOMS,
        private orderSvc: OrderService,  private translate: TranslateService, public router : Router, public marketWatchService : MarketWatchCommoditiesService){ 

            this.gridData = this.marketWatchService.fetchData();

        }


    ngOnInit(): void {
      this.socketSubscription = this.authService.socket.on('FEED.LIVE', (dataBO) => {   this.updateData(dataBO) });

    }

    ngAfterViewInit(): void {
       // this.authService.socket.on('FEED.LIVE', (dataBO) => {  console.log(dataBO) });
    }


    ngOnDestroy(): void {
        if (this.socketSubscription) {
            this.socketSubscription.off('FEED.LIVE');
          }
    }




    toggleIsCorrect() {
        this.isGreen = this.isGreen === 'true' ? 'false' : 'true'; // change in data-bound value
      }




    public updateData = (data:any) => {
         
          if(AppUtility.isValidVariable(data) && !AppUtility.isEmptyArray(this.DATA)){
            const index = this.DATA.findIndex(
                (item) => item.symbol_code === data.symbol_code
            );

            this.prevDataItem = this.DATA[index];
            this.DATA[index] = data;
            this.DATA = this.DATA.slice();
            
          }
    }


 



 
      }



   