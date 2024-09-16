import { application, Container, customModule, Module } from '@ijstech/components';
import ScomTonSubscription from '@scom/scom-ton-subscription';
import { getMulticallInfoList } from '@scom/scom-multicall';
import { INetwork } from '@ijstech/eth-wallet';
import getNetworkList from '@scom/scom-network-list';

@customModule
export default class Module1 extends Module {
    private tonSubscription: ScomTonSubscription;

    constructor(parent?: Container, options?: any) {
      super(parent, options);
      const multicalls = getMulticallInfoList();
      const networkMap = this.getNetworkMap(options.infuraId);
      application.store = {
        infuraId: options.infuraId,
        multicalls,
        networkMap
      }
    }
  
    private getNetworkMap = (infuraId?: string) => {
      const networkMap = {};
      const defaultNetworkList: INetwork[] = getNetworkList();
      const defaultNetworkMap: Record<number, INetwork> = defaultNetworkList.reduce((acc, cur) => {
        acc[cur.chainId] = cur;
        return acc;
      }, {});
      for (const chainId in defaultNetworkMap) {
        const networkInfo = defaultNetworkMap[chainId];
        const explorerUrl = networkInfo.blockExplorerUrls && networkInfo.blockExplorerUrls.length ? networkInfo.blockExplorerUrls[0] : "";
        if (infuraId && networkInfo.rpcUrls && networkInfo.rpcUrls.length > 0) {
          for (let i = 0; i < networkInfo.rpcUrls.length; i++) {
            networkInfo.rpcUrls[i] = networkInfo.rpcUrls[i].replace(/{INFURA_ID}/g, infuraId);
          }
        }
        networkMap[networkInfo.chainId] = {
          ...networkInfo,
          symbol: networkInfo.nativeCurrency?.symbol || "",
          explorerTxUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}tx/` : "",
          explorerAddressUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}address/` : ""
        }
      }
      return networkMap;
    }
  

    async init() {
        super.init();
        const builder = this.tonSubscription.getConfigurators().find((conf: any) => conf.target === 'Builders');
        builder.setData({
            chainId: 43113,
            nftAddress: "0x0075Fb0A3f94B32f8F3aF08AD6D93b1F45437501"
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