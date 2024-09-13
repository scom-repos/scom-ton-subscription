import { FormatUtils, moment } from "@ijstech/components";
import { BigNumber } from "@ijstech/eth-wallet";
import { IDiscountRule, IProductInfo, IWalletPlugin } from "./interface";
export class SubscriptionModel {
    private _durationUnits = [
        {
            label: 'Day(s)',
            value: 'days'
        },
        {
            label: 'Month(s)',
            value: 'months'
        },
        {
            label: 'Year(s)',
            value: 'years'
        }
    ];
    private _wallets: IWalletPlugin[] = [
        {
            name: 'tonwallet'
        }
    ];

    get wallets() {
        return this._wallets
    }

    get durationUnits() {
        return this._durationUnits;
    }

    getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any) {
        if (unit === 'days') {
            return duration;
        } else {
            const dateFormat = 'YYYY-MM-DD';
            const start = startDate ? moment(startDate.format(dateFormat), dateFormat) : moment();
            const end = moment(start).add(duration, unit);
            const diff = end.diff(start, 'days');
            return diff;
        }
    }

    formatNumber(value: number | string | BigNumber, decimalFigures?: number) {
        if (typeof value === 'object') {
            value = value.toFixed();
        }
        const minValue = '0.0000001';
        return FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
    };

    async initWallet() { }

    async connectWallet() { }

    isClientWalletConnected() {
        return false;
    }

    async getProductInfo(productId: number): Promise<IProductInfo> {
        return {
            productType: new BigNumber(1),
            productId: new BigNumber(13),
            uri: "",
            quantity: new BigNumber(10000),
            price: new BigNumber(1000),
            maxQuantity: new BigNumber(10000),
            maxPrice: new BigNumber(0),
            token: {
                "name": "Tether USD",
                "address": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
                "symbol": "USDT.e",
                "decimals": 6,
                "chainId": 43113
            },
            status: new BigNumber(1),
            nft: "0x0075Fb0A3f94B32f8F3aF08AD6D93b1F45437501",
            nftId: new BigNumber(0),
            priceDuration: new BigNumber(86400)
        }
    }

    async getDiscountRules(productId: number) {
        let discountRules: IDiscountRule[] = [];
        return discountRules;
    }

    async subscribe(
        productId: number,
        startTime: number,
        duration: number,
        referrer: string,
        discountRuleId: number = 0,
        callback?: any,
        confirmationCallback?: any
    ) { }

    async renewSubscription(
        productId: number,
        duration: number,
        discountRuleId: number = 0,
        callback?: any,
        confirmationCallback?: any
    ) { }
}