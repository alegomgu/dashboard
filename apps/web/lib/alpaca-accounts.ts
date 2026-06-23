import type { ServerEnv } from "@command-center/shared";
import { getServerEnv } from "./env";

export type SafeAlpacaAccount = {
  id: string;
  name: string;
  baseUrl: string;
  isDefault: boolean;
};

type AlpacaAccount = SafeAlpacaAccount & {
  apiKey: string;
  apiSecret: string;
};

const accountSlots = [1, 2, 3, 4] as const;

function accountId(slot: number) {
  return `alpaca_${slot}`;
}

function readConfiguredAccounts(): AlpacaAccount[] {
  const defaultAccountId = process.env.ALPACA_DEFAULT_ACCOUNT ?? "alpaca_3";

  return accountSlots.flatMap((slot) => {
    const id = accountId(slot);
    const name = process.env[`ALPACA_${slot}_NAME`];
    const apiKey = process.env[`ALPACA_${slot}_API_KEY_ID`];
    const apiSecret = process.env[`ALPACA_${slot}_API_SECRET_KEY`];
    const baseUrl =
      process.env[`ALPACA_${slot}_BASE_URL`] ??
      "https://paper-api.alpaca.markets";

    if (!name || !apiKey || !apiSecret) {
      return [];
    }

    return [
      {
        id,
        name,
        apiKey,
        apiSecret,
        baseUrl,
        isDefault: id === defaultAccountId,
      },
    ];
  });
}

export function getSafeAlpacaAccounts(): SafeAlpacaAccount[] {
  return readConfiguredAccounts().map(({ id, name, baseUrl, isDefault }) => ({
    id,
    name,
    baseUrl,
    isDefault,
  }));
}

export function getSelectedAlpacaAccount(
  requestedAccountId?: string | string[] | null,
): AlpacaAccount {
  const accounts = readConfiguredAccounts();
  const firstAccount = accounts[0];
  if (!firstAccount) {
    throw new Error("No Alpaca accounts configured.");
  }

  const normalizedRequestedId = Array.isArray(requestedAccountId)
    ? requestedAccountId.at(0)
    : requestedAccountId;
  const defaultAccount =
    accounts.find((account) => account.isDefault) ?? firstAccount;
  const selectedAccount =
    accounts.find((account) => account.id === normalizedRequestedId) ??
    defaultAccount;

  return selectedAccount;
}

export function getSelectedAccountServerEnv(account: AlpacaAccount): ServerEnv {
  const baseEnv = getServerEnv();

  return {
    ...baseEnv,
    ALPACA_API_KEY: account.apiKey,
    ALPACA_API_SECRET: account.apiSecret,
    ALPACA_ENV: account.baseUrl.includes("paper-api") ? "paper" : "live",
  };
}
