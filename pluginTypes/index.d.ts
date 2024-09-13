/// <amd-module name="@scom/scom-ton-subscription/index.css.ts" />
declare module "@scom/scom-ton-subscription/index.css.ts" {
    export const inputStyle: string;
}
/// <amd-module name="@scom/scom-ton-subscription/interface.ts" />
declare module "@scom/scom-ton-subscription/interface.ts" {
    import { BigNumber, IClientSideProvider } from "@ijstech/eth-wallet";
    import { ITokenObject } from "@scom/scom-token-list";
    export interface ITonSubscription {
        productId?: number;
        chainId?: number;
        nftAddress?: string;
        tokenToMint?: string;
        isCustomMintToken?: boolean;
        customMintToken?: string;
        priceToMint?: number;
        maxQty?: number;
        durationInDays?: number;
        priceDuration?: number;
        txnMaxQty?: number;
        uri?: string;
        recipient?: string;
        logoUrl?: string;
        description?: string;
        link?: string;
        discountRuleId?: number;
        referrer?: string;
        defaultChainId: number;
        wallets: IWalletPlugin[];
        networks: any[];
        showHeader?: boolean;
    }
    export interface IWalletPlugin {
        name: string;
        packageName?: string;
        provider?: IClientSideProvider;
    }
    export interface IProductInfo {
        productType: BigNumber;
        productId: BigNumber;
        uri: string;
        quantity: BigNumber;
        price: BigNumber;
        maxQuantity: BigNumber;
        maxPrice: BigNumber;
        token: ITokenObject;
        status: BigNumber;
        nft: string;
        nftId: BigNumber;
        priceDuration: BigNumber;
    }
    export interface IDiscountRule {
        id: number;
        minDuration: BigNumber;
        discountPercentage: number;
        fixedPrice: BigNumber;
        startTime: number;
        endTime: number;
        discountApplication: number;
    }
}
/// <amd-module name="@scom/scom-ton-subscription/model.ts" />
declare module "@scom/scom-ton-subscription/model.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
    import { IDiscountRule, IProductInfo, IWalletPlugin } from "@scom/scom-ton-subscription/interface.ts";
    export class SubscriptionModel {
        private _durationUnits;
        private _wallets;
        get wallets(): IWalletPlugin[];
        get durationUnits(): {
            label: string;
            value: string;
        }[];
        getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any): number;
        formatNumber(value: number | string | BigNumber, decimalFigures?: number): string;
        initWallet(): Promise<void>;
        connectWallet(): Promise<void>;
        isClientWalletConnected(): boolean;
        getProductInfo(productId: number): Promise<IProductInfo>;
        getDiscountRules(productId: number): Promise<IDiscountRule[]>;
        subscribe(productId: number, startTime: number, duration: number, referrer: string, discountRuleId?: number, callback?: any, confirmationCallback?: any): Promise<void>;
        renewSubscription(productId: number, duration: number, discountRuleId?: number, callback?: any, confirmationCallback?: any): Promise<void>;
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
        private pnlUnsupportedNetwork;
        private subscriptionModel;
        private productInfo;
        private discountRules;
        private discountApplied;
        private _isRenewal;
        private _renewalDate;
        private tokenAmountIn;
        private _data;
        onSubscribe: () => void;
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        private get duration();
        private get durationUnit();
        showLoading(): void;
        hideLoading(): void;
        setData(data: ITonSubscription): Promise<void>;
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
