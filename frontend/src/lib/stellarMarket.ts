import { signTransaction } from '@stellar/freighter-api';
import { Asset, BASE_FEE, Horizon, Memo, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import type { WalletConnection } from './freighter';

const explicitHorizonUrl = import.meta.env.VITE_STELLAR_HORIZON_URL;
const configuredMarketplaceAddress = import.meta.env.VITE_STELLAR_MARKETPLACE_ADDRESS;

function resolveHorizonUrl(network: string) {
  if (explicitHorizonUrl) return explicitHorizonUrl;
  return network.toLowerCase().includes('public') ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
}

function sanitizeAmount(amount: number) {
  return amount.toFixed(2);
}

export function resolveMarketplaceAddress(wallet: WalletConnection | null) {
  return configuredMarketplaceAddress ?? wallet?.address ?? '';
}

export function isMarketplaceConfigured(wallet: WalletConnection | null) {
  return Boolean(resolveMarketplaceAddress(wallet));
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

  const server = new Horizon.Server(resolveHorizonUrl(wallet.network));
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

  const signed = await signTransaction(transaction.toXDR(), {
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

  const signedTransaction = TransactionBuilder.fromXDR(signed.signedTxXdr, wallet.networkPassphrase);
  const response = await server.submitTransaction(signedTransaction);

  return {
    hash: response.hash,
    recipient,
    amount: sanitizeAmount(amountXlm),
  };
}
