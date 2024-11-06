import { BigNumber, IClientSideProvider } from "@ijstech/eth-wallet";
import { ISubscriptionDiscountRule } from "@scom/scom-social-sdk";
import { ITokenObject } from "@scom/scom-token-list";

export declare enum TokenType {
    ERC20 = "ERC20",
    ERC721 = "ERC721",
    ERC1155 = "ERC1155"
}

export declare enum PaymentModel {
    OneTimePurchase = "OneTimePurchase",
    Subscription = "Subscription"
}

export enum PaymentMethod {
    EVM = "EVM",
    TON = "TON",
    Telegram = "Telegram"
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