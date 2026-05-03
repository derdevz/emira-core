import type { WalletConnection } from './freighter';

const explicitHorizonUrl = import.meta.env.VITE_STELLAR_HORIZON_URL;
const configuredMarketplaceAddress = import.meta.env.VITE_STELLAR_MARKETPLACE_ADDRESS;
const explicitSorobanRpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL;
const configuredMarketContractId = import.meta.env.VITE_SOROBAN_MARKET_CONTRACT_ID;
const configuredRewardsContractId = import.meta.env.VITE_SOROBAN_REWARDS_CONTRACT_ID;
const configuredNetwork = import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet';
const defaultTestnetMarketplaceAddress = 'GCZGKZXINPUV6PMBHWOGKX4B2LAB4PUUOFSV4KJ765C6ZQXZNRDDF6SB';
const defaultTestnetMarketContractId = 'CBRKJVWTTF5DO2ZVIDOP3TSBTPYQXHGQIPA4ANFI7WKG4X65Y3MCCXJI';
const defaultTestnetRewardsContractId = 'CCO434MY5ASOQIJALSN2KINXVEQMJKCW3HRMVRZSF2MOXUI7O3V4WTJD';

type StellarSdk = typeof import('@stellar/stellar-sdk/no-axios') & {
  default?: unknown;
};

type MarketContractAction =
  | { type: 'list'; tokenId: number; priceXlm: number }
  | { type: 'cancel'; tokenId: number };

function resolveHorizonUrl(network: string) {
  if (explicitHorizonUrl) return explicitHorizonUrl;
  return network.toLowerCase().includes('public') ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
}

function resolveSorobanRpcUrl(wallet: WalletConnection) {
  if (explicitSorobanRpcUrl) return explicitSorobanRpcUrl;
  if (wallet.sorobanRpcUrl) return wallet.sorobanRpcUrl;
  return wallet.network.toLowerCase().includes('public') ? 'https://mainnet.sorobanrpc.com' : 'https://soroban-testnet.stellar.org';
}

function sanitizeAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('XLM tutari gecersiz.');
  }

  return amount.toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
}

function xlmToStroops(amountXlm: number) {
  return BigInt(Math.round(amountXlm * 10_000_000));
}

function isPlaceholder(value: string | undefined) {
  return !value || value.includes('XXXXX') || value.includes('your-');
}

function isLikelyAccountAddress(value: string | undefined) {
  return Boolean(value && !isPlaceholder(value) && value.startsWith('G') && value.length === 56);
}

function isLikelyContractId(value: string | undefined) {
  return Boolean(value && !isPlaceholder(value) && value.startsWith('C') && value.length === 56);
}

async function loadStellarSdk() {
  const module = (await import('@stellar/stellar-sdk/no-axios')) as StellarSdk;
  return (module.default ?? module) as typeof import('@stellar/stellar-sdk/no-axios');
}

export function resolveMarketplaceAddress(wallet: WalletConnection | null) {
  if (isLikelyAccountAddress(configuredMarketplaceAddress)) return configuredMarketplaceAddress;
  const network = wallet?.network ?? configuredNetwork;
  if (network.toLowerCase().includes('test')) return defaultTestnetMarketplaceAddress;
  return '';
}

export function isMarketplaceConfigured(wallet: WalletConnection | null) {
  return Boolean(resolveMarketplaceAddress(wallet));
}

export function isMarketContractConfigured() {
  return Boolean(resolveMarketContractId());
}

export function resolveMarketContractId() {
  if (isLikelyContractId(configuredMarketContractId)) return configuredMarketContractId;
  if (configuredNetwork.toLowerCase().includes('test')) return defaultTestnetMarketContractId;
  return '';
}

export function resolveRewardsContractId() {
  if (isLikelyContractId(configuredRewardsContractId)) return configuredRewardsContractId;
  if (configuredNetwork.toLowerCase().includes('test')) return defaultTestnetRewardsContractId;
  return '';
}

