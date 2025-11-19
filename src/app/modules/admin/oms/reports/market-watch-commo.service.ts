import { HttpClient } from "@angular/common/http";
import { AfterViewInit, Injectable, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService2 } from "app/services/auth2.service";
import { Observable } from "rxjs";


@Injectable()
export class MarketWatchCommoditiesService   {
  
  public nodeEvent : any;
  private marketWatchData!: any[];
  public previousData: any[] = [];
  
  public  data : any[] = [{
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
  }, {
    "symbol_code": "GO1OZ-AP24",
    "Type": "Gold",
    "bid": 1.10345,
    "ask": 1.10345,
    "latency": 4887,
    "feed_type": "raw",
    "original_ask": 2035.9,
    "original_bid": 2035.8,
  },
];

  constructor(private http: HttpClient, private router : Router, private authService: AuthService2,) {

    console.log("--------------------------------" + this.router.url);
  
    

  }


 




  fetchData(): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.marketWatchData = this.data;
      this.previousData = this.data;
      observer.next(this.marketWatchData);

      setInterval(() => {
        this.marketWatchData = this.marketWatchData.map((row: any) =>
          this.updateRandomRow(row)
        );

        observer.next(this.marketWatchData);
      }, 1000);
    });
  }



  updateRandomRow(row: any): any {
 
      let changePrice = Math.floor(30 * Math.random()) / 10;
      changePrice *= Math.round(Math.random()) ? 2 : -0.09;

      let changePercentage = Math.floor(30 * Math.random()) / 10;
      changePercentage *= Math.round(Math.random()) ? 1 : -1;

      const percentageValue = row.bid + changePercentage;
      const priceValue = row.ask + changePrice;

      const newRow = {
        ...row,
        bid: percentageValue,
        ask: priceValue,
        latency : row.latency,
        feed_type : row.feed_type,
        original_ask : row.original_ask,
        original_bid : row.original_bid,
      };

      this.previousData = [...this.marketWatchData];
      return newRow;
    }  
  }
