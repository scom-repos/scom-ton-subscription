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
    export enum PaymentMethod {
        EVM = "EVM",
        TON = "TON",
        Telegram = "Telegram"
    }
    export interface ISubscriptionDiscountRule {
        id: number;
        name: string;
        startTime: number;
        endTime: number;
        minDuration?: number;
        discountType?: 'Percentage' | 'FixedAmount';
        discountPercentage?: number;
        fixedPrice?: number;
        discountApplication: number;
    }
    export interface ITonSubscription {
        creatorId?: string;
        communityId?: string;
        photoUrl?: string;
        name?: string;
        paymentModel?: PaymentModel;
        paymentMethod?: PaymentMethod;
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
    import { SocialDataManager } from "@scom/scom-social-sdk";
    export class SubscriptionModel {
        private tonweb;
        private toncore;
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
        loadLib(moduleDir: string): Promise<unknown>;
        getTransactionHashByMessageHash(messageHash: string): Promise<string>;
        getTransactionHash(boc: string): Promise<string>;
        constructPayload(msg: string): Promise<any>;
        getTokenInfo(address: string, chainId: number): Promise<ITokenObject>;
        updateCommunitySubscription(dataManager: SocialDataManager, creatorId: string, communityId: string, startTime: number, endTime: number, txHash: string): Promise<void>;
    }
}
/// <amd-module name="@scom/scom-ton-subscription" />
declare module "@scom/scom-ton-subscription" {
    import { ControlElement, Module } from '@ijstech/components';
    import { SocialDataManager } from '@scom/scom-social-sdk';
    import { ITonSubscription } from "@scom/scom-ton-subscription/interface.ts";
    interface ScomTonSubscriptionElement extends ControlElement {
        onMintedNFT?: () => void;
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
        private pnlHeader;
        private pnlLoading;
        private pnlBody;
        private edtStartDate;
        private pnlCustomStartDate;
        private chkCustomStartDate;
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
        private isWalletConnected;
        private btnTonSubmit;
        private telegramPayWidget;
        private tonConnectUI;
        private subscriptionModel;
        private discountApplied;
        private _isRenewal;
        private _renewalDate;
        private _data;
        private _dataManager;
        private botApiEndpoint;
        onMintedNFT: () => void;
        get dataManager(): SocialDataManager;
        set dataManager(manager: SocialDataManager);
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        private get isTelegram();
        private get duration();
        private get durationUnit();
        private get basePrice();
        private get totalAmount();
        private get currency();
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
        private _updateInvoiceData;
        private onStartDateChanged;
        private onDurationChanged;
        private onDurationUnitChanged;
        private handleCustomCheckboxChange;
        private updateSubmitButton;
        private initTonWallet;
        private connectTonWallet;
        private determineBtnSubmitCaption;
        private showTxStatusModal;
        private onSubmit;
        private handleTelegramPaymentCallback;
        private handleTonPayment;
        private doSubmitAction;
        init(): Promise<void>;
        render(): any;
    }
}
