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
define("@scom/scom-ton-subscription/model.ts", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet"], function (require, exports, components_2, eth_wallet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SubscriptionModel = void 0;
    class SubscriptionModel {
        constructor() {
            this._durationUnits = [
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
            this._wallets = [
                {
                    name: 'tonwallet'
                }
            ];
        }
        get wallets() {
            return this._wallets;
        }
        get durationUnits() {
            return this._durationUnits;
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
        async initWallet() { }
        async connectWallet() { }
        isClientWalletConnected() {
            return false;
        }
        async getProductInfo(productId) {
            return {
                productType: new eth_wallet_1.BigNumber(1),
                productId: new eth_wallet_1.BigNumber(13),
                uri: "",
                quantity: new eth_wallet_1.BigNumber(10000),
                price: new eth_wallet_1.BigNumber(1000),
                maxQuantity: new eth_wallet_1.BigNumber(10000),
                maxPrice: new eth_wallet_1.BigNumber(0),
                token: {
                    "name": "Tether USD",
                    "address": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
                    "symbol": "USDT.e",
                    "decimals": 6,
                    "chainId": 43113
                },
                status: new eth_wallet_1.BigNumber(1),
                nft: "0x0075Fb0A3f94B32f8F3aF08AD6D93b1F45437501",
                nftId: new eth_wallet_1.BigNumber(0),
                priceDuration: new eth_wallet_1.BigNumber(86400)
            };
        }
        async getDiscountRules(productId) {
            let discountRules = [];
            return discountRules;
        }
        async subscribe(productId, startTime, duration, referrer, discountRuleId = 0, callback, confirmationCallback) { }
        async renewSubscription(productId, duration, discountRuleId = 0, callback, confirmationCallback) { }
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
            this.pnlBody.visible = true;
        }
        async setData(data) {
            this.showLoading();
            this._data = data;
            this.discountRules = [];
            this.subscriptionModel.initWallet();
            this.edtStartDate.value = undefined;
            this.edtDuration.value = '';
            this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
            await this.refreshDApp();
            this.hideLoading();
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
            const data = {
                wallets: this.subscriptionModel.wallets,
                networks: [],
                showHeader: true,
            };
            if (this.containerDapp?.setData)
                await this.containerDapp.setData(data);
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
