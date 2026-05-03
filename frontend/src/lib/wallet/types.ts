export type WalletProvider = 'freighter' | 'walletconnect';

export type WalletConnection = {
  address: string;
  network: string;
  networkPassphrase: string;
  sorobanRpcUrl?: string;
  provider: WalletProvider;
  surface: 'web' | 'telegram';
  walletKitAddress?: string;
};

export type WalletInspectionState =
  | { state: 'missing'; message: string; provider: WalletProvider }
  | { state: 'ready'; message: string; provider: WalletProvider }
  | { state: 'connected'; connection: WalletConnection; provider: WalletProvider };

export type WalletAdapter = {
  provider: WalletProvider;
  surface: 'web' | 'telegram';
  inspect: () => Promise<WalletInspectionState>;
  connect: () => Promise<WalletConnection>;
};
