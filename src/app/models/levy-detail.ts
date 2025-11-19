import { AssetClass } from './asset_class';
import { BondCategory } from './bond-category';
import { BondType } from './bond-type';
import { BondNature } from './bondNature';
import { ClientLevieMaster } from './client-levy-master';
import { ivaLeviesMaster } from './ivaLeviesMaster';
import { LevyCategory } from './levyCategory';
import { Market } from './market';
import { TraansactionTypesExchange } from './traansaction-type-exchange';

export class LevieDetail {
    leviesDetailId: Number;
	levyRate: number;	
    appliedTo :String='';
	tradingSideDisplay_:String='';
	effectiveDate: Date;
	effectiveToDate: Date;
	active: Boolean;
	leviesMaster: ClientLevieMaster;   
	traansactionTypesExchange: TraansactionTypesExchange;
	unProcessedLevy:Number;

	


    // Added By Faizan 23-12-2022
	levyType : String;
    asset : AssetClass;
    bondCategory : BondCategory;
    bondType : BondType;
    levyMode : String = null;
    valueType : String = null;
    levyFloor : Number;
    levyCeiling : Number;
	bondNature : BondNature;
    slabRange : string = 'D';
    rangeFrom : Number;
    rangeTo : Number;
    ivaLeviesMaster : ivaLeviesMaster;

    levyModeDisplay_ : String = "";
	valueTypeDisplay_ : String = "";
    assetClassDisplay_ : String = "";
    bondCategoryDisplay_ : String = "";
	bondTypeDisplay_ : String = "";
    bondNatureDisplay_ : String = "";
    slabRangeDisplay_ : string = "";
    ivaLevyDisplay_ : string = "";
}