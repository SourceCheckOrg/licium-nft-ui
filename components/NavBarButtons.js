import Link from 'next/link';
import { useWallet, WalletStatus } from '@terra-money/wallet-provider';

export default function NavBarButtons() {
  const { 
    status, network, wallets, availableConnectTypes, 
    availableInstallTypes, connect, install, disconnect
  } = useWallet();

  let address = "";
  if (wallets[0] && wallets[0].terraAddress) {
    const terraAddr = wallets[0].terraAddress;
    address = `${terraAddr.slice(0,7)}...${terraAddr.slice(terraAddr.length - 6)} (${network.name})`;
  }

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        {status === WalletStatus.WALLET_NOT_CONNECTED ? (
          <button
              className="relative inline-flex items-center mr-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
              onClick={() => connect("CHROME_EXTENSION")}
          >
            Connect Wallet
          </button>
        ) : (
          <div className="">
            { address && (
              <span className="inline-block text-sm text-white px-4 py-2 border border-white rounded-md mr-3">
                {address}              
              </span>
            )}
            <button
              className="relative inline-flex items-center mr-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
