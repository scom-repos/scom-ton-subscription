import {
    Button,
    ComboBox,
    ControlElement,
    customElements,
    Datepicker,
    IComboItem,
    Icon,
    Input,
    Label,
    Module,
    moment,
    Panel,
    StackLayout,
    Styles,
} from '@ijstech/components';
import { BigNumber, Utils } from '@ijstech/eth-wallet';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';
import { inputStyle } from './index.css';
import { IDiscountRule, IProductInfo, ITonSubscription } from './interface';
import { SubscriptionModel } from './model';

const Theme = Styles.Theme.ThemeVars;

interface ScomTonSubscriptionElement extends ControlElement { }

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ["i-scom-ton-subscription"]: ScomTonSubscriptionElement;
        }
    }
}

@customElements('i-scom-ton-subscription')
export default class ScomTonSubscription extends Module {
    private containerDapp: ScomDappContainer;
    private pnlLoading: StackLayout;
    private pnlBody: StackLayout;
    private pnlStartDate: Panel;
    private edtStartDate: Datepicker;
    private lblStartDate: Label;
    private edtDuration: Input;
    private comboDurationUnit: ComboBox;
    private lblEndDate: Label;
    private txStatusModal: ScomTxStatusModal;
    private pnlDiscount: StackLayout;
    private lblDiscount: Label;
    private lblDiscountAmount: Label;
    private lblOrderTotal: Label;
    private iconOrderTotal: Icon;
    private btnSubmit: Button;
    private pnlUnsupportedNetwork: StackLayout;

    private subscriptionModel: SubscriptionModel;
    private productInfo: IProductInfo;
    private discountRules: IDiscountRule[];
    private discountApplied: IDiscountRule;
    private _isRenewal = false;
    private _renewalDate: number;
    private tokenAmountIn: string;
    private _data: ITonSubscription = {
        wallets: [],
        networks: [],
        defaultChainId: 0
    };
    public onSubscribe: () => void;

    get isRenewal() {
        return this._isRenewal;
    }
    set isRenewal(value: boolean) {
        this._isRenewal = value;
    }

    get renewalDate() {
        return this._renewalDate;
    }
    set renewalDate(value: number) {
        this._renewalDate = value;
        if (this.productInfo) {
            this.edtStartDate.value = value > 0 ? moment(value * 1000) : moment();
            this.onDurationChanged();
        }
    }

    private get duration() {
        return Number(this.edtDuration.value) || 0;
    }

