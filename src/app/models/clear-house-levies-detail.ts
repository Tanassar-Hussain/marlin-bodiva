import { SettlementType } from './settlement-type';
import { ClearingHouseLeviesMaster } from './clear-house-levies-master';
import { AssetClass } from './asset_class';
import { Market } from './market';
import { BondCategory } from './bond-category';
import { BondType } from './bond-type';


export class ClearingHouseLeviesDetail {
    effectiveDate: Date;
    levyRate: Number;
    tradingSide: String;
    tradingSideDisplay_: String;
    minAmount: Number;
    maxAmount: Number;
    leviesDetailId: Number;
    active: Boolean;
    settlementType: SettlementType;
    chLeviesMaster: ClearingHouseLeviesMaster;





}