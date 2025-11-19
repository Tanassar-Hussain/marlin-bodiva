import { AssetClass } from "./asset_class";

export class PortfolioDetail {
    totalInvestment : String = "0";
	netPL:String = "0";
	holding:String = "0";
    currentValue : String = "0";
    assetId : String = "";
    assetClass : AssetClass;
    volume : Number = 0;
    localInvestment : Number  = 0;
    foreignInvestment : Number = 0;
    constructor(){
        
    }
	 
}