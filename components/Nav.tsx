import { useSigningClient } from 'contexts/cosmwasm'
import { useWallet, WalletStatus, ConnectType } from '@terra-money/wallet-provider';
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from 'components/ThemeToggle'
import NavContractLabel from 'components/NavContractLabel'

function Nav() {
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

  // const { walletAddress, connectWallet } = useSigningClient()
  const handleConnect = () => {
    if (wallets.length === 0) {
      connect(ConnectType.EXTENSION);
    } else {
      disconnect()
    }
  }

  const PUBLIC_SITE_ICON_URL = process.env.NEXT_PUBLIC_SITE_ICON_URL || ''
  const PUBLIC_SITE_TITLE = process.env.NEXT_PUBLIC_SITE_TITLE

  return (
    <div className="border-b w-screen px-2 md:px-16">
      <nav className="flex flex-wrap text-center md:text-left md:flex flex-row w-full justify-between items-center py-4 ">
        <div className="flex items-center">
          <Link href="/">
            <a className="ml-1 md:ml-2 link link-hover font-semibold text-xl md:text-2xl align-top">
              {PUBLIC_SITE_TITLE}
            </a>
          </Link>
        </div>
        <NavContractLabel />
        <ThemeToggle />
        <div className="flex flex-grow md:flex-grow-0 max-w-full">
          <button
            className={`block btn btn-outline btn-primary w-full max-w-full truncate ${
              wallets.length > 0 ? 'lowercase' : ''
            }`}
            onClick={handleConnect}
          >
            {(wallets.length > 0 && wallets[0].terraAddress) || 'Connect Wallet'}
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Nav
