import { ReactNode } from 'react'
import { useSigningClient } from 'contexts/cosmwasm'
import Loader from './Loader'
import { useWallet, WalletStatus, ConnectType } from '@terra-money/wallet-provider';


function WalletLoader({
  children,
  loading = false,
}: {
  children: ReactNode
  loading?: boolean
}) {
  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet();

  // if (loading || clientLoading) {
  //   return (
  //     <div className="flex justify-center">
  //       <Loader />
  //     </div>
  //   )
  // }

  if (status !== 'WALLET_CONNECTED') {
    return (
      <div className="max-w-full">
        <h1 className="text-6xl font-bold">
          Welcome to {process.env.NEXT_PUBLIC_SITE_TITLE}!
        </h1>
        <div className="flex flex-wrap items-center justify-around md:max-w-4xl mt-6 sm:w-full">
          <button
            className="p-6 mt-6 text-left border border-secondary hover:border-primary w-96 rounded-xl hover:text-primary focus:text-primary-focus"
            onClick={() => connect(ConnectType.CHROME_EXTENSION)}
          >
            <h3 className="text-2xl font-bold">Connect Chrome extension &rarr;</h3>
            <p className="mt-4 text-xl">
              Manage your multsig by connecting your Terra Station wallet.
            </p>
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-around md:max-w-4xl mt-6 sm:w-full">
          <button
            className="p-6 mt-6 text-left border border-secondary hover:border-primary w-96 rounded-xl hover:text-primary focus:text-primary-focus"
            onClick={() => connect(ConnectType.WALLETCONNECT)}
          >
            <h3 className="text-2xl font-bold">WalletConnect &rarr;</h3>
          </button>
        </div>
      </div>
    )
  }

  // if (error) {
  //   return <code>{JSON.stringify(error)}</code>
  // }

  return <>{children}</>
}

export default WalletLoader
