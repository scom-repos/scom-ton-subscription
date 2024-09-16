import { customModule, Module } from '@ijstech/components';
import ScomTonSubscription from '@scom/scom-ton-subscription';

@customModule
export default class Module1 extends Module {
    private tonSubscription: ScomTonSubscription;

    async init() {
        super.init();
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