import '../styles/global.css'
import { StaticWalletProvider, WalletProvider } from '@terra-money/wallet-provider';
import React from 'react';

const mainnet = {
  name: 'mainnet',
  chainID: 'columbus-4',
  lcd: 'https://lcd.terra.dev',
};

const testnet = {
  name: 'testnet',
  chainID: 'tequila-0004',
  lcd: 'https://tequila-lcd.terra.dev',
};

const walletConnectChainIds = {
  0: testnet,
  1: mainnet,
};

function MyApp({ Component, pageProps }) {
  return typeof window !== 'undefined' ? (
    <WalletProvider
      defaultNetwork={mainnet}
      walletConnectChainIds={walletConnectChainIds}
    >
      <Component {...pageProps} />
    </WalletProvider>
  ) : (
    <StaticWalletProvider defaultNetwork={mainnet}>
      <Component {...pageProps} />
    </StaticWalletProvider>
  );
}

export default MyApp;
