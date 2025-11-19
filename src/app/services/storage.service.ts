import { Injectable } from '@angular/core';
import {AppConstants}  from '../app.utility'; 
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    private marketWatchDataEquity = new BehaviorSubject<Array<any>>([]);
    private marketWatchDataBonds = new BehaviorSubject<Array<any>>([]);
    private marketWatchDataETF = new BehaviorSubject<Array<any>>([]);

    MARKETWATCH_DASHBOARD_SYMBOLS:string=AppConstants.loginName+'_MW_DashboardSymbols'; 
    MARKETWATCH_EQUITY_SYMBOLS:string=AppConstants.loginName+'_MW_EquitySymbols'; 
    MARKETWATCH_BOND_SYMBOLS:string=AppConstants.loginName+'_MW_BondSymbols'; 

    write(key: string, value: any) {
        if (value) {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    }

    read<T>(key: string): T {
        let value: string = localStorage.getItem(key);

        if (value && value != "undefined" && value != "null") {
            return <T>JSON.parse(value);
        }

        return null;
    }

    //Dashboard market watch symbols 
    saveDashboardMarketWatchSymbols(data:any) {
        this.write(this.MARKETWATCH_DASHBOARD_SYMBOLS, data);
    }

    getDasbhoardMarketWatchSymbols():any {
        return this.read(this.MARKETWATCH_DASHBOARD_SYMBOLS)
    }

    //Equity market watch symbols 
    saveEquityMarketWatchSymbols(data:any) {
        this.write(this.MARKETWATCH_EQUITY_SYMBOLS, data);
    }

    getEquityMarketWatchSymbols():any {
        return this.read(this.MARKETWATCH_EQUITY_SYMBOLS)
    }

    //Bond market watch symbols 
    saveBondMarketWatchSymbols(data:any) {
        this.write(this.MARKETWATCH_BOND_SYMBOLS, data);
    }

    getBondMarketWatchSymbols():any {
        return this.read(this.MARKETWATCH_BOND_SYMBOLS)
    }


    public getMarketWatchDataEquities(): Observable<any> {
        return this.marketWatchDataEquity.asObservable();
    }

    public setMarketWatchDataEquities(data): void {
        this.marketWatchDataEquity.next(data);
    }

    public getMarketWatchDataBonds(): Observable<any> {
        return this.marketWatchDataBonds.asObservable();
    }

    public setMarketWatchDataBonds(data): void {
        this.marketWatchDataBonds.next(data);
    }


    public getMarketWatchDataETF(): Observable<any> {
        return this.marketWatchDataETF.asObservable();
    }

    public setMarketWatchDataETF(data): void {
        this.marketWatchDataETF.next(data);
    }




}