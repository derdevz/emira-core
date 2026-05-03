import type { WalletAdapter, WalletConnection, WalletInspectionState } from './types';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

function notReadyMessage() {
  if (!walletConnectProjectId) {
    return 'WalletConnect proje anahtari tanimli degil. Telegram ve mobil yuzeyler icin VITE_WALLETCONNECT_PROJECT_ID gerekli.';
  }

  return 'WalletConnect adaptoru hazirlandi ancak baglanti oturumu henuz etkinlestirilmedi.';
}

async function inspectWalletConnect(): Promise<WalletInspectionState> {
  return {
    state: 'ready',
    provider: 'walletconnect',
    message: notReadyMessage(),
  };
}

async function connectWalletConnect(): Promise<WalletConnection> {
  throw new Error(
    'WalletConnect akisi bu iskelette henuz etkin degil. Sonraki adimda Stellar Wallets Kit veya uyumlu bir Telegram/mobile wallet baglanacak.',
  );
}

export const walletConnectAdapter: WalletAdapter = {
  provider: 'walletconnect',
  surface: 'telegram',
  inspect: inspectWalletConnect,
  connect: connectWalletConnect,
};
