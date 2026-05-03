import { connectFreighter, freighterAdapter, inspectFreighter } from './freighterAdapter';
import { isTelegramSurface } from './telegram';
import type { WalletAdapter, WalletConnection, WalletInspectionState } from './types';
import { walletConnectAdapter } from './walletConnectAdapter';

export type { WalletAdapter, WalletConnection, WalletInspectionState, WalletProvider } from './types';

export function resolvePrimaryWalletAdapter(): WalletAdapter {
  return isTelegramSurface() ? walletConnectAdapter : freighterAdapter;
}

export async function inspectPrimaryWallet(): Promise<WalletInspectionState> {
  return resolvePrimaryWalletAdapter().inspect();
}

export async function connectPrimaryWallet(): Promise<WalletConnection> {
  return resolvePrimaryWalletAdapter().connect();
}

export { connectFreighter, inspectFreighter };
