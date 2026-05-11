import { createNosanaAuthorization } from "@nosana/authorization";
import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

interface CreateSignedWalletAuthHeaderOptions {
  connected: boolean;
  publicKey: { toString(): string } | null | undefined;
  wallet: { adapter?: MessageSignerWalletAdapter } | null | undefined;
  message: string;
}

export const createSignedWalletAuthHeader = async ({
  connected,
  publicKey,
  wallet,
  message,
}: CreateSignedWalletAuthHeaderOptions): Promise<string> => {
  if (!connected || !publicKey || !wallet?.adapter) {
    throw new Error("Wallet not connected or not found");
  }

  console.log("Creating signed wallet auth header with message:", message);

  const adapter = wallet.adapter;
  if (!adapter.signMessage) {
    throw new Error("Wallet does not support message signing");
  }

  const authorization = createNosanaAuthorization(async (encodedMessage) => {
    return adapter.signMessage(encodedMessage);
  });

  return authorization.generate(message);
};