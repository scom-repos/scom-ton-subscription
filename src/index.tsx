import {
    application,
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
import { Nip19, SocialDataManager } from '@scom/scom-social-sdk';
import { ITokenObject } from '@scom/scom-token-list';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';
import { inputStyle } from './index.css';
import { ISubscriptionDiscountRule, ITonSubscription, NetworkType } from './interface';
import { SubscriptionModel } from './model';

const Theme = Styles.Theme.ThemeVars;
const path = application.currentModuleDir;

interface ScomTonSubscriptionElement extends ControlElement {
    onMintedNFT?: () => void;
}

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
    private pnlHeader: StackLayout;
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
    private isWalletConnected: boolean;
    private btnTonSubmit: Button;
    private tonConnectUI: any;

    private subscriptionModel: SubscriptionModel;
    private discountApplied: ISubscriptionDiscountRule;
    private _isRenewal = false;
    private _renewalDate: number;
    private _data: ITonSubscription = {};
    private token: ITokenObject;
    private _dataManager: SocialDataManager;
    public onMintedNFT: () => void;
    
    get dataManager() {
        return this._dataManager || application.store?.mainDataManager;
    }

    set dataManager(manager: SocialDataManager) {
        this._dataManager = manager;
    }

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
        if (this.edtStartDate) {
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
    
    private get basePrice() {
        const price = new BigNumber(this._data?.tokenAmount || 0);
        let basePrice: BigNumber = price;
        if (this.discountApplied) {
            if (this.discountApplied.discountPercentage > 0) {
                basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
            } else if (this.discountApplied.fixedPrice> 0) {
                basePrice = new BigNumber(this.discountApplied.fixedPrice);
            }
        }
        return basePrice;
    }

    private get totalAmount() {
        let basePrice = this.basePrice;
        const pricePerDay = basePrice.div(this._data?.durationInDays || 1);
        const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        return pricePerDay.times(days);
    }

    showLoading() {
        this.pnlLoading.visible = true;
        this.pnlBody.visible = false;
    }

    hideLoading() {
        this.pnlLoading.visible = false;
        this.pnlBody.visible = true;
    }

    getConfigurators() {
        return [
            {
                name: 'Builder Configurator',
                target: 'Builders',
                getData: this.getData.bind(this),
                setData: async (data: ITonSubscription) => {
                    await this.setData({ ...data });
                },
                getTag: this.getTag.bind(this),
                setTag: this.setTag.bind(this)
            },
        ]
    }

    private getData() {
        return this._data;
    }

    private async setData(data: ITonSubscription) {
        this.showLoading();
        this._data = data;
        this.edtStartDate.value = undefined;
        this.edtDuration.value = '';
        this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
        await this.subscriptionModel.initWallet();
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
            this.pnlBody.visible = true;
            this.token = this.subscriptionModel.tokens.find(token => token.address === this._data.currency || token.symbol === this._data.currency);
            this.edtStartDate.value = this.isRenewal && this.renewalDate ? moment(this.renewalDate * 1000) : moment();
            this.pnlStartDate.visible = !this.isRenewal;
            this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY');
            this.lblStartDate.visible = this.isRenewal;
            const rule = this._data.discountRuleId ? this._data.discountRules.find(rule => rule.id === this._data.discountRuleId) : null;
            const isExpired = rule && rule.endTime && rule.endTime < moment().unix();
            if (isExpired) this._data.discountRuleId = undefined;
            if (rule && !isExpired) {
                if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                    this.edtStartDate.value = moment(rule.startTime * 1000);
                }
                this.edtDuration.value = rule.minDuration || "1";
                this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
                this.discountApplied = rule;
                this._updateEndDate();
                this._updateTotalAmount();
            } else {
                this.edtDuration.value = this._data.durationInDays || "";
                this.onDurationChanged();
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
        if (!this._data.discountRules?.length || !this.duration || !this.edtStartDate.value) return;
        const price = new BigNumber(this._data.tokenAmount);
        const startTime = this.edtStartDate.value.unix();
        const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        let discountAmount: BigNumber;
        for (let rule of this._data.discountRules) {
            if (rule.discountApplication === 0 && this.isRenewal) continue;
            if (rule.discountApplication === 1 && !this.isRenewal) continue;
            if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration > days) continue;
            let basePrice: BigNumber = price;
            if (rule.discountPercentage > 0) {
                basePrice = price.times(1 - rule.discountPercentage / 100)
            } else if (rule.fixedPrice > 0) {
                basePrice = new BigNumber(rule.fixedPrice);
            }
            let tmpDiscountAmount = price.minus(basePrice).div(this._data.durationInDays).times(days);
            if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                this.discountApplied = rule;
                discountAmount = tmpDiscountAmount;
            }
        }
    }

    private _updateTotalAmount() {
        const duration = Number(this.edtDuration.value) || 0;
        if (!duration) this.lblOrderTotal.caption = `0 ${this.token?.symbol || ''}`;
        this.pnlDiscount.visible = false;
        if (this.discountApplied) {
            if (this.discountApplied.discountPercentage > 0) {
                this.lblDiscount.caption = `Discount (${this.discountApplied.discountPercentage}% off)`;
                this.pnlDiscount.visible = true;
            } else if (this.discountApplied.fixedPrice> 0) {
                this.lblDiscount.caption = "Discount";
                this.pnlDiscount.visible = true;
            }
            if (this.pnlDiscount.visible) {
                const price = new BigNumber(this._data.tokenAmount);
                const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
                const discountAmount = price.minus(this.basePrice).div(this._data.durationInDays).times(days);
                this.lblDiscountAmount.caption = `-${this.subscriptionModel.formatNumber(discountAmount, 6)} ${this.token?.symbol || ''}`;
            }
        }
        this.lblOrderTotal.caption = `${this.subscriptionModel.formatNumber(this.totalAmount, 6)} ${this.token?.symbol || ''}`;
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
        this.btnTonSubmit.rightIcon.spin = submitting;
        this.btnTonSubmit.rightIcon.visible = submitting;
    }
    private initTonWallet() {
        try {
            let UI = window['TON_CONNECT_UI'];
            this.tonConnectUI = new UI.TonConnectUI({
                manifestUrl: 'https://ton.noto.fan/tonconnect/manifest.json',
                buttonRootId: 'pnlHeader'
            });
            this.tonConnectUI.connectionRestored.then(async (restored: boolean) => {
                this.isWalletConnected = this.tonConnectUI.connected;
                this.btnTonSubmit.enabled = true;
                this.determineBtnSubmitCaption();
            });
            this.tonConnectUI.onStatusChange((walletAndwalletInfo) => {
                this.isWalletConnected = !!walletAndwalletInfo;
                this.determineBtnSubmitCaption();
            });
        } catch (err) {
            alert(err)
        }
    }
    private async connectTonWallet(){
        try{
            await this.tonConnectUI.openModal();
        }
        catch(err){
            alert(err)
        }        
    }
    private determineBtnSubmitCaption() {
        if (!this.isWalletConnected) {
            this.btnTonSubmit.caption = 'Connect Wallet';
        }
        else {
            this.btnTonSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
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
        if (!this.isWalletConnected) {
            this.connectTonWallet();
            return;
        }
        this.doSubmitAction();
    }
    private async handleTonPayment() {
        const startTime = this.edtStartDate.value.unix();
        const endTime = moment.unix(startTime).add(this.duration, this.durationUnit).unix();
        let subscriptionFee = this.totalAmount;
        let subscriptionFeeToAddress = this._data.recipient;

        const creatorPubkey = Nip19.decode(this._data.creatorId).data as string;
        // const comment = `${creatorPubkey}:${this._data.communityId}:${this.dataManager.selfPubkey}:${startTime}:${endTime}`;
        const comment = `${creatorPubkey}:${this._data.communityId}:${startTime}:${endTime}`; //FIXME: selfPubkey is removed because the comment is too long. 
        const payload = await this.subscriptionModel.constructPayload(comment);
        //https://ton-connect.github.io/sdk/modules/_tonconnect_ui.html#send-transaction
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
            messages: [
                {
                    address: subscriptionFeeToAddress,
                    amount: subscriptionFee.times(1e9).toFixed(),
                    payload: payload
                }
            ]
        };
        
        try {
            const result = await this.tonConnectUI.sendTransaction(transaction);
            const txHash = await this.subscriptionModel.getTransactionHash(result.boc);
            await this.subscriptionModel.updateCommunitySubscription(this.dataManager, this._data.creatorId, this._data.communityId, startTime, endTime, txHash);
            if (this.onMintedNFT) this.onMintedNFT();
        } catch (e) {
            console.error(e);
        }
    }
    private async doSubmitAction() {
        if (!this._data) return;
        if (!this.edtStartDate.value) {
            this.showTxStatusModal('error', 'Start Date Required');
            return;
        }
        if (!this.edtDuration.value || this.duration <= 0 || !Number.isInteger(this.duration)) {
            this.showTxStatusModal('error', !this.edtDuration.value ? 'Duration Required' : 'Invalid Duration');
            return;
        }
        this.updateSubmitButton(true);
        if (this._data.networkType === NetworkType.Telegram) {
            await this.subscriptionModel.createInvoice(
                this._data.communityId,
                this.duration,
                this.durationUnit,
                this._data.currency,
                this.totalAmount,
                ""
            );
        } else {
            await this.handleTonPayment();
        }
        this.updateSubmitButton(false);
    }

    async init() {
        super.init();
        const moduleDir = this['currentModuleDir'] || path;
        this.subscriptionModel = new SubscriptionModel();
        const durationUnits = this.subscriptionModel.durationUnits;
        this.comboDurationUnit.items = durationUnits;
        this.comboDurationUnit.selectedItem = durationUnits[0];
        const data = {
            wallets: this.subscriptionModel.wallets,
            networks: [],
            showHeader: false,
        }
        this.initTonWallet();
        if (this.containerDapp?.setData) await this.containerDapp.setData(data);
        await this.subscriptionModel.loadLib(moduleDir);
    }

    render() {
        return (
            <i-panel>
                <i-scom-dapp-container id="containerDapp">
                    <i-panel
                        padding={{ top: '0.5rem', bottom: '0.5rem', left: '1.75rem', right: '1.75rem' }}
                        background={{ color: Theme.background.modal }}
                    >
                        <i-stack id="pnlHeader" direction="horizontal" alignItems="center" justifyContent="end">
                        </i-stack>
                    </i-panel>
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
                                            id='btnTonSubmit'
                                            width='100%'
                                            caption='Subscribe'
                                            padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }}
                                            font={{ size: '1rem', color: Theme.colors.primary.contrastText, bold: true }}
                                            rightIcon={{ visible: false, fill: Theme.colors.primary.contrastText }}
                                            background={{ color: Theme.background.gradient }}
                                            border={{ radius: 12 }}
                                            enabled={false}
                                            onClick={this.onSubmit}
                                        ></i-button>
                                    </i-stack>
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