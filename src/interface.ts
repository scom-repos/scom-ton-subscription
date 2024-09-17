import { BigNumber, IClientSideProvider } from "@ijstech/eth-wallet";
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