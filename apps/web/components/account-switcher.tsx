"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type AccountOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export function AccountSwitcher({
  accounts,
  tone = "dark",
}: {
  accounts: AccountOption[];
  tone?: "dark" | "light";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedAccountId = searchParams.get("account") ?? "";
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const effectivePendingAccountId =
    pendingAccountId && pendingAccountId !== requestedAccountId
      ? pendingAccountId
      : null;

  const currentAccountId = useMemo(() => {
    const fallback =
      accounts.find((account) => account.isDefault) ?? accounts[0];
    const selectedAccountId = effectivePendingAccountId ?? requestedAccountId;
    return selectedAccountId || fallback?.id || "";
  }, [accounts, effectivePendingAccountId, requestedAccountId]);

  function handleChange(nextAccountId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", nextAccountId);
    setPendingAccountId(nextAccountId);
    window.dispatchEvent(
      new CustomEvent("alpaca-account-change", {
        detail: { accountId: nextAccountId },
      }),
    );
    window.location.assign(`${pathname}?${params.toString()}`);
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panelSoft px-3 py-2 text-xs font-semibold text-muted">
        Sin cuentas Alpaca
      </div>
    );
  }

  const labelClass = tone === "dark" ? "text-sidebarMuted" : "text-muted";
  const selectClass =
    tone === "dark"
      ? "border-white/10 bg-white/10 text-white hover:bg-white/15 focus:border-white/30"
      : "border-line bg-panel text-ink shadow-sm hover:bg-panelSoft focus:border-accent";

  if (tone === "light") {
    return (
      <div>
        <p
          className={`mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] ${labelClass}`}
        >
          Cuenta Alpaca
        </p>
        <div className="grid grid-cols-3 gap-2">
          {accounts.map((account) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("account", account.id);
            const active = account.id === currentAccountId;

            return (
              <a
                key={account.id}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold shadow-sm transition ${
                  active
                    ? "border-ink bg-ink text-panel"
                    : "border-line bg-panel text-muted"
                }`}
                href={`${pathname}?${params.toString()}`}
              >
                {account.name}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span
        className={`mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] ${labelClass}`}
      >
        Cuenta Alpaca
      </span>
      <span className="relative block">
        <select
          className={`h-11 w-full appearance-none rounded-xl px-3 pr-9 text-sm font-semibold outline-none transition ${selectClass}`}
          value={currentAccountId}
          onChange={(event) => handleChange(event.target.value)}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id} className="text-ink">
              {account.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sidebarMuted"
          size={16}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
