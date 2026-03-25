'use client';
import { useState, useEffect } from 'react'
import { RainbowButton } from './magicui/rainbow-button'
import {
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  ISupportedWallet
} from '@creit.tech/stellar-wallets-kit';
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from '@creit.tech/stellar-wallets-kit/modules/walletconnect.module';
import {
  xBullModule,
  FreighterModule,
  AlbedoModule
} from '@creit.tech/stellar-wallets-kit';

import {
  WALLETCONNECT_PROJECT_ID,
  WALLETCONNECT_ENABLED,
  APP_NAME,
  APP_URL,
  APP_LOGO_URL,
} from '@/config/env';

// Singleton instance — created once, reused across renders
let stellarWalletKit: StellarWalletsKit | null = null;

const WALLET_CONFIG = {
  network: WalletNetwork.TESTNET, // Change to WalletNetwork.PUBLIC for mainnet
  selectedWalletId: XBULL_ID,
};

function initializeWalletKit(): StellarWalletsKit {
  if (stellarWalletKit) return stellarWalletKit;

  const modules = [
    new xBullModule(),
    new FreighterModule(),
    new AlbedoModule(),
  ];

  // WalletConnect is opt-in — only added when a valid project ID is configured.
  // If NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is absent the module is skipped
  // gracefully rather than throwing at runtime.
  if (WALLETCONNECT_ENABLED && WALLETCONNECT_PROJECT_ID) {
    modules.push(
      new WalletConnectModule({
        url: APP_URL,
        projectId: WALLETCONNECT_PROJECT_ID,
        method: WalletConnectAllowedMethods.SIGN,
        description: `Connect your Stellar wallet to interact with ${APP_NAME}`,
        name: APP_NAME,
        icons: [APP_LOGO_URL],
        network: WALLET_CONFIG.network,
      })
    );
  }

  stellarWalletKit = new StellarWalletsKit({
    network: WALLET_CONFIG.network,
    selectedWalletId: WALLET_CONFIG.selectedWalletId,
    modules,
  });

  return stellarWalletKit;
}

async function connectWallet(): Promise<{ address: string; walletId: string }> {
  const kit = initializeWalletKit();

  return new Promise((resolve, reject) => {
    kit.openModal({
      onWalletSelected: async (option: ISupportedWallet) => {
        try {
          kit.setWallet(option.id);
          const { address } = await kit.getAddress();
          resolve({ address, walletId: option.id });
        } catch (error) {
          console.error('Error connecting wallet:', error);
          reject(error);
        }
      },
      onClosed: (err: Error) => {
        if (err) {
          console.error('Modal closed with error:', err);
          reject(err);
        } else {
          reject(new Error('Modal closed without wallet selection'));
        }
      },
      modalTitle: 'Connect Your Stellar Wallet',
      notAvailableText: 'This wallet is not available on your device',
    });
  });
}

async function getCurrentWalletAddress(): Promise<string | null> {
  if (!stellarWalletKit) return null;
  try {
    const { address } = await stellarWalletKit.getAddress();
    return address;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

async function signTransaction(
  txXdr: string,
  address: string,
  networkPassphrase: string = WalletNetwork.TESTNET
): Promise<string> {
  if (!stellarWalletKit) throw new Error('Wallet kit not initialized');
  try {
    const { signedTxXdr } = await stellarWalletKit.signTransaction(txXdr, {
      address,
      networkPassphrase,
    });
    return signedTxXdr;
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw error;
  }
}

function disconnectWallet(): void {
  stellarWalletKit?.setWallet('');
}

async function isWalletConnected(): Promise<boolean> {
  try {
    return (await getCurrentWalletAddress()) !== null;
  } catch {
    return false;
  }
}

async function handleConnectWallet() {
  try {
    const { address, walletId } = await connectWallet();
    return { address, walletId };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RootWalletButton() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const connected = await isWalletConnected()
        setIsConnected(connected)
        if (connected) {
          const address = await getCurrentWalletAddress()
          setWalletAddress(address)
          setWalletId(localStorage.getItem('walletId'))
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
        setError('Failed to check wallet connection')
      }
    }
    checkWalletConnection()
  }, [])

  const handleClick = async () => {
    if (isConnected) {
      disconnectWallet()
      setIsConnected(false)
      setWalletAddress(null)
      setWalletId(null)
      setError(null)
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('walletId')
    } else {
      setIsConnecting(true)
      setError(null)
      try {
        const { address, walletId: connectedWalletId } = await handleConnectWallet()
        setIsConnected(true)
        setWalletAddress(address)
        setWalletId(connectedWalletId)
        localStorage.setItem('walletAddress', address)
        localStorage.setItem('walletId', connectedWalletId)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        setError(error instanceof Error ? error.message : 'Failed to connect wallet')
      } finally {
        setIsConnecting(false)
      }
    }
  }

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...'
    if (isConnected && walletAddress)
      return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    return 'Connect Wallet'
  }

  const getButtonTitle = () => {
    if (isConnected && walletAddress)
      return `Connected: ${walletAddress} (${walletId ?? 'Unknown wallet'})`
    return 'Connect your Stellar wallet'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <RainbowButton
        variant={'outline'}
        className="bg-accent"
        onClick={handleClick}
        disabled={isConnecting}
        title={getButtonTitle()}
      >
        {getButtonText()}
      </RainbowButton>

      {error && (
        <div className="text-red-500 text-sm max-w-xs text-center">{error}</div>
      )}
    </div>
  )
}
