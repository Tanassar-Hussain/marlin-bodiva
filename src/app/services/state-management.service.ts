import { Injectable } from '@angular/core';
import {Participant} from "../models/participant";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService2} from "./auth2.service";
import {AppConstants, AppUtility} from "../app.utility";
import {BehaviorSubject, Observable} from "rxjs";
import {tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class StateManagementService {

    private readonly _url = AppConstants.apiBaseUrl;

    private _participants: Participant[] = [];
    private _participantsSubject = new BehaviorSubject<Participant[]>(this._participants); // New BehaviorSubject

    constructor(private readonly _http: HttpClient, private readonly _authService: AuthService2) {}

    private _createAuthorizationHeader(token: string): HttpHeaders {
        return new HttpHeaders().set('Authorization', 'Bearer ' + token);
    }

    // New observable for components that want to subscribe to participants
    get participants$(): Observable<Participant[]> {
        return this._participantsSubject.asObservable();
    }

    getParticipants(token: string): Observable<any> {
        const url = `${this._url}exchanges/${AppConstants.exchangeId}/participants-new/`;
        const headers = this._createAuthorizationHeader(token);
        return this._http.get<any>(url, { headers }).pipe(
            tap((data) => {
                if (!AppUtility.isEmpty(data)) {
                    this._participants = data as Participant[];
                    this._participantsSubject.next(this._participants); // Notify the new observable
                }
            })
        );
    }

    // Existing getter remains unchanged for backward compatibility
    get participants() {
        return this._participants;
    }
}
