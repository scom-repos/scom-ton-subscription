import { application, FormatUtils, moment } from "@ijstech/components";
import { BigNumber, Wallet, Utils, IMulticallContractCall, INetwork, ISendTxEventsOptions } from "@ijstech/eth-wallet";
import { IDiscountRule, IProductInfo, IWalletPlugin } from "./interface";
import { Contracts as ProductContracts } from '@scom/scom-product-contract';
import getNetworkList from '@scom/scom-network-list';
import { ITokenObject, tokenStore } from '@scom/scom-token-list';

type ContractType = 'ProductMarketplace' | 'OneTimePurchaseNFT' | 'SubscriptionNFTFactory' | 'Promotion' | 'Commission';

export class SubscriptionModel {
    private rpcWalletId: string = '';
    private networkMap = {} as { [key: number]: INetwork };
    private infuraId: string = 'adc596bf88b648e2a8902bc9093930c5';
    private contractInfoByChain = {
        "97": {
            "ProductMarketplace": {
                "address": "0x93e684ad2AEE178e23675fbE5bA88c3e4e7467f4"
            },
            "OneTimePurchaseNFT": {
                "address": "0x5aE9c7f08572D52e2DB8508B502D767A1ECf21Bf"
            },
            "SubscriptionNFTFactory": {
                "address": "0x0055e4edb49425A29784Bd9a7986F5b56dcc8f6b"
            },
            "Promotion": {
                "address": "0x13d23201a8A6661881d701E1cF56A30A8eb0aE90"
            },
            "Commission": {
                "address": "0xcdc39C8bC8F9fDAF31D79f461B47477606770c62"
            }
        },
        "43113": {
            "ProductMarketplace": {
                "address": "0xeC3747eAbf71D4BDF15Abb70398C04B642363D10"
            },
            "OneTimePurchaseNFT": {
                "address": "0x404eeCC44F7aFc1f7561b2A9bC475513206D4b15"
            },
            "SubscriptionNFTFactory": {
                "address": "0x9231761Bd5f32c8f6465d82168BAdaB109D23290"
            },
            "Promotion": {
                "address": "0x22786FF4E595f1B517242549ec1D263e62dc6F26"
            },
            "Commission": {
                "address": "0x2Ed01CB805e7f52c92cfE9eC02E7Dc899cA53BCa"
            }
        }
    };

