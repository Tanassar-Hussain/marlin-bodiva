import { Injectable } from '@angular/core';
import { AppConstants } from 'app/app.utility';
import { data } from "autoprefixer";


@Injectable({
    providedIn: 'root'
})

export class TradingGraph {

    public adapt(item): TradingGraphKline {
        return {
            volume: this.setVolume(item),
            open: +item.open,
            close: +item.currentPrice,
            turnover: +item.totalTradedQuantity,
            low: +item.low,
            high: +item.high,
            timestamp: this.setDate(item.lastTradeTime, AppConstants.UTC_LOCALE_HOURS_IN_NUMBER),
            securityDescription: item.securityDescription,
        };
    }

    setDate(date, utcHours: number) {
        let settingDate = new Date(date)
        let hours = settingDate.getHours()
        settingDate.setHours(hours + utcHours)
        return settingDate.getTime()
    }

    setVolume(data) {
        if (data.lastTradeQuantity <= 0)
            return data.totalTradedQuantity;
        else
            return data.lastTradeQuantity;
    }


}

export interface TradingGraphKline {
    volume: number;
    open: number;
    close: number;
    turnover: number;
    low: number;
    high: number;
    timestamp: number;
    securityDescription: string;
}
