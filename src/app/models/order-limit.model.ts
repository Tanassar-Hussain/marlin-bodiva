import {AppConstants} from "../app.utility";

export class OrderLimit{
    riskParamId: number = null;
    exchangeId: number = 0;
    exchangeCode: string = '';
    participantId: number = null;
    participantCode: string = null;
    clientId: number = null;
    clientCode: string = null;
    kycStatus: 'A' | 'L' = 'L';
    applicable: 'D' | 'O' = 'D';
    normBuyLimit: number = 0;
    normSellLimit: number = 0;
    negoBuyLimit: number = 0;
    negoSellLimit: number = 0;
    bypassLimit: boolean = false;
    creationDate: string = null;
    modifyDate: string = null;
    userId: number = AppConstants.userId;
    clients : any[] = [];
    orderLimitType : 'D' | 'C' = 'D';
}
