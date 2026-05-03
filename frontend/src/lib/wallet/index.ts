import type { WalletAdapter, WalletConnection, WalletInspectionState } from './types';

export type { WalletAdapter, WalletConnection, WalletInspectionState, WalletProvider } from './types';

async function loadFreighterAdapter(): Promise<WalletAdapter> {
  const { freighterAdapter } = await import('./freighterAdapter');
  return freighterAdapter;
}

export async function resolvePrimaryWalletAdapter(): Promise<WalletAdapter> {
  return loadFreighterAdapter();
}

export async function inspectPrimaryWallet(): Promise<WalletInspectionState> {
  const adapter = await resolvePrimaryWalletAdapter();
  return adapter.inspect();
}

export async function connectPrimaryWallet(): Promise<WalletConnection> {
  const adapter = await resolvePrimaryWalletAdapter();
  return adapter.connect();
}

export async function inspectFreighter() {
  const { inspectFreighter } = await import('./freighterAdapter');
  return inspectFreighter();
}

export async function connectFreighter() {
  const { connectFreighter } = await import('./freighterAdapter');
  return connectFreighter();
}
