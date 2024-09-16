var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-ton-subscription/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inputStyle = void 0;
    exports.inputStyle = components_1.Styles.style({
        $nest: {
            '> input': {
                textAlign: 'right'
            }
        }
    });
});
define("@scom/scom-ton-subscription/interface.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("@scom/scom-ton-subscription/model.ts", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-product-contract", "@scom/scom-network-list", "@scom/scom-token-list"], function (require, exports, components_2, eth_wallet_1, scom_product_contract_1, scom_network_list_1, scom_token_list_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SubscriptionModel = void 0;
    class SubscriptionModel {
        constructor() {
            this.rpcWalletId = '';
            this.networkMap = {};
            this.infuraId = 'adc596bf88b648e2a8902bc9093930c5';
            this.contractInfoByChain = [
                {
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
                }
            ];
        }
        get wallets() {
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
        getContractAddress(type, chainId) {
            const contracts = this.contractInfoByChain[chainId] || {};
            return contracts[type]?.address;
        }
        getRpcWallet() {
            return this.rpcWalletId ? eth_wallet_1.Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
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
            };
        }
        getDurationInDays(duration, unit, startDate) {
            if (unit === 'days') {
                return duration;
            }
            else {
                const dateFormat = 'YYYY-MM-DD';
                const start = startDate ? (0, components_2.moment)(startDate.format(dateFormat), dateFormat) : (0, components_2.moment)();
                const end = (0, components_2.moment)(start).add(duration, unit);
                const diff = end.diff(start, 'days');
                return diff;
            }
        }
        formatNumber(value, decimalFigures) {
            if (typeof value === 'object') {
                value = value.toFixed();
            }
            const minValue = '0.0000001';
            return components_2.FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
        }
        ;
        async initWallet() {
            await eth_wallet_1.Wallet.getClientInstance().init();
        }
        async connectWallet() { }
        isClientWalletConnected() {
            return false;
        }
        initRpcWallet(defaultChainId) {
            if (this.rpcWalletId) {
                return this.rpcWalletId;
            }
            const clientWallet = eth_wallet_1.Wallet.getClientInstance();
            const networkList = Object.values(components_2.application.store?.networkMap || []);
            const instanceId = clientWallet.initRpcWallet({
                networks: networkList,
                defaultChainId,
                infuraId: components_2.application.store?.infuraId,
                multicalls: components_2.application.store?.multicalls
            });
            this.rpcWalletId = instanceId;
            if (clientWallet.address) {
                const rpcWallet = eth_wallet_1.Wallet.getRpcWalletInstance(instanceId);
                rpcWallet.address = clientWallet.address;
            }
            const defaultNetworkList = (0, scom_network_list_1.default)();
            const defaultNetworkMap = defaultNetworkList.reduce((acc, cur) => {
                acc[cur.chainId] = cur;
                return acc;
            }, {});
            for (let network of networkList) {
                const networkInfo = defaultNetworkMap[network.chainId];
                if (!networkInfo)
                    continue;
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
        async getTokenInfo(address, chainId) {
            let token;
            const wallet = eth_wallet_1.Wallet.getClientInstance();
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
                    };
                }
            }
            return token;
        }
        async getProductInfo(productId) {
            const wallet = this.getRpcWallet();
            const chainId = wallet.chainId;
            const productMarketplaceAddress = this.getContractAddress('ProductMarketplace', chainId);
            if (!productMarketplaceAddress)
                return null;
            try {
                const productMarketplace = new scom_product_contract_1.Contracts.ProductMarketplace(wallet, productMarketplaceAddress);
                const product = await productMarketplace.products(productId);
                const chainId = wallet.chainId;
                if (product.token && product.token === eth_wallet_1.Utils.nullAddress) {
                    let net = (0, scom_network_list_1.default)().find(net => net.chainId === chainId);
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
                const _tokenList = scom_token_list_1.tokenStore.getTokenList(chainId);
                let token = _tokenList.find(token => product.token && token.address && token.address.toLowerCase() === product.token.toLowerCase());
                if (!token && product.token) {
                    token = await this.getTokenInfo(product.token, chainId);
                }
                return {
                    ...product,
                    token
                };
            }
            catch {
                return null;
            }
        }
        async getProductId(nftAddress) {
            let productId;
            try {
                const wallet = this.getRpcWallet();
                const subscriptionNFT = new scom_product_contract_1.Contracts.SubscriptionNFT(wallet, nftAddress);
                productId = (await subscriptionNFT.productId()).toNumber();
            }
            catch (err) {
                console.log("product id not found");
                console.error(err);
            }
            return productId;
        }
        async getDiscountRules(productId) {
            let discountRules = [];
            const wallet = this.getRpcWallet();
            const chainId = wallet.chainId;
            const promotionAddress = this.getContractAddress('Promotion', chainId);
            if (!promotionAddress)
                return discountRules;
            try {
                const promotion = new scom_product_contract_1.Contracts.Promotion(wallet, promotionAddress);
                const ruleCount = await promotion.getDiscountRuleCount(productId);
                let contractCalls = [];
                for (let i = 0; i < ruleCount.toNumber(); i++) {
                    contractCalls.push({
                        contract: promotion,
                        methodName: 'discountRules',
                        params: [productId, i],
                        to: promotionAddress
                    });
                }
                if (contractCalls.length === 0)
                    return discountRules;
                const multicallResults = await wallet.doMulticall(contractCalls);
                for (let i = 0; i < multicallResults.length; i++) {
                    const multicallResult = multicallResults[i];
                    if (!multicallResult)
                        continue;
                    const discountRule = multicallResult;
                    discountRules.push({
                        id: discountRule.id.toNumber(),
                        minDuration: discountRule.minDuration,
                        discountPercentage: discountRule.discountPercentage.toNumber(),
                        fixedPrice: eth_wallet_1.Utils.fromDecimals(discountRule.fixedPrice),
                        startTime: discountRule.startTime.toNumber(),
                        endTime: discountRule.endTime.toNumber(),
                        discountApplication: discountRule.discountApplication.toNumber()
                    });
                }
            }
            catch (err) {
                console.error('failed to get discount rules');
            }
            return discountRules;
        }
        async subscribe(productId, startTime, duration, referrer, discountRuleId = 0, callback, confirmationCallback) { }
        async renewSubscription(productId, duration, discountRuleId = 0, callback, confirmationCallback) { }
        async updateDiscountRules(productId, rules, ruleIdsToDelete = [], callback, confirmationCallback) { }
        async updateCommissionCampaign(productId, commissionRate, affiliates, callback, confirmationCallback) { }
    }
    exports.SubscriptionModel = SubscriptionModel;
});
define("@scom/scom-ton-subscription", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-ton-subscription/index.css.ts", "@scom/scom-ton-subscription/model.ts"], function (require, exports, components_3, eth_wallet_2, index_css_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_3.Styles.Theme.ThemeVars;
    let ScomTonSubscription = class ScomTonSubscription extends components_3.Module {
        constructor() {
            super(...arguments);
            this._isRenewal = false;
            this._data = {
                wallets: [],
                networks: [],
                defaultChainId: 0
            };
            this.showTxStatusModal = (status, content, exMessage) => {
                if (!this.txStatusModal)
                    return;
                let params = { status };
                if (status === 'success') {
                    params.txtHash = content;
                }
                else {
                    params.content = content;
                }
                if (exMessage) {
                    params.exMessage = exMessage;
                }
                this.txStatusModal.message = { ...params };
                this.txStatusModal.showModal();
            };
        }
        get isRenewal() {
            return this._isRenewal;
        }
        set isRenewal(value) {
            this._isRenewal = value;
        }
        get renewalDate() {
            return this._renewalDate;
        }
        set renewalDate(value) {
            this._renewalDate = value;
            if (this.productInfo) {
                this.edtStartDate.value = value > 0 ? (0, components_3.moment)(value * 1000) : (0, components_3.moment)();
                this.onDurationChanged();
            }
        }
        get duration() {
            return Number(this.edtDuration.value) || 0;
        }
        get durationUnit() {
            return (this.comboDurationUnit.selectedItem?.value || 'days');
        }
        showLoading() {
            this.pnlLoading.visible = true;
            this.pnlBody.visible = false;
        }
        hideLoading() {
            this.pnlLoading.visible = false;
            this.pnlBody.visible = !this.pnlUnsupportedNetwork.visible;
        }
        getConfigurators() {
            const defaultData = this.subscriptionModel.getDefaultData();
            return [
                {
                    name: 'Builder Configurator',
                    target: 'Builders',
                    getData: this.getData.bind(this),
                    setData: async (data) => {
                        await this.setData({ ...defaultData, ...data });
                    },
                    setupData: async (data) => {
                        this._data = { ...data };
                        this.subscriptionModel.initWallet();
                        if (!this.subscriptionModel.isClientWalletConnected()) {
                            this.subscriptionModel.connectWallet();
                            return;
                        }
                        let productId = await this.subscriptionModel.getProductId(this._data.nftAddress);
                        if (productId) {
                            this._data.productId = productId;
                            this.productInfo = await this.subscriptionModel.getProductInfo(this._data.productId);
                            this._data.priceToMint = eth_wallet_2.Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals).toNumber();
                            this._data.tokenToMint = this.productInfo.token.address;
                            this._data.durationInDays = Math.ceil((this.productInfo.priceDuration?.toNumber() || 0) / 86400);
                        }
                        return true;
                    },
                    updateDiscountRules: async (productId, rules, ruleIdsToDelete = []) => {
                        return new Promise(async (resolve, reject) => {
                            const callback = (err, receipt) => {
                                if (err) {
                                    this.showTxStatusModal('error', err);
                                }
                            };
                            const confirmationCallback = async (receipt) => {
                                const discountRules = await this.subscriptionModel.getDiscountRules(this._data.productId);
                                resolve(discountRules);
                            };
                            try {
                                await this.subscriptionModel.updateDiscountRules(productId, rules, ruleIdsToDelete, callback, confirmationCallback);
                            }
                            catch (error) {
                                this.showTxStatusModal('error', 'Something went wrong updating discount rule!');
                                console.log('updateDiscountRules', error);
                                reject(error);
                            }
                        });
                    },
                    updateCommissionCampaign: async (productId, commissionRate, affiliates) => {
                        return new Promise(async (resolve, reject) => {
                            const callback = (err, receipt) => {
                                if (err) {
                                    this.showTxStatusModal('error', err);
                                }
                            };
                            const confirmationCallback = async (receipt) => {
                                resolve(true);
                            };
                            try {
                                await this.subscriptionModel.updateCommissionCampaign(productId, commissionRate, affiliates, callback, confirmationCallback);
                            }
                            catch (error) {
                                this.showTxStatusModal('error', 'Something went wrong updating commission campaign!');
                                console.log('updateCommissionCampaign', error);
                                reject(error);
                            }
                        });
                    },
                    getTag: this.getTag.bind(this),
                    setTag: this.setTag.bind(this)
                },
            ];
        }
        async resetRpcWallet() {
            await this.subscriptionModel.initRpcWallet(this._data.chainId || this._data.defaultChainId);
            const chainId = this._data.chainId;
            const data = {
                defaultChainId: chainId || this._data.defaultChainId,
                wallets: this.subscriptionModel.wallets,
                networks: chainId ? [{ chainId: chainId }] : this._data.networks,
                showHeader: false,
                rpcWalletId: this.subscriptionModel.getRpcWallet().instanceId
            };
            if (this.containerDapp?.setData)
                await this.containerDapp.setData(data);
        }
        getData() {
            return this._data;
        }
        async setData(data) {
            this.showLoading();
            this._data = data;
            this.discountRules = [];
            this.edtStartDate.value = undefined;
            this.edtDuration.value = '';
            this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
            await this.resetRpcWallet();
            await this.subscriptionModel.initWallet();
            if (!this._data.productId && this._data.nftAddress) {
                let productId = await this.subscriptionModel.getProductId(this._data.nftAddress);
                if (productId)
                    this._data.productId = productId;
            }
            await this.refreshDApp();
            this.hideLoading();
        }
        getTag() {
            return this.tag;
        }
        updateTag(type, value) {
            this.tag[type] = this.tag[type] ?? {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.tag[type][prop] = value[prop];
            }
        }
        async setTag(value) {
            const newValue = value || {};
            if (!this.tag)
                this.tag = {};
            for (let prop in newValue) {
                if (newValue.hasOwnProperty(prop)) {
                    if (prop === 'light' || prop === 'dark')
                        this.updateTag(prop, newValue[prop]);
                    else
                        this.tag[prop] = newValue[prop];
                }
            }
            if (this.containerDapp)
                this.containerDapp.setTag(this.tag);
            this.updateTheme();
        }
        updateStyle(name, value) {
            value ?
                this.style.setProperty(name, value) :
                this.style.removeProperty(name);
        }
        updateTheme() {
            const themeVar = this.containerDapp?.theme || 'dark';
            this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
            this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
            this.updateStyle('--input-font_color', this.tag[themeVar]?.inputFontColor);
            this.updateStyle('--input-background', this.tag[themeVar]?.inputBackgroundColor);
            this.updateStyle('--colors-primary-main', this.tag[themeVar]?.buttonBackgroundColor);
        }
        async refreshDApp() {
            try {
                this.determineBtnSubmitCaption();
                this.productInfo = await this.subscriptionModel.getProductInfo(this._data.productId);
                if (this.productInfo) {
                    this.discountRules = await this.subscriptionModel.getDiscountRules(this._data.productId);
                    this.pnlBody.visible = true;
                    this.pnlUnsupportedNetwork.visible = false;
                    this.edtStartDate.value = this.isRenewal && this.renewalDate ? (0, components_3.moment)(this.renewalDate * 1000) : (0, components_3.moment)();
                    this.pnlStartDate.visible = !this.isRenewal;
                    this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY');
                    this.lblStartDate.visible = this.isRenewal;
                    const rule = this._data.discountRuleId ? this.discountRules.find(rule => rule.id === this._data.discountRuleId) : null;
                    const isExpired = rule && rule.endTime && rule.endTime < (0, components_3.moment)().unix();
                    if (isExpired)
                        this._data.discountRuleId = undefined;
                    if (rule && !isExpired) {
                        if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                            this.edtStartDate.value = (0, components_3.moment)(rule.startTime * 1000);
                        }
                        this.edtDuration.value = rule.minDuration.div(86400).toNumber();
                        this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
                        this.discountApplied = rule;
                        this._updateEndDate();
                        this._updateTotalAmount();
                    }
                    else {
                        this.edtDuration.value = Math.ceil((this.productInfo.priceDuration?.toNumber() || 0) / 86400);
                        this.onDurationChanged();
                    }
                }
                else {
                    this.pnlBody.visible = false;
                    this.pnlUnsupportedNetwork.visible = true;
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        _updateEndDate() {
            if (!this.edtStartDate.value) {
                this.lblEndDate.caption = '-';
                return;
            }
            const dateFormat = 'YYYY-MM-DD';
            const startDate = (0, components_3.moment)(this.edtStartDate.value.format(dateFormat), dateFormat);
            this.lblEndDate.caption = startDate.add(this.duration, this.durationUnit).format('DD/MM/YYYY');
        }
        _updateDiscount() {
            this.discountApplied = undefined;
            if (!this.discountRules?.length || !this.duration || !this.edtStartDate.value)
                return;
            const price = eth_wallet_2.Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals);
            const startTime = this.edtStartDate.value.unix();
            const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
            const durationInSec = days * 86400;
            let discountAmount;
            for (let rule of this.discountRules) {
                if (rule.discountApplication === 0 && this.isRenewal)
                    continue;
                if (rule.discountApplication === 1 && !this.isRenewal)
                    continue;
                if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration.gt(durationInSec))
                    continue;
                let basePrice = price;
                if (rule.discountPercentage > 0) {
                    basePrice = price.times(1 - rule.discountPercentage / 100);
                }
                else if (rule.fixedPrice.gt(0)) {
                    basePrice = rule.fixedPrice;
                }
                let tmpDiscountAmount = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
                if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                    this.discountApplied = rule;
                    discountAmount = tmpDiscountAmount;
                }
            }
        }
        _updateTotalAmount() {
            const duration = Number(this.edtDuration.value) || 0;
            if (!duration)
                this.lblOrderTotal.caption = `0 ${this.productInfo.token?.symbol || ''}`;
            const price = this.productInfo.price;
            let basePrice = price;
            this.pnlDiscount.visible = false;
            if (this.discountApplied) {
                if (this.discountApplied.discountPercentage > 0) {
                    basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
                    this.lblDiscount.caption = `Discount (${this.discountApplied.discountPercentage}% off)`;
                    this.pnlDiscount.visible = true;
                }
                else if (this.discountApplied.fixedPrice.gt(0)) {
                    basePrice = this.discountApplied.fixedPrice;
                    this.lblDiscount.caption = "Discount";
                    this.pnlDiscount.visible = true;
                }
            }
            const pricePerDay = basePrice.div(this.productInfo.priceDuration.div(86400));
            const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
            const amountRaw = pricePerDay.times(days);
            const amount = eth_wallet_2.Utils.fromDecimals(amountRaw, this.productInfo.token.decimals);
            this.tokenAmountIn = amount.toFixed();
            if (this.discountApplied) {
                const discountAmountRaw = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
                const discountAmount = eth_wallet_2.Utils.fromDecimals(discountAmountRaw, this.productInfo.token.decimals);
                this.lblDiscountAmount.caption = `-${this.subscriptionModel.formatNumber(discountAmount, 6)} ${this.productInfo.token?.symbol || ''}`;
            }
            this.lblOrderTotal.caption = `${this.subscriptionModel.formatNumber(amount, 6)} ${this.productInfo.token?.symbol || ''}`;
        }
        onStartDateChanged() {
            this._updateEndDate();
            this._updateDiscount();
        }
        onDurationChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        onDurationUnitChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        updateSubmitButton(submitting) {
            this.btnSubmit.rightIcon.spin = submitting;
            this.btnSubmit.rightIcon.visible = submitting;
        }
        determineBtnSubmitCaption() {
            if (!this.subscriptionModel.isClientWalletConnected()) {
                this.btnSubmit.caption = 'Connect Wallet';
                this.btnSubmit.enabled = true;
            }
            else {
                this.btnSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
            }
        }
        async onSubmit() {
            if (!this.subscriptionModel.isClientWalletConnected()) {
                this.subscriptionModel.connectWallet();
                return;
            }
            this.doSubmitAction();
        }
        async doSubmitAction() {
            if (!this._data || !this._data.productId)
                return;
            if (!this.edtStartDate.value) {
                this.showTxStatusModal('error', 'Start Date Required');
                return;
            }
            if (!this.edtDuration.value || this.duration <= 0 || !Number.isInteger(this.duration)) {
                this.showTxStatusModal('error', !this.edtDuration.value ? 'Duration Required' : 'Invalid Duration');
                return;
            }
            this.updateSubmitButton(true);
            const callback = (error, receipt) => {
                if (error) {
                    this.showTxStatusModal('error', error);
                }
            };
            const startTime = this.edtStartDate.value.unix();
            const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
            const duration = days * 86400;
            const confirmationCallback = async () => {
                this.productInfo = await this.subscriptionModel.getProductInfo(this._data.productId);
                if (this.onSubscribe)
                    this.onSubscribe();
            };
            if (this.isRenewal) {
                await this.subscriptionModel.renewSubscription(this._data.productId, duration, this.discountApplied?.id ?? 0, callback, confirmationCallback);
            }
            else {
                await this.subscriptionModel.subscribe(this._data.productId, startTime, duration, this._data.referrer, this.discountApplied?.id ?? 0, callback, confirmationCallback);
            }
        }
        async init() {
            super.init();
            this.subscriptionModel = new model_1.SubscriptionModel();
            const durationUnits = this.subscriptionModel.durationUnits;
            this.comboDurationUnit.items = durationUnits;
            this.comboDurationUnit.selectedItem = durationUnits[0];
        }
        render() {
            return (this.$render("i-panel", null,
                this.$render("i-scom-dapp-container", { id: "containerDapp" },
                    this.$render("i-panel", { background: { color: Theme.background.main } },
                        this.$render("i-stack", { id: "pnlLoading", direction: "vertical", height: "100%", alignItems: "center", justifyContent: "center", padding: { top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }, visible: false },
                            this.$render("i-panel", { class: 'spinner' })),
                        this.$render("i-stack", { direction: "vertical", padding: { top: '1.5rem', bottom: '1.25rem', left: '1.25rem', right: '1.5rem' }, alignItems: "center" },
                            this.$render("i-stack", { direction: "vertical", width: "100%", maxWidth: 600, gap: '0.5rem' },
                                this.$render("i-stack", { id: "pnlBody", direction: "vertical", gap: "0.5rem" },
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Starts", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-panel", { id: "pnlStartDate", width: "50%" },
                                            this.$render("i-datepicker", { id: "edtStartDate", height: 36, width: "100%", type: "date", placeholder: "dd/mm/yyyy", background: { color: Theme.input.background }, font: { size: '1rem' }, border: { radius: "0.375rem" }, onChanged: this.onStartDateChanged })),
                                        this.$render("i-label", { id: "lblStartDate", font: { size: '1rem' }, visible: false })),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Duration", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-stack", { direction: "horizontal", width: "50%", alignItems: "center", gap: "0.5rem" },
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-input", { id: "edtDuration", height: 36, width: "100%", class: index_css_1.inputStyle, inputType: 'number', font: { size: '1rem' }, border: { radius: 4, style: 'none' }, padding: { top: '0.25rem', bottom: '0.25rem', left: '0.5rem', right: '0.5rem' }, onChanged: this.onDurationChanged })),
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-combo-box", { id: "comboDurationUnit", height: 36, width: "100%", icon: { width: 14, height: 14, name: 'angle-down', fill: Theme.divider }, border: { width: 1, style: 'solid', color: Theme.divider, radius: 5 }, onChanged: this.onDurationUnitChanged })))),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Ends", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblEndDate", font: { size: '1rem' } })),
                                    this.$render("i-stack", { id: "pnlDiscount", direction: "horizontal", width: "100%", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", lineHeight: 1.5, visible: false },
                                        this.$render("i-label", { id: "lblDiscount", caption: "Discount", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblDiscountAmount", font: { size: '1rem' } })),
                                    this.$render("i-stack", { width: "100%", direction: "horizontal", justifyContent: "space-between", alignItems: 'center', gap: "0.5rem", lineHeight: 1.5 },
                                        this.$render("i-stack", { direction: "horizontal", alignItems: 'center', gap: "0.5rem" },
                                            this.$render("i-label", { caption: 'You are going to pay', font: { bold: true, size: '1rem' } }),
                                            this.$render("i-icon", { id: "iconOrderTotal", width: 20, height: 20, name: "question-circle", fill: Theme.background.modal, tooltip: { content: 'A commission fee of 0% will be applied to the amount you input.' } })),
                                        this.$render("i-label", { id: 'lblOrderTotal', font: { size: '1rem' }, caption: "0" })),
                                    this.$render("i-stack", { direction: "vertical", width: "100%", justifyContent: "center", alignItems: "center", margin: { top: '0.5rem' }, gap: 8 },
                                        this.$render("i-button", { id: 'btnSubmit', width: '100%', caption: 'Subscribe', padding: { top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }, font: { size: '1rem', color: Theme.colors.primary.contrastText, bold: true }, rightIcon: { visible: false, fill: Theme.colors.primary.contrastText }, background: { color: Theme.background.gradient }, border: { radius: 12 }, onClick: this.onSubmit, enabled: false }))),
                                this.$render("i-stack", { id: 'pnlUnsupportedNetwork', direction: "vertical", alignItems: "center", visible: false },
                                    this.$render("i-label", { caption: 'This network or this token is not supported.', font: { size: '1.5rem' } })))),
                        this.$render("i-scom-tx-status-modal", { id: "txStatusModal" })))));
        }
    };
    ScomTonSubscription = __decorate([
        (0, components_3.customElements)('i-scom-ton-subscription')
    ], ScomTonSubscription);
    exports.default = ScomTonSubscription;
});
