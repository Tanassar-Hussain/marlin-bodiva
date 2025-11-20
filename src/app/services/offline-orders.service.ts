import {Injectable} from '@angular/core';
import {AppConstants} from "../app.utility";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthService2} from "./auth2.service";
import { RefinedOrder } from 'app/models/refined-order.model';

let jwtDecode = require('jwt-decode');

@Injectable({
    providedIn: 'root'
})
export class OfflineOrdersService {

    private readonly _url = AppConstants.apiBaseUrl;

    constructor(private readonly _http: HttpClient, private readonly _authService: AuthService2) {
    }

    private createAuthorizationHeader(): HttpHeaders {
        return new HttpHeaders().set('Authorization', 'Bearer ' + this._authService.token);
    }

    getLoggedInUserParticipants(): Observable<any> {
        const url = `${this._url}participants/get/list/user-type`;
        const headers = this.createAuthorizationHeader();
        return this._http.get<any>(url, { headers });
    };

    getPendingOrders(filters: any): Observable<any> {
        const claims = jwtDecode(this._authService.token);
        const participantId = claims?.participant?.id || -1;
        const clientId = filters.clientId || -1;
        const url = `${this._url}offline-order/list/participant/${participantId}/client/${clientId}`;
        const headers = this.createAuthorizationHeader();
        return this._http.get<any>(url, { headers });
    }

    acceptPendingOrders(order: object): Observable<any> {
        const url = `${this._url}offline-order/approve`;
        const headers = this.createAuthorizationHeader();
        return this._http.put<any>(url, order, { headers });
    }

    rejectPendingOrders(data: any): Observable<any> {
        const orderNo = data.orderNo;
        const url = `${this._url}offline-order/delete/${orderNo}`;
        const headers = this.createAuthorizationHeader();
        return this._http.delete<any>(url, { headers, observe: 'response' });
    }

    submitClientOrder(order: Partial<RefinedOrder>): Observable<any> {
        const url = `${this._url}offline-order/submit`;
        const headers = this.createAuthorizationHeader();
        return this._http.post<any>(url, order, { headers });
    }

    updatePendingOrder(order: object): Observable<any> {
        const url = `${this._url}offline-order/change`;
        const headers = this.createAuthorizationHeader();
        return this._http.put<any>(url, order, { headers });
    }

    deletePendingOrder(id: number): Observable<any> {
        const url = `${this._url}offline-order/delete/${id}`;
        const headers = this.createAuthorizationHeader();
        return this._http.delete<any>(url, { headers });
    }


    getLeviesAmount(data : any): Observable<any> {
        const url = `${this._url}orders/levy-amont/`;
        const headers = this.createAuthorizationHeader();
        return this._http.post<any>(url, data, { headers });
    }


    approvePendingOrdersList(arr : any[]): Observable<any> {
        const url = `${this._url}offline-order/approve/list`;
        const headers = this.createAuthorizationHeader();
        return this._http.put<any>(url, arr, { headers });
    }

    changeWorkingOrders(data : any): Observable<any> {
        const url = `${this._url}offline-order/change`;
        const headers = this.createAuthorizationHeader();
        return this._http.put<any>(url, data, { headers });
    }

}
