import { AssetClass } from './asset_class';
import { BondCategory } from './bond-category';
import { BondType } from './bond-type';
import { BondNature } from './bondNature';
import { CommissionSlabMaster } from './commission-slab-master';
import { TraansactionTypesExchange } from './traansaction-type-exchange';

export class CommissionSlabDetail
{
    commissionSlabDetailID: number;    
    lowerRange: number;
    upperRange: number;
    deliveryComm: number;
    deliveryFP: String;
    deliveryFPDisplay_: String;
    differenceComm: number;
    differenceFP: String;
    differenceFPDisplay_: String;
    appliedToSettlement : String;

    commissionMode: String= '';
    commissionModeDisplay_: String = '';
    applyDelCommission: number;
    
    traansactionTypesExchange: TraansactionTypesExchange;
    commissionSlabMaster: CommissionSlabMaster;
    
     appliedOn : String;              
     asset : AssetClass;             
     bondCategory : BondCategory;      
     bondType :  BondType;
     bondNature : BondNature;

     assetClassDisplay_ : String = "";
     bondTypeDisplay_ : String = "";
     bondCategoryDisplay_ : String = "";
     bondNatureDisplay_ : String = "";
     commModeDisplay_ : String = "";
     appliedToDisplay_ : String = "";
     valueTypeDisplay_ : String = "";

     valueType : String = "";
     valueTypeRepo : String = "";

}
