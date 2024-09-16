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
    defaultChainId?: number;
    wallets?: IWalletPlugin[];
    networks?: any[];
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
    discountApplication: number; // 0: FirstTimeOnly, 1: RenewalsOnly, 2: All
}