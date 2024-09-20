import { application, FormatUtils, moment } from "@ijstech/components";
import { BigNumber, Wallet, ISendTxEventsOptions } from "@ijstech/eth-wallet";
import { IWalletPlugin } from "./interface";
import { ITokenObject } from '@scom/scom-token-list';
import { SocialDataManager } from "@scom/scom-social-sdk";

export class SubscriptionModel {
    get wallets(): IWalletPlugin[] {
        return [
            {
                name: 'tonwallet'
            }
        ];
    }

    get tokens(): ITokenObject[] {
        return [
            {
                chainId: undefined,
                name: "Toncoin",
                decimals: 18,
                symbol: "TON"
            }
        ]
    }

    get durationUnits() {
        return [
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

    async initWallet() {
        await Wallet.getClientInstance().init();
    }

    async connectWallet() { }

    isClientWalletConnected() {
        return true;
    }

    async getTokenInfo(address: string, chainId: number) {
        let token: ITokenObject;
        const wallet = Wallet.getClientInstance();
        wallet.chainId = chainId;
        const isValidAddress = wallet.isAddress(address);
        if (isValidAddress) {
            const tokenAddress = wallet.toChecksumAddress(address);
            const tokenInfo = await wallet.tokenInfo(tokenAddress);
            if (tokenInfo?.symbol) {
                token = {
                    chainId,
                    address: tokenAddress,
                    name: tokenInfo.name,
                    decimals: tokenInfo.decimals,
                    symbol: tokenInfo.symbol
                }
            }
        }
        return token;
    }

    async subscribe(
        dataManager: SocialDataManager,
        creatorId: string,
        communityId: string,
        startTime: number,
        endTime: number,
        callback?: any,
        confirmationCallback?: any
    ) {
        try {
            await dataManager.updateCommunitySubscription({
                communityCreatorId: creatorId,
                communityId: communityId,
                start: startTime,
                end: endTime,
                txHash: "3jXIY9Whgb2nl/rKiFXLQqqL76jlB3bVHGOR4V7wiD8="
            });
            if (confirmationCallback) confirmationCallback();
        } catch (err) {
            callback(err);
        }
    }
}