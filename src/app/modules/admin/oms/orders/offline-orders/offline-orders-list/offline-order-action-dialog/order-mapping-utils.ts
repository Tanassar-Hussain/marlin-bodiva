class Order {
    broker: string = '';
    actual_settlement_amount: number = 0;
    order_no: string = '';
    ref_no: string = '';
    exchange: string = '';
    market: string = '';
    symbol: string = '';
    symbolMktExch: string = '';
    type_: string = 'limit';
    type: string = 'limit';
    side: string = '';
    price: string = '';
    price_: number = 0;
    yield: number = 0;
    accrudeProfit: number = 0;
    pricingMechanism: number = 0;
    triggerPrice: string = '';
    triggerPrice_: number = 0;
    volume: number = 500;
    actual_volume: number = 0;
    sVolume: string = '';
    value: number = 0;
    settlementValue: number = 0;
    account: string = '';
    custodian: string = '';
    tifOption: string = '';
    gtd: Date = new Date();
    qualifier: string = '';
    discQuantity: number = 0;
    username: string = '';
    state_time: Date = null;
    order_state: string = '';
    expiryDate: any = '';
    disclosedVolume: number = 0;
    lang: any;
    is_negotiated: boolean = false;
    counter_broker_code: string = '';
    counter_client_code: string = '';
    counter_user_id: number = 0;
    counter_username: string = '';
    negotiated_order_state: string = '';
    negotiated_order_status: string = '';
    symbolType: number = 0;
    counter_order_no: number = null;
    repo_type: string = 'NotAny';
    contract_initial_date: Date = new Date();
    contract_id: string = '0';
    repurchase_price: string = '';
    repurchase_price_: number = 0;
    repo_leg: number = 1;
    repo_haircut: string = '';
    repo_haircut_: number = 0;
    repurchase_rate_: number = 0;
    repurchase_rate: string = '';
    participant: string = '';
    dirtyPrice: number = 0;
    nominalValue: number = 0;
    marketValue: number = 0;
    sellPrice: number = 0;
    terminationDate: Date = null;
    sender_username: string = '';
    actual_client_code: string = '';
    actual_broker_code: string = '';
}

type OrderData = {
    [key: string]: any;
};

export function MappedOrder(obj: OrderData): Order {
    const mappedObject = new Order();

    for (const key in mappedObject) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            switch (typeof mappedObject[key]) {
                case 'string':
                    mappedObject[key] = value != null ? String(value) : '';
                    break;
                case 'number':
                    mappedObject[key] = value != null ? Number(value) : 0;
                    break;
                case 'boolean':
                    mappedObject[key] = value != null ? Boolean(value) : false;
                    break;
                case 'object':
                    if (value instanceof Date || mappedObject[key] instanceof Date) {
                        mappedObject[key] = value != null ? new Date(value) : null;
                    } else {
                        mappedObject[key] = value != null ? value : {};
                    }
                    break;
                default:
                    mappedObject[key] = value != null ? value : null;
            }
        } else {
            // Assign default values if the key is not present in the input object
            if (key === 'contract_initial_date') {
                mappedObject[key] = new Date(); // Current UTC time
            } else if (typeof mappedObject[key] === 'string') {
                mappedObject[key] = '';
            } else if (typeof mappedObject[key] === 'number') {
                mappedObject[key] = 0;
            } else if (typeof mappedObject[key] === 'boolean') {
                mappedObject[key] = false;
            } else if (mappedObject[key] instanceof Date) {
                mappedObject[key] = null;
            } else {
                mappedObject[key] = null;
            }
        }
    }

    // Apply additional mappings
    mappedObject.triggerPrice = String(mappedObject.triggerPrice_);
    mappedObject.state_time = null;
    mappedObject.counter_order_no = null;
    mappedObject.terminationDate = null;
    mappedObject.username = obj.username;
    mappedObject.type_ = mappedObject.type_.toLowerCase();
    mappedObject.participant = '';
    mappedObject.order_no = '';
    mappedObject.lang = localStorage.getItem("lang") ?? "en";
    mappedObject.contract_initial_date = new Date(); // Current UTC time
    mappedObject.symbolMktExch = `${mappedObject.symbol}(${mappedObject.market}/${mappedObject.exchange})`;
    mappedObject.repo_type = "NotAny";
    mappedObject.contract_id = "0";

    return mappedObject;
}
