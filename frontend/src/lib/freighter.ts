import {
  getAddress,
  getNetworkDetails,
  isConnected,
  isAllowed,
  requestAccess,
  setAllowed,
} from '@stellar/freighter-api';

export type WalletConnection = {
  address: string;
  network: string;
  networkPassphrase: string;
  sorobanRpcUrl?: string;
};

export type FreighterStatus =
  | { state: 'missing'; message: string }
  | { state: 'ready'; message: string }
  | { state: 'connected'; connection: WalletConnection };

type ApiResult = {
  error?: string | { message?: string };
};

function readError(result: ApiResult) {
  if (!result.error) return null;
  return typeof result.error === 'string' ? result.error : result.error.message ?? 'Freighter istegi basarisiz oldu.';
}

export async function getFreighterConnection(): Promise<WalletConnection | null> {
  const connected = await isConnected();
  const connectedError = readError(connected);
  if (connectedError || !connected.isConnected) return null;

  const addressResult = await getAddress();
  const addressError = readError(addressResult);
  if (addressError || !addressResult.address) return null;

  const networkResult = await getNetworkDetails();
  const networkError = readError(networkResult);
  if (networkError) return null;

  return {
    address: addressResult.address,
    network: networkResult.network,
    networkPassphrase: networkResult.networkPassphrase,
    sorobanRpcUrl: networkResult.sorobanRpcUrl,
  };
}

export async function inspectFreighter(): Promise<FreighterStatus> {
  const connected = await isConnected();
  const connectedError = readError(connected);
  if (connectedError || !connected.isConnected) {
    return {
      state: 'missing',
      message: 'Freighter eklentisi kurulu degil veya tarayici tarafindan erisilemiyor.',
    };
  }

  const allowed = await isAllowed();
  const allowedError = readError(allowed);
  if (allowedError || !allowed.isAllowed) {
    return {
      state: 'ready',
      message: 'Freighter bulundu. Sisteme girmek icin cuzdan izni gerekiyor.',
    };
  }

  const connection = await getFreighterConnection();
  if (!connection) {
    return {
      state: 'ready',
      message: 'Freighter bulundu. Aktif hesabi baglamak icin izin ver.',
    };
  }

  return { state: 'connected', connection };
}

export async function connectFreighter(): Promise<WalletConnection> {
  const connected = await isConnected();
  const connectedError = readError(connected);
  if (connectedError) throw new Error(connectedError);
  if (!connected.isConnected) throw new Error('Freighter eklentisi bulunamadi.');

  const allowed = await setAllowed();
  const allowedError = readError(allowed);
  if (allowedError) throw new Error(allowedError);

  const access = await requestAccess();
  const accessError = readError(access);
  if (accessError) throw new Error(accessError);
  if (!access.address) throw new Error('Freighter adresi alinamadi.');

  const network = await getNetworkDetails();
  const networkError = readError(network);
  if (networkError) throw new Error(networkError);

  return {
    address: access.address,
    network: network.network,
    networkPassphrase: network.networkPassphrase,
    sorobanRpcUrl: network.sorobanRpcUrl,
  };
}
