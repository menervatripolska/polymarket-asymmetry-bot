import { Wallet } from "ethers";

export interface RelayerCheckResult {
  status: "ok";
  relayerAddress: string;
  relayerAddressSummary: string;
  relayerApiKeySummary: string;
  message: string;
  signatureSummary: string;
}

function summarize(text: string, visible = 6): string {
  if (text.length <= visible * 2) {
    return text;
  }
  return `${text.slice(0, visible)}...${text.slice(-visible)}`;
}

function normalizePrivateKey(value: string): string {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function getEnvValue(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

export async function runRelayerIntegrityCheck(): Promise<RelayerCheckResult> {
  const relayerApiKey = getEnvValue("RELAYER_API_KEY");
  const relayerAddress = getEnvValue("RELAYER_API_KEY_ADDRESS");
  const privateKey = normalizePrivateKey(getEnvValue("WALLET_PRIVATE_KEY"));

  const wallet = new Wallet(privateKey);
  const derivedAddress = wallet.address;

  if (derivedAddress.toLowerCase() !== relayerAddress.toLowerCase()) {
    throw new Error(
      `Derived wallet address ${derivedAddress} does not match RELAYER_API_KEY_ADDRESS ${relayerAddress}.`,
    );
  }

  const message = `polymarket-relayer-check-${new Date().toISOString()}`;
  const signature = await wallet.signMessage(message);

  return {
    status: "ok",
    relayerAddress,
    relayerAddressSummary: summarize(relayerAddress),
    relayerApiKeySummary: summarize(relayerApiKey),
    message,
    signatureSummary: summarize(signature, 10),
  };
}
