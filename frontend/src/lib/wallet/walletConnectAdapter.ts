import type { WalletAdapter, WalletConnection, WalletInspectionState } from './types';

let initialized = false;

async function getWalletKitRuntime() {
  const [{ StellarWalletsKit, Networks }, walletConnectModule] = await Promise.all([
    import('@creit.tech/stellar-wallets-kit'),
    import('../../../node_modules/@creit.tech/stellar-wallets-kit/esm/sdk/modules/wallet-connect.module.js'),
  ]);
  const { WalletConnectModule, WalletConnectTargetChain } = walletConnectModule;

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error('WalletConnect proje anahtari tanimli degil. VITE_WALLETCONNECT_PROJECT_ID gerekli.');
  }

  if (!initialized) {
    const selectedNetwork = (import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet').toLowerCase().includes('public')
      ? Networks.PUBLIC
      : Networks.TESTNET;

    StellarWalletsKit.init({
      modules: [
        new WalletConnectModule({
          projectId,
          metadata: {
            name: 'Emira Core',
            description: 'Telegram ve mobil Stellar akislari icin Emira Core WalletConnect katmani',
            url: import.meta.env.VITE_TELEGRAM_WEBAPP_URL ?? window.location.origin,
            icons: [`${window.location.origin}/favicon.svg`],
          },
          allowedChains: [
            selectedNetwork === Networks.PUBLIC ? WalletConnectTargetChain.PUBLIC : WalletConnectTargetChain.TESTNET,
          ],
        }),
      ],
      network: selectedNetwork,
    });
    initialized = true;
  }

  return { StellarWalletsKit, Networks };
}

async function inspectWalletConnect(): Promise<WalletInspectionState> {
  try {
    const { StellarWalletsKit } = await getWalletKitRuntime();
    try {
      const { address } = await StellarWalletsKit.getAddress();
      const { network, networkPassphrase } = await StellarWalletsKit.getNetwork();
      return {
        state: 'connected',
        provider: 'walletconnect',
        connection: {
          address,
          walletKitAddress: address,
          network,
          networkPassphrase,
          provider: 'walletconnect',
          surface: 'telegram',
        },
      };
    } catch {
      return {
        state: 'ready',
        provider: 'walletconnect',
        message: 'WalletConnect hazir. Telegram veya mobil Stellar cüzdani ile baglanabilirsin.',
      };
    }
  } catch (error) {
    return {
      state: 'missing',
      provider: 'walletconnect',
      message: error instanceof Error ? error.message : 'WalletConnect baslatilamadi.',
    };
  }
}

async function connectWalletConnect(): Promise<WalletConnection> {
  const { StellarWalletsKit } = await getWalletKitRuntime();
  const { address } = await StellarWalletsKit.authModal();
  const { network, networkPassphrase } = await StellarWalletsKit.getNetwork();

  return {
    address,
    walletKitAddress: address,
    network,
    networkPassphrase,
    provider: 'walletconnect',
    surface: 'telegram',
  };
}

export const walletConnectAdapter: WalletAdapter = {
  provider: 'walletconnect',
  surface: 'telegram',
  inspect: inspectWalletConnect,
  connect: connectWalletConnect,
};
