import { Participant } from './participant';

export class CommissionSlabMaster {
    commissionSlabId: Number;	
	slabName: String= '';
	slabNameDisplay_: String = '';	
	participant: Participant;	
	minMaxCommFlag: Number;
	minCommAmount: number;
	maxCommAmount: number;
}