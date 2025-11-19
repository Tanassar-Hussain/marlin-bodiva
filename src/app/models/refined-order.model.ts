import {Order} from "./order";

export class RefinedOrder extends Order {
    participantId: number = 0;
    clientId: number = 0;
    senderUserId: number = 0;
    userId: number = 0;
    entryDatetime: string = '';
    exchangeId: number = 0;
    marketId: number = 0;
    symbolId: number = 0;
    asset_id: number = 0;
    orderTypeMappingId: number = 0;
    orderQualifierMappingId: number = 0;
    tifOptionMappingId: number = 0;
}
