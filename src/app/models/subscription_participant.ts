import { SubscriptionPricing } from "./subscription-pricing";

 


export class SubscriptionParticipant {
    participantSubscriptionId: Number; 
    participantId : Number;
    participantName : String;
    startDate : Date;
    endDate : Date;
    userId : Number;
    userName : String;
    active : boolean;
    discount : Number;
    netAmount : Number;
    pricing : SubscriptionPricing;
    intimationDays : Number = 0;
    showWarning : boolean = true;
}