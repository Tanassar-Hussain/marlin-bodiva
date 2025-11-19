import { AssetClass } from './asset_class';
import { ClientLevieMaster } from './client-levy-master';
import { BondCategory } from './bond-category';
import { BondType } from './bond-type';
import { BondNature } from './bondNature';

import { TraansactionTypesExchange } from './traansaction-type-exchange';
import { ivaLeviesMaster } from './ivaLeviesMaster';

export class ClientLevieDetail {
    leviesDetailId: Number;
	levyRate: Number;	
    appliedTo:String='';
	tradingSideDisplay_:String='';
	effectiveDate: Date;
	active: Boolean;
	leviesMaster: ClientLevieMaster;   
	traansactionTypesExchange: TraansactionTypesExchange;
	unProcessedLevy:Number;
	effectiveToDate: Date;
	valueType : String;
	levyMode : String = null;
	levyModeDisplay_ : String = "";
	valueTypeDisplay_ : String = "";
	assetClassDisplay_ : String = "";
	bondCategoryDisplay_ : String = "";
	bondTypeDisplay_ : String = "";
	bondNatureDisplay_ : String = "";
	slabRangeDisplay_ : string = "";
	ivaLevyDisplay_ : string = "";
	slabRange : string = null;
	asset : AssetClass;

	levyType : String;
    
    bondCategory : BondCategory;
    bondType : BondType;    
    levyFloor : Number;
    levyCeiling : Number;
	bondNature : BondNature;

	rangeFrom : Number;
    rangeTo : Number;

	ivaLeviesMaster : ivaLeviesMaster;
}