export async function signAndSubmitMarketPayment({
  wallet,
  amountXlm,
  memoText,
  destinationAddress,
}: {
  wallet: WalletConnection;
  amountXlm: number;
  memoText: string;
  destinationAddress?: string;
}) {
  const recipient = destinationAddress ?? resolveMarketplaceAddress(wallet);
  if (!recipient) {
    throw new Error('Stellar pazar alici adresi ayarlanmamis.');
  }
  if (!isLikelyAccountAddress(recipient)) {
    throw new Error('Stellar pazar alici adresi gecersiz. VITE_STELLAR_MARKETPLACE_ADDRESS gercek bir G... adresi olmali.');
  }

  const stellarSdk = await loadStellarSdk();
  const { Asset, BASE_FEE, Horizon, Memo, Operation, TransactionBuilder } = stellarSdk;
  const Server = Horizon?.Server;
  if (!Server) {
    throw new Error('Stellar Horizon server modulu yuklenemedi.');
  }

  const server = new Server(resolveHorizonUrl(wallet.network));
  const source = await server.loadAccount(wallet.address);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: wallet.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: recipient,
        asset: Asset.native(),
        amount: sanitizeAmount(amountXlm),
      }),
    )
    .addMemo(Memo.text(memoText.slice(0, 28)))
    .setTimeout(180)
    .build();

  const signedTxXdr = await signMarketTransaction(wallet, transaction.toXDR());
  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, wallet.networkPassphrase);
  const response = await server.submitTransaction(signedTransaction);

  return {
    hash: response.hash,
    recipient,
    amount: sanitizeAmount(amountXlm),
  };
}

export async function signAndSubmitMarketContractAction({
  wallet,
  action,
}: {
  wallet: WalletConnection;
  action: MarketContractAction;
}) {
  const contractId = resolveMarketContractId();
  if (!contractId) {
    throw new Error('Soroban pazar kontrati ayarlanmamis. VITE_SOROBAN_MARKET_CONTRACT_ID gercek bir C... kontrat id olmali.');
  }

  const stellarSdk = await loadStellarSdk();
  const { Address, BASE_FEE, Contract, TransactionBuilder, nativeToScVal, rpc } = stellarSdk;
  const RpcServer = rpc?.Server;
  if (!RpcServer) {
    throw new Error('Soroban RPC modulu yuklenemedi.');
  }

  const server = new RpcServer(resolveSorobanRpcUrl(wallet));
  const source = await server.getAccount(wallet.address);
  const contract = new Contract(contractId);
  const seller = new Address(wallet.address).toScVal();
  const tokenId = nativeToScVal(action.tokenId, { type: 'u32' });
  const operation =
    action.type === 'list'
      ? contract.call('list', seller, tokenId, nativeToScVal(xlmToStroops(action.priceXlm), { type: 'i128' }))
      : contract.call('cancel', seller, tokenId);

  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: wallet.networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  const signedTxXdr = await signMarketTransaction(wallet, prepared.toXDR());
  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, wallet.networkPassphrase);
  const response = await server.sendTransaction(signedTransaction);

  if (response.status === 'ERROR') {
    throw new Error('Soroban islemi ag tarafindan reddedildi.');
  }
  if (response.status === 'TRY_AGAIN_LATER') {
    throw new Error('Soroban RPC yogun. Biraz sonra tekrar dene.');
  }

  return {
    hash: response.hash,
    status: response.status,
    contractId,
  };
}

export async function signAndSubmitRewardsProgress({
  wallet,
  taps,
  ownedNfts,
}: {
  wallet: WalletConnection;
  taps: number;
  ownedNfts: number;
}) {
  const contractId = resolveRewardsContractId();
  if (!contractId) {
    throw new Error('Soroban odul kontrati ayarlanmamis. VITE_SOROBAN_REWARDS_CONTRACT_ID gercek bir C... kontrat id olmali.');
  }

  const stellarSdk = await loadStellarSdk();
  const { Address, BASE_FEE, Contract, TransactionBuilder, nativeToScVal, rpc } = stellarSdk;
  const RpcServer = rpc?.Server;
  if (!RpcServer) {
    throw new Error('Soroban RPC modulu yuklenemedi.');
  }

  const server = new RpcServer(resolveSorobanRpcUrl(wallet));
  const source = await server.getAccount(wallet.address);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: wallet.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'record_progress',
        new Address(wallet.address).toScVal(),
        nativeToScVal(Math.max(0, Math.floor(taps)), { type: 'u64' }),
        nativeToScVal(Math.max(0, Math.floor(ownedNfts)), { type: 'u32' }),
      ),
    )
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  const signedTxXdr = await signMarketTransaction(wallet, prepared.toXDR());
  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, wallet.networkPassphrase);
  const response = await server.sendTransaction(signedTransaction);

  if (response.status === 'ERROR') {
    throw new Error('Soroban ilerleme kaydi ag tarafindan reddedildi.');
  }
  if (response.status === 'TRY_AGAIN_LATER') {
    throw new Error('Soroban RPC yogun. Biraz sonra tekrar dene.');
  }

  return {
    hash: response.hash,
    status: response.status,
    contractId,
  };
}

