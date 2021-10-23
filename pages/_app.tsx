import 'styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from 'components/Layout'
import { SigningCosmWasmProvider } from 'contexts/cosmwasm'
import {
  getChainOptions,
  StaticWalletProvider,
  WalletControllerChainOptions,
  WalletProvider,
} from '@terra-money/wallet-provider';

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps, defaultNetwork,
  walletConnectChainIds }: AppProps & WalletControllerChainOptions) {
  return (
    <SafeHydrate>
    <WalletProvider
      defaultNetwork={defaultNetwork}
      walletConnectChainIds={walletConnectChainIds}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WalletProvider>
    </SafeHydrate>
  )
}

MyApp.getInitialProps = async () => {
  const chainOptions = await getChainOptions();
  return {
    ...chainOptions,
  };
};
export default MyApp
