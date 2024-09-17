/// <amd-module name="@scom/scom-ton-subscription/index.css.ts" />
declare module "@scom/scom-ton-subscription/index.css.ts" {
    export const inputStyle: string;
}
/// <amd-module name="@scom/scom-ton-subscription/interface.ts" />
declare module "@scom/scom-ton-subscription/interface.ts" {
    import { IClientSideProvider } from "@ijstech/eth-wallet";
    export enum TokenType {
        ERC20 = "ERC20",
        ERC721 = "ERC721",
        ERC1155 = "ERC1155"
    }
    export enum PaymentModel {
        OneTimePurchase = "OneTimePurchase",
        Subscription = "Subscription"
    }
    export interface ISubscriptionDiscountRule {
        id: number;
        name: string;
        startTime: number;
        endTime: number;
        minDuration?: number;
        discountType: 'Percentage' | 'FixedAmount';
        discountPercentage?: number;
        fixedPrice?: number;
        discountApplication: number;
    }
    export interface ITonSubscription {
        name?: string;
        paymentModel?: PaymentModel;
        chainId?: number;
        tokenAddress?: string;
        tokenType?: TokenType;
        tokenId?: number;
        tokenAmount?: string;
        currency?: string;
        durationInDays?: number;
        memberIds?: string[];
        discountRules?: ISubscriptionDiscountRule[];
        commissionRate?: number;
        affiliates?: string[];
        recipient?: string;
        discountRuleId?: number;
        referrer?: string;
    }
    export interface IWalletPlugin {
        name: string;
        packageName?: string;
        provider?: IClientSideProvider;
    }
}
/// <amd-module name="@scom/scom-ton-subscription/model.ts" />
declare module "@scom/scom-ton-subscription/model.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
    import { IWalletPlugin } from "@scom/scom-ton-subscription/interface.ts";
    import { ITokenObject } from '@scom/scom-token-list';
    export class SubscriptionModel {
        get wallets(): IWalletPlugin[];
        get tokens(): ITokenObject[];
        get durationUnits(): {
            label: string;
            value: string;
        }[];
        getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any): number;
        formatNumber(value: number | string | BigNumber, decimalFigures?: number): string;
        initWallet(): Promise<void>;
        connectWallet(): Promise<void>;
        isClientWalletConnected(): boolean;
        getTokenInfo(address: string, chainId: number): Promise<ITokenObject>;
        subscribe(startTime: number, duration: number, referrer: string, discountRuleId?: number, callback?: any, confirmationCallback?: any): Promise<void>;
        renewSubscription(duration: number, discountRuleId?: number, callback?: any, confirmationCallback?: any): Promise<void>;
    }
}
/// <amd-module name="@scom/scom-ton-subscription" />
declare module "@scom/scom-ton-subscription" {
    import { ControlElement, Module } from '@ijstech/components';
    import { ITonSubscription } from "@scom/scom-ton-subscription/interface.ts";
    interface ScomTonSubscriptionElement extends ControlElement {
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ["i-scom-ton-subscription"]: ScomTonSubscriptionElement;
            }
        }
    }
    export default class ScomTonSubscription extends Module {
        private containerDapp;
        private pnlLoading;
        private pnlBody;
        private pnlStartDate;
        private edtStartDate;
        private lblStartDate;
        private edtDuration;
        private comboDurationUnit;
        private lblEndDate;
        private txStatusModal;
        private pnlDiscount;
        private lblDiscount;
        private lblDiscountAmount;
        private lblOrderTotal;
        private iconOrderTotal;
        private btnSubmit;
        private subscriptionModel;
        private discountApplied;
        private _isRenewal;
        private _renewalDate;
        private tokenAmountIn;
        private _data;
        private token;
        onSubscribe: () => void;
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        private get duration();
        private get durationUnit();
        showLoading(): void;
        hideLoading(): void;
        getConfigurators(): {
            name: string;
            target: string;
            getData: any;
            setData: (data: ITonSubscription) => Promise<void>;
            getTag: any;
            setTag: any;
        }[];
        private getData;
        private setData;
        private getTag;
        private updateTag;
        private setTag;
        private updateStyle;
        private updateTheme;
        private refreshDApp;
        private _updateEndDate;
        private _updateDiscount;
        private _updateTotalAmount;
        private onStartDateChanged;
        private onDurationChanged;
        private onDurationUnitChanged;
        private updateSubmitButton;
        private determineBtnSubmitCaption;
        private showTxStatusModal;
        private onSubmit;
        private doSubmitAction;
        init(): Promise<void>;
        render(): any;
    }
}