    get wallets(): IWalletPlugin[] {
        return [
            {
                name: 'metamask'
            }
        ];
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

    getContractAddress(type: ContractType) {
        const wallet = this.getRpcWallet();
        const chainId = wallet?.chainId;
        const contracts = this.contractInfoByChain[chainId] || {};
        return contracts[type]?.address;
    }

    getRpcWallet() {
        return this.rpcWalletId ? Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
    }

    getDefaultData() {
        return {
            "defaultChainId": 43113,
            "networks": [
                {
                    "chainId": 43113
                },
                {
                    "chainId": 97
                }
            ],
            "wallets": [
                {
                    "name": "metamask"
                }
            ]
        }
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
        await this.getRpcWallet()?.init();
    }

    async connectWallet() { }

    isClientWalletConnected() {
        const wallet = Wallet.getClientInstance();
        return wallet.isConnected;
    }

    initRpcWallet(defaultChainId: number) {
        if (this.rpcWalletId) {
            return this.rpcWalletId;
        }
        const clientWallet = Wallet.getClientInstance();
        const networkList: INetwork[] = Object.values(application.store?.networkMap || []);
        const instanceId = clientWallet.initRpcWallet({
            networks: networkList,
            defaultChainId,
            infuraId: application.store?.infuraId,
            multicalls: application.store?.multicalls
        });
        this.rpcWalletId = instanceId;
        if (clientWallet.address) {
            const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
            rpcWallet.address = clientWallet.address;
        }

        const defaultNetworkList = getNetworkList();
        const defaultNetworkMap = defaultNetworkList.reduce((acc, cur) => {
            acc[cur.chainId] = cur;
            return acc;
        }, {});
        for (let network of networkList) {
            const networkInfo = defaultNetworkMap[network.chainId];
            if (!networkInfo) continue;
            if (this.infuraId && network.rpcUrls && network.rpcUrls.length > 0) {
                for (let i = 0; i < network.rpcUrls.length; i++) {
                    network.rpcUrls[i] = network.rpcUrls[i].replace(/{InfuraId}/g, this.infuraId);
                }
            }
            this.networkMap[network.chainId] = {
                ...networkInfo,
                ...network
            };
        }
        return instanceId;
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

    async getProductInfo(productId: number): Promise<IProductInfo> {
        const productMarketplaceAddress = this.getContractAddress('ProductMarketplace');
        if (!productMarketplaceAddress) return null;
        try {
            const wallet = this.getRpcWallet();
            const productMarketplace = new ProductContracts.ProductMarketplace(wallet, productMarketplaceAddress);
            const product = await productMarketplace.products(productId);
            const chainId = wallet.chainId;
            if (product.token && product.token === Utils.nullAddress) {
                let net = getNetworkList().find(net => net.chainId === chainId);
                return {
                    ...product,
                    token: {
                        chainId: wallet.chainId,
                        address: product.token,
                        decimals: net.nativeCurrency.decimals,
                        symbol: net.nativeCurrency.symbol,
                        name: net.nativeCurrency.symbol,
                    }
                };
            }
            const _tokenList = tokenStore.getTokenList(chainId);
            let token: ITokenObject = _tokenList.find(token => product.token && token.address && token.address.toLowerCase() === product.token.toLowerCase());
            if (!token && product.token) {
                token = await this.getTokenInfo(product.token, chainId);
            }
            return {
                ...product,
                token
            };
        } catch {
            return null;
        }
    }

    async getProductId(nftAddress: string) {
        let productId: number;
        try {
            const wallet = this.getRpcWallet();
            const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, nftAddress);
            productId = (await subscriptionNFT.productId()).toNumber();
        } catch (err) {
            console.log("product id not found");
            console.error(err);
        }
        return productId;
    }

    async getDiscountRules(productId: number) {
        let discountRules: IDiscountRule[] = [];
        const promotionAddress = this.getContractAddress('Promotion');
        if (!promotionAddress) return discountRules;
        try {
            const wallet = this.getRpcWallet();
            const promotion = new ProductContracts.Promotion(wallet, promotionAddress);
            const ruleCount = await promotion.getDiscountRuleCount(productId);
            let contractCalls: IMulticallContractCall[] = [];
            for (let i = 0; i < ruleCount.toNumber(); i++) {
                contractCalls.push({
                    contract: promotion,
                    methodName: 'discountRules',
                    params: [productId, i],
                    to: promotionAddress
                });
            }
            if (contractCalls.length === 0) return discountRules;
            const multicallResults = await wallet.doMulticall(contractCalls);
            for (let i = 0; i < multicallResults.length; i++) {
                const multicallResult = multicallResults[i];
                if (!multicallResult) continue;
                const discountRule = multicallResult;
                discountRules.push({
                    id: discountRule.id.toNumber(),
                    minDuration: discountRule.minDuration,
                    discountPercentage: discountRule.discountPercentage.toNumber(),
                    fixedPrice: Utils.fromDecimals(discountRule.fixedPrice),
                    startTime: discountRule.startTime.toNumber(),
                    endTime: discountRule.endTime.toNumber(),
                    discountApplication: discountRule.discountApplication.toNumber()
                });
            }
        } catch (err) {
            console.error('failed to get discount rules');
        }
        return discountRules;
    }

    private registerSendTxEvents(sendTxEventHandlers: ISendTxEventsOptions) {
        const wallet = Wallet.getClientInstance();
        wallet.registerSendTxEvents({
            transactionHash: (error: Error, receipt?: string) => {
                if (sendTxEventHandlers.transactionHash) {
                    sendTxEventHandlers.transactionHash(error, receipt);
                }
            },
            confirmation: (receipt: any) => {
                if (sendTxEventHandlers.confirmation) {
                    sendTxEventHandlers.confirmation(receipt);
                }
            },
        })
    }

    private async getDiscount(productId: number, productPrice: BigNumber, discountRuleId: number) {
        let basePrice: BigNumber = productPrice;
        let promotionAddress = this.getContractAddress('Promotion');
        const wallet = Wallet.getClientInstance();
        const promotion = new ProductContracts.Promotion(wallet, promotionAddress);
        const index = await promotion.discountRuleIdToIndex({ param1: productId, param2: discountRuleId });
        const rule = await promotion.discountRules({ param1: productId, param2: index });
        if (rule.discountPercentage.gt(0)) {
            const discount = productPrice.times(rule.discountPercentage).div(100);
            if (productPrice.gt(discount))
                basePrice = productPrice.minus(discount);
        } else if (rule.fixedPrice.gt(0)) {
            basePrice = rule.fixedPrice;
        } else {
            discountRuleId = 0;
        }
        return {
            price: basePrice,
            id: discountRuleId
        }
    }

    async subscribe(
        productId: number,
        startTime: number,
        duration: number,
        referrer: string,
        discountRuleId: number = 0,
        callback?: any,
        confirmationCallback?: any
    ) {
        let commissionAddress = this.getContractAddress('Commission');
        let productMarketplaceAddress = this.getContractAddress('ProductMarketplace');
        const wallet = Wallet.getClientInstance();
        const commission = new ProductContracts.Commission(wallet, commissionAddress);
        const productMarketplace = new ProductContracts.ProductMarketplace(wallet, productMarketplaceAddress);
        const product = await productMarketplace.products(productId);
        let basePrice: BigNumber = product.price;
        if (discountRuleId !== 0) {
            const discount = await this.getDiscount(productId, product.price, discountRuleId);
            basePrice = discount.price;
            if (discount.id === 0) discountRuleId = 0;
        }
        const amount = product.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(product.priceDuration);
        let tokenInAmount: BigNumber;
        if (referrer) {
            let campaign = await commission.getCampaign({ campaignId: productId, returnArrays: true });
            const affiliates = (campaign?.affiliates || []).map(a => a.toLowerCase());
            if (affiliates.includes(referrer.toLowerCase())) {
                const commissionRate = Utils.fromDecimals(campaign.commissionRate, 6);
                tokenInAmount = new BigNumber(amount).dividedBy(new BigNumber(1).minus(commissionRate)).decimalPlaces(0, BigNumber.ROUND_DOWN);
            }
        }
        let receipt;
        try {
            this.registerSendTxEvents({
                transactionHash: callback,
                confirmation: confirmationCallback
            });
            if (product.token === Utils.nullAddress) {
                if (!tokenInAmount || tokenInAmount.isZero()) {
                    receipt = await productMarketplace.subscribe({
                        to: wallet.address,
                        productId: productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    }, amount)
                } else {
                    const txData = await productMarketplace.subscribe.txData({
                        to: wallet.address,
                        productId: productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    }, amount);
                    receipt = await commission.proxyCall({
                        affiliate: referrer,
                        campaignId: productId,
                        amount: tokenInAmount,
                        data: txData
                    }, tokenInAmount);
                }
            } else {
                if (!tokenInAmount || tokenInAmount.isZero()) {
                    receipt = await productMarketplace.subscribe({
                        to: wallet.address,
                        productId: productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    })
                } else {
                    const txData = await productMarketplace.subscribe.txData({
                        to: wallet.address,
                        productId: productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    });
                    receipt = await commission.proxyCall({
                        affiliate: referrer,
                        campaignId: productId,
                        amount: tokenInAmount,
                        data: txData
                    });
                }
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        return receipt;
    }

    async renewSubscription(
        productId: number,
        duration: number,
        discountRuleId: number = 0,
        callback?: any,
        confirmationCallback?: any
    ) {
        let productMarketplaceAddress = this.getContractAddress('ProductMarketplace');
        const wallet = Wallet.getClientInstance();
        const productMarketplace = new ProductContracts.ProductMarketplace(wallet, productMarketplaceAddress);
        const product = await productMarketplace.products(productId);
        const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, product.nft);
        let nftId = await subscriptionNFT.tokenOfOwnerByIndex({
            owner: wallet.address,
            index: 0
        });
        let basePrice: BigNumber = product.price;
        if (discountRuleId !== 0) {
            const discount = await this.getDiscount(productId, product.price, discountRuleId);
            basePrice = discount.price;
            if (discount.id === 0) discountRuleId = 0;
        }
        const amount = product.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(product.priceDuration);
        let receipt;
        try {
            this.registerSendTxEvents({
                transactionHash: callback,
                confirmation: confirmationCallback
            });
            if (product.token === Utils.nullAddress) {
                receipt = await productMarketplace.renewSubscription({
                    productId: productId,
                    nftId: nftId,
                    duration: duration,
                    discountRuleId: discountRuleId
                }, amount);
            } else {
                receipt = await productMarketplace.renewSubscription({
                    productId: productId,
                    nftId: nftId,
                    duration: duration,
                    discountRuleId: discountRuleId
                });
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        return receipt;
    }

    async updateDiscountRules(
        productId: number,
        rules: IDiscountRule[],
        ruleIdsToDelete: number[] = [],
        callback?: any,
        confirmationCallback?: any
    ) {
        let promotionAddress = this.getContractAddress('Promotion');
        if (!promotionAddress) throw new Error('Promotion contract not found');
        const wallet = Wallet.getClientInstance();
        const promotion = new ProductContracts.Promotion(wallet, promotionAddress);
        this.registerSendTxEvents({
            transactionHash: callback,
            confirmation: confirmationCallback
        });
        let receipt = await promotion.updateDiscountRules({
            productId,
            rules: rules || [],
            ruleIdsToDelete
        });
        return receipt;
    }

    async updateCommissionCampaign(
        productId: number,
        commissionRate: string,
        affiliates: string[],
        callback?: any,
        confirmationCallback?: any
    ) {
        let commissionAddress = this.getContractAddress('Commission');
        let productMarketplaceAddress = this.getContractAddress('ProductMarketplace');
        const wallet = Wallet.getClientInstance();
        const commission = new ProductContracts.Commission(wallet, commissionAddress);
        const productMarketplace = new ProductContracts.ProductMarketplace(wallet, productMarketplaceAddress);
        let selectors = ["subscribe"];
        selectors = selectors.map(e => e + "(" + productMarketplace._abi.filter(f => f.name == e)[0].inputs.map(f => f.type).join(',') + ")");
        selectors = selectors.map(e => wallet.soliditySha3(e).substring(0, 10));
        let campaign = {
            id: productId,
            affiliatesRequireApproval: true,
            selectors: selectors,
            commissionRate: Utils.toDecimals(commissionRate, 6),
            affiliates: affiliates
        };
        let receipt;
        try {
            this.registerSendTxEvents({
                transactionHash: callback,
                confirmation: confirmationCallback
            });
            receipt = await commission.updateCampaign(campaign);
        }
        catch (err) {
            console.error(err);
        }
        return receipt;
    }
}