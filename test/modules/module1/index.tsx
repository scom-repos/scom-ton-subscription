import { customModule, Module } from '@ijstech/components';
import ScomTonSubscription from '@scom/scom-ton-subscription';

@customModule
export default class Module1 extends Module {
    private tonSubscription: ScomTonSubscription;

    async init() {
        super.init();
        this.tonSubscription.setData({
            chainId: 43113,
            nftAddress: "0x0075Fb0A3f94B32f8F3aF08AD6D93b1F45437501",
            defaultChainId: 43113,
            wallets: [],
            networks: []
        });
    }
    
    render() {
        return (
            <i-stack
                direction="vertical"
                margin={{ top: '1rem', left: '1rem', right: '1rem' }}
                gap="1rem"
            >
                <i-scom-ton-subscription
                    id="tonSubscription"
                ></i-scom-ton-subscription>
            </i-stack>
        )
    }
}