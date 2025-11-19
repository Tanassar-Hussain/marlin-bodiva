import { Privilege } from './privilege';


export class SubscriptionItems {
     subscriptionId : Number;
      
     privileges : Privilege[];


     constructor(){
        this.subscriptionId = null;
        this.privileges=[];
    }


}