    private get durationUnit() {
        return ((this.comboDurationUnit.selectedItem as IComboItem)?.value || 'days') as 'days' | 'months' | 'years';
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
                setData: async (data: ITonSubscription) => {
                    await this.setData({ ...defaultData, ...data });
                },
                setupData: async (data: ITonSubscription) => {
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
                        this._data.priceToMint = Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals).toNumber();
                        this._data.tokenToMint = this.productInfo.token.address;
                        this._data.durationInDays = Math.ceil((this.productInfo.priceDuration?.toNumber() || 0) / 86400);
                    }
                    return true;
                },
                updateDiscountRules: async (productId: number, rules: IDiscountRule[], ruleIdsToDelete: number[] = []) => {
                    return new Promise(async (resolve, reject) => {
                        const callback = (err: Error, receipt?: string) => {
                            if (err) {
                                this.showTxStatusModal('error', err);
                            }
                        };
                        const confirmationCallback = async (receipt: any) => {
                            const discountRules = await this.subscriptionModel.getDiscountRules(this._data.productId);
                            resolve(discountRules);
                        };
                        try {
                            await this.subscriptionModel.updateDiscountRules(productId, rules, ruleIdsToDelete, callback, confirmationCallback);
                        } catch (error) {
                            this.showTxStatusModal('error', 'Something went wrong updating discount rule!');
                            console.log('updateDiscountRules', error);
                            reject(error);
                        }
                    });
                },
                updateCommissionCampaign: async (productId: number, commissionRate: string, affiliates: string[]) => {
                    return new Promise(async (resolve, reject) => {
                        const callback = (err: Error, receipt?: string) => {
                            if (err) {
                                this.showTxStatusModal('error', err);
                            }
                        };
                        const confirmationCallback = async (receipt: any) => {
                            resolve(true);
                        };
                        try {
                            await this.subscriptionModel.updateCommissionCampaign(productId, commissionRate, affiliates, callback, confirmationCallback);
                        } catch (error) {
                            this.showTxStatusModal('error', 'Something went wrong updating commission campaign!');
                            console.log('updateCommissionCampaign', error);
                            reject(error);
                        }
                    });
                },
                getTag: this.getTag.bind(this),
                setTag: this.setTag.bind(this)
            },
        ]
    }

    private async resetRpcWallet() {
        await this.subscriptionModel.initRpcWallet(this._data.chainId || this._data.defaultChainId);
        const chainId = this._data.chainId;
        const data = {
            defaultChainId: chainId || this._data.defaultChainId,
            wallets: this.subscriptionModel.wallets,
            networks: chainId ? [{ chainId: chainId }] : this._data.networks,
            showHeader: false,
            rpcWalletId: this.subscriptionModel.getRpcWallet().instanceId
        }
        if (this.containerDapp?.setData) await this.containerDapp.setData(data);
    }

    private getData() {
        return this._data;
    }

    private async setData(data: ITonSubscription) {
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
          if (productId) this._data.productId = productId;
        }
        await this.refreshDApp();
        this.hideLoading();
    }

    private getTag() {
      return this.tag;
    }
  
    private updateTag(type: 'light' | 'dark', value: any) {
      this.tag[type] = this.tag[type] ?? {};
      for (let prop in value) {
        if (value.hasOwnProperty(prop))
          this.tag[type][prop] = value[prop];
      }
    }
  
    private async setTag(value: any) {
      const newValue = value || {};
      if (!this.tag) this.tag = {}
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

    private updateStyle(name: string, value: any) {
      value ?
        this.style.setProperty(name, value) :
        this.style.removeProperty(name);
    }
  
    private updateTheme() {
      const themeVar = this.containerDapp?.theme || 'dark';
      this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
      this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
      this.updateStyle('--input-font_color', this.tag[themeVar]?.inputFontColor);
      this.updateStyle('--input-background', this.tag[themeVar]?.inputBackgroundColor);
      this.updateStyle('--colors-primary-main', this.tag[themeVar]?.buttonBackgroundColor);
    }

    private async refreshDApp() {
        try {
            this.determineBtnSubmitCaption();
            this.productInfo = await this.subscriptionModel.getProductInfo(this._data.productId);
            if (this.productInfo) {
                this.discountRules = await this.subscriptionModel.getDiscountRules(this._data.productId);
                this.pnlBody.visible = true;
                this.pnlUnsupportedNetwork.visible = false;
                this.edtStartDate.value = this.isRenewal && this.renewalDate ? moment(this.renewalDate * 1000) : moment();
                this.pnlStartDate.visible = !this.isRenewal;
                this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY');
                this.lblStartDate.visible = this.isRenewal;
                const rule = this._data.discountRuleId ? this.discountRules.find(rule => rule.id === this._data.discountRuleId) : null;
                const isExpired = rule && rule.endTime && rule.endTime < moment().unix();
                if (isExpired) this._data.discountRuleId = undefined;
                if (rule && !isExpired) {
                    if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                        this.edtStartDate.value = moment(rule.startTime * 1000);
                    }
                    this.edtDuration.value = rule.minDuration.div(86400).toNumber();
                    this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
                    this.discountApplied = rule;
                    this._updateEndDate();
                    this._updateTotalAmount();
                } else {
                    this.edtDuration.value = Math.ceil((this.productInfo.priceDuration?.toNumber() || 0) / 86400);
                    this.onDurationChanged();
                }
            } else {
                this.pnlBody.visible = false;
                this.pnlUnsupportedNetwork.visible = true;
            }
        } catch (error) {
            console.error(error);
        }
    }

    private _updateEndDate() {
        if (!this.edtStartDate.value) {
            this.lblEndDate.caption = '-';
            return;
        }
        const dateFormat = 'YYYY-MM-DD';
        const startDate = moment(this.edtStartDate.value.format(dateFormat), dateFormat);
        this.lblEndDate.caption = startDate.add(this.duration, this.durationUnit).format('DD/MM/YYYY');
    }

    private _updateDiscount() {
        this.discountApplied = undefined;
        if (!this.discountRules?.length || !this.duration || !this.edtStartDate.value) return;
        const price = Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals);
        const startTime = this.edtStartDate.value.unix();
        const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        const durationInSec = days * 86400;
        let discountAmount: BigNumber;
        for (let rule of this.discountRules) {
            if (rule.discountApplication === 0 && this.isRenewal) continue;
            if (rule.discountApplication === 1 && !this.isRenewal) continue;
            if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration.gt(durationInSec)) continue;
            let basePrice: BigNumber = price;
            if (rule.discountPercentage > 0) {
                basePrice = price.times(1 - rule.discountPercentage / 100)
            } else if (rule.fixedPrice.gt(0)) {
                basePrice = rule.fixedPrice;
            }
            let tmpDiscountAmount = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
            if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                this.discountApplied = rule;
                discountAmount = tmpDiscountAmount;
            }
        }
    }

    private _updateTotalAmount() {
        const duration = Number(this.edtDuration.value) || 0;
        if (!duration) this.lblOrderTotal.caption = `0 ${this.productInfo.token?.symbol || ''}`;
        const price = this.productInfo.price;
        let basePrice: BigNumber = price;
        this.pnlDiscount.visible = false;
        if (this.discountApplied) {
            if (this.discountApplied.discountPercentage > 0) {
                basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
                this.lblDiscount.caption = `Discount (${this.discountApplied.discountPercentage}% off)`;
                this.pnlDiscount.visible = true;
            } else if (this.discountApplied.fixedPrice.gt(0)) {
                basePrice = this.discountApplied.fixedPrice as BigNumber;
                this.lblDiscount.caption = "Discount";
                this.pnlDiscount.visible = true;
            }
        }
        const pricePerDay = basePrice.div(this.productInfo.priceDuration.div(86400));
        const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        const amountRaw = pricePerDay.times(days);
        const amount = Utils.fromDecimals(amountRaw, this.productInfo.token.decimals);
        this.tokenAmountIn = amount.toFixed();
        if (this.discountApplied) {
            const discountAmountRaw = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
            const discountAmount = Utils.fromDecimals(discountAmountRaw, this.productInfo.token.decimals);
            this.lblDiscountAmount.caption = `-${this.subscriptionModel.formatNumber(discountAmount, 6)} ${this.productInfo.token?.symbol || ''}`;
        }
        this.lblOrderTotal.caption = `${this.subscriptionModel.formatNumber(amount, 6)} ${this.productInfo.token?.symbol || ''}`;
    }

    private onStartDateChanged() {
        this._updateEndDate();
        this._updateDiscount();
    }

    private onDurationChanged() {
        this._updateEndDate();
        this._updateDiscount();
        this._updateTotalAmount();
    }

    private onDurationUnitChanged() {
        this._updateEndDate();
        this._updateDiscount();
        this._updateTotalAmount();
    }

    private updateSubmitButton(submitting: boolean) {
        this.btnSubmit.rightIcon.spin = submitting;
        this.btnSubmit.rightIcon.visible = submitting;
    }

    private determineBtnSubmitCaption() {
        if (!this.subscriptionModel.isClientWalletConnected()) {
            this.btnSubmit.caption = 'Connect Wallet';
            this.btnSubmit.enabled = true;
        }
        else {
            this.btnSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
        }
    }

    private showTxStatusModal = (status: 'warning' | 'success' | 'error', content?: string | Error, exMessage?: string) => {
        if (!this.txStatusModal) return;
        let params: any = { status };
        if (status === 'success') {
            params.txtHash = content;
        } else {
            params.content = content;
        }
        if (exMessage) {
            params.exMessage = exMessage;
        }
        this.txStatusModal.message = { ...params };
        this.txStatusModal.showModal();
    }

    private async onSubmit() {
        if (!this.subscriptionModel.isClientWalletConnected()) {
            this.subscriptionModel.connectWallet();
            return;
        }
        this.doSubmitAction();
    }

    private async doSubmitAction() {
        if (!this._data || !this._data.productId) return;
        if (!this.edtStartDate.value) {
            this.showTxStatusModal('error', 'Start Date Required');
            return;
        }
        if (!this.edtDuration.value || this.duration <= 0 || !Number.isInteger(this.duration)) {
            this.showTxStatusModal('error', !this.edtDuration.value ? 'Duration Required' : 'Invalid Duration');
            return;
        }
        this.updateSubmitButton(true);
        const callback = (error: Error, receipt?: string) => {
            if (error) {
                this.showTxStatusModal('error', error);
            }
        };
        const startTime = this.edtStartDate.value.unix();
        const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        const duration = days * 86400;
        const confirmationCallback = async () => {
            this.productInfo = await this.subscriptionModel.getProductInfo(this._data.productId);
            if (this.onSubscribe) this.onSubscribe();
        };
        if (this.isRenewal) {
            await this.subscriptionModel.renewSubscription(this._data.productId, duration, this.discountApplied?.id ?? 0, callback, confirmationCallback);
        } else {
            await this.subscriptionModel.subscribe(this._data.productId, startTime, duration, this._data.referrer, this.discountApplied?.id ?? 0, callback, confirmationCallback);
        }
    }

    async init() {
        super.init();
        this.subscriptionModel = new SubscriptionModel();
        const durationUnits = this.subscriptionModel.durationUnits;
        this.comboDurationUnit.items = durationUnits;
        this.comboDurationUnit.selectedItem = durationUnits[0];
    }

    render() {
        return (
            <i-panel>
                <i-scom-dapp-container id="containerDapp">
                    <i-panel background={{ color: Theme.background.main }}>
                        <i-stack
                            id="pnlLoading"
                            direction="vertical"
                            height="100%"
                            alignItems="center"
                            justifyContent="center"
                            padding={{ top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }}
                            visible={false}
                        >
                            <i-panel class={'spinner'}></i-panel>
                        </i-stack>
                        <i-stack direction="vertical" padding={{ top: '1.5rem', bottom: '1.25rem', left: '1.25rem', right: '1.5rem' }} alignItems="center">
                            <i-stack direction="vertical" width="100%" maxWidth={600} gap='0.5rem'>
                                <i-stack id="pnlBody" direction="vertical" gap="0.5rem">
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="Starts" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-panel id="pnlStartDate" width="50%">
                                            <i-datepicker
                                                id="edtStartDate"
                                                height={36}
                                                width="100%"
                                                type="date"
                                                placeholder="dd/mm/yyyy"
                                                background={{ color: Theme.input.background }}
                                                font={{ size: '1rem' }}
                                                border={{ radius: "0.375rem" }}
                                                onChanged={this.onStartDateChanged}
                                            ></i-datepicker>
                                        </i-panel>
                                        <i-label id="lblStartDate" font={{ size: '1rem' }} visible={false} />
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="Duration" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-stack direction="horizontal" width="50%" alignItems="center" gap="0.5rem">
                                            <i-panel width="50%">
                                                <i-input
                                                    id="edtDuration"
                                                    height={36}
                                                    width="100%"
                                                    class={inputStyle}
                                                    inputType='number'
                                                    font={{ size: '1rem' }}
                                                    border={{ radius: 4, style: 'none' }}
                                                    padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.5rem', right: '0.5rem' }}
                                                    onChanged={this.onDurationChanged}
                                                >
                                                </i-input>
                                            </i-panel>
                                            <i-panel width="50%">
                                                <i-combo-box
                                                    id="comboDurationUnit"
                                                    height={36}
                                                    width="100%"
                                                    icon={{ width: 14, height: 14, name: 'angle-down', fill: Theme.divider }}
                                                    border={{ width: 1, style: 'solid', color: Theme.divider, radius: 5 }}
                                                    onChanged={this.onDurationUnitChanged}
                                                ></i-combo-box>
                                            </i-panel>
                                        </i-stack>
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="Ends" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id="lblEndDate" font={{ size: '1rem' }} />
                                    </i-stack>
                                    <i-stack
                                        id="pnlDiscount"
                                        direction="horizontal"
                                        width="100%"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        gap="0.5rem"
                                        lineHeight={1.5}
                                        visible={false}
                                    >
                                        <i-label id="lblDiscount" caption="Discount" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id="lblDiscountAmount" font={{ size: '1rem' }}></i-label>
                                    </i-stack>
                                    <i-stack
                                        width="100%"
                                        direction="horizontal"
                                        justifyContent="space-between"
                                        alignItems='center'
                                        gap="0.5rem"
                                        lineHeight={1.5}
                                    >
                                        <i-stack direction="horizontal" alignItems='center' gap="0.5rem">
                                            <i-label caption='You are going to pay' font={{ bold: true, size: '1rem' }}></i-label>
                                            <i-icon
                                                id="iconOrderTotal"
                                                width={20}
                                                height={20}
                                                name="question-circle"
                                                fill={Theme.background.modal}
                                                tooltip={{ content: 'A commission fee of 0% will be applied to the amount you input.' }}
                                            ></i-icon>
                                        </i-stack>
                                        <i-label id='lblOrderTotal' font={{ size: '1rem' }} caption="0"></i-label>
                                    </i-stack>
                                    <i-stack direction="vertical" width="100%" justifyContent="center" alignItems="center" margin={{ top: '0.5rem' }} gap={8}>
                                        <i-button
                                            id='btnSubmit'
                                            width='100%'
                                            caption='Subscribe'
                                            padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }}
                                            font={{ size: '1rem', color: Theme.colors.primary.contrastText, bold: true }}
                                            rightIcon={{ visible: false, fill: Theme.colors.primary.contrastText }}
                                            background={{ color: Theme.background.gradient }}
                                            border={{ radius: 12 }}
                                            onClick={this.onSubmit}
                                            enabled={false}
                                        ></i-button>
                                    </i-stack>
                                </i-stack>
                                <i-stack id='pnlUnsupportedNetwork' direction="vertical" alignItems="center" visible={false}>
                                    <i-label caption='This network or this token is not supported.' font={{ size: '1.5rem' }}></i-label>
                                </i-stack>
                            </i-stack>
                        </i-stack>
                        <i-scom-tx-status-modal id="txStatusModal" />
                    </i-panel>
                </i-scom-dapp-container>
            </i-panel>
        )
    }
}