import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConstants } from 'app/app.utility';
import { SymbolAddDialogComponentService } from 'app/modules/common-components/symbol-add-dialog/symbol-add-dialog.component.service';
import { RestService } from 'app/services/api/rest.service';
@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    public sharedData = new Subject<any>();

    private watchlistSymbols$ = new BehaviorSubject<Array<any>>([]);
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    xml: string;
    userid: any;
    private selectedAssetClass: BehaviorSubject<any> = new BehaviorSubject(null);
    topSecurity: BehaviorSubject<any> = new BehaviorSubject(null);
    // AppConstants.ASSET_CLASS_EQUITIES
    constructor(
        private _httpClient: HttpClient,
        private _symbolService: SymbolAddDialogComponentService,
        private _restService: RestService,) {
        let user = JSON.parse(sessionStorage.getItem('user'));
        this.userid = user?.id;
        this.getWatchListSymbols()
    }

    setSelectedAssedClass(assetClass) {

        this.selectedAssetClass.next(assetClass)
    }

    get selectedAssetClass$(): Observable<any> {
        return this.selectedAssetClass.asObservable();
    }

    public getOrderData(): Observable<any> {
        return this.sharedData.asObservable();
    }

    public setOrderData(data): void {
        this.sharedData.next(data);
    }

    setTopSecurity(securityCode) {
        this.topSecurity.next(securityCode)
    }

    get selectedTopSecurity$(): Observable<any> {
        return this.topSecurity.asObservable();
    }

    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    getRssFeed(url) {
        return this._httpClient.get(url, { responseType: 'text' })
    }

    getWatchListSymbols() {

        this._symbolService.getFavourites(this.userid, AppConstants.exchangeCode).subscribe((data) => {
            this.watchlistSymbols$.next(data)
        }, (error => {
        }));
    }

    get WatchListSymbols$(): Observable<any> {
        return this.watchlistSymbols$.asObservable();
    }



}