export async function signAndSubmitGameState({
  wallet,
  taps,
  balanceNeaf,
  ownedNfts,
  tapUpgrade,
  passiveUpgrade,
  luckUpgrade,
  catPairs,
}: {
  wallet: WalletConnection;
  taps: number;
  balanceNeaf: number;
  ownedNfts: number;
  tapUpgrade: number;
  passiveUpgrade: number;
  luckUpgrade: number;
  catPairs: number[];
}) {
  const contractId = resolveRewardsContractId();
  if (!contractId) {
    throw new Error('Soroban odul kontrati ayarlanmamis. VITE_SOROBAN_REWARDS_CONTRACT_ID gercek bir C... kontrat id olmali.');
  }

  const stellarSdk = await loadStellarSdk();
  const { Address, BASE_FEE, Contract, TransactionBuilder, nativeToScVal, rpc } = stellarSdk;
  const RpcServer = rpc?.Server;
  if (!RpcServer) {
    throw new Error('Soroban RPC modulu yuklenemedi.');
  }

  const server = new RpcServer(resolveSorobanRpcUrl(wallet));
  const source = await server.getAccount(wallet.address);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: wallet.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'record_game_state',
        new Address(wallet.address).toScVal(),
        nativeToScVal(Math.max(0, Math.floor(taps)), { type: 'u64' }),
        nativeToScVal(BigInt(Math.max(0, Math.floor(balanceNeaf))), { type: 'i128' }),
        nativeToScVal(Math.max(0, Math.floor(ownedNfts)), { type: 'u32' }),
        nativeToScVal(Math.max(0, Math.floor(tapUpgrade)), { type: 'u32' }),
        nativeToScVal(Math.max(0, Math.floor(passiveUpgrade)), { type: 'u32' }),
        nativeToScVal(Math.max(0, Math.floor(luckUpgrade)), { type: 'u32' }),
        nativeToScVal(catPairs.map((value) => Math.max(0, Math.floor(value))), { type: 'u32' }),
      ),
    )
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  const signedTxXdr = await signMarketTransaction(wallet, prepared.toXDR());
  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, wallet.networkPassphrase);
  const response = await server.sendTransaction(signedTransaction);

  if (response.status === 'ERROR') {
    throw new Error('Soroban oyun kaydi ag tarafindan reddedildi.');
  }
  if (response.status === 'TRY_AGAIN_LATER') {
    throw new Error('Soroban RPC yogun. Biraz sonra tekrar dene.');
  }

  return {
    hash: response.hash,
    status: response.status,
    contractId,
  };
}

export async function readRewardsGameState(wallet: WalletConnection) {
  const contractId = resolveRewardsContractId();
  if (!contractId) return null;

  const stellarSdk = await loadStellarSdk();
  const { Address, BASE_FEE, Contract, TransactionBuilder, rpc, scValToNative } = stellarSdk;
  const RpcServer = rpc?.Server;
  if (!RpcServer) return null;

  const server = new RpcServer(resolveSorobanRpcUrl(wallet));
  const source = await server.getAccount(wallet.address);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: wallet.networkPassphrase,
  })
    .addOperation(contract.call('get_player', new Address(wallet.address).toScVal()))
    .setTimeout(180)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  const retval = 'result' in simulation ? simulation.result?.retval : undefined;
  if (!retval) return null;
  return scValToNative(retval) as unknown;
}

async function signMarketTransaction(wallet: WalletConnection, xdr: string) {
  if (wallet.provider === 'walletconnect') {
    const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit');
    const signed = await StellarWalletsKit.signTransaction(xdr, {
      address: wallet.address,
      networkPassphrase: wallet.networkPassphrase,
    });
    if (!signed?.signedTxXdr) {
      throw new Error('WalletConnect imzali islem dondurmedi.');
    }
    return signed.signedTxXdr;
  }

  const { signTransaction } = await import('@stellar/freighter-api');
  const signed = await signTransaction(xdr, {
    address: wallet.address,
    networkPassphrase: wallet.networkPassphrase,
  });

  if (signed.error) {
    const message = typeof signed.error === 'string' ? signed.error : signed.error.message ?? 'Freighter imzasi basarisiz oldu.';
    throw new Error(message);
  }

  if (!signed.signedTxXdr) {
    throw new Error('Freighter imzali islem dondurmedi.');
  }

  return signed.signedTxXdr;
}
