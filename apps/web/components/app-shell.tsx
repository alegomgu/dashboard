"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  ListChecks,
  WalletCards,
} from "lucide-react";
import clsx from "clsx";
import { AccountSwitcher } from "./account-switcher";
import type { AccountOption } from "./account-switcher";

const navItems = [
  ["/overview", "Resumen", Activity],
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/positions", "Posiciones", WalletCards],
  ["/orders", "Órdenes", ListChecks],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  accounts,
  children,
}: {
  accounts: AccountOption[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get("account") ?? "";
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const accountId =
    pendingAccountId && pendingAccountId !== urlAccountId
      ? pendingAccountId
      : urlAccountId;

  useEffect(() => {
    function handleAccountChange(event: Event) {
      const customEvent = event as CustomEvent<{ accountId: string }>;
      setPendingAccountId(customEvent.detail.accountId);
    }

    window.addEventListener("alpaca-account-change", handleAccountChange);

    return () => {
      window.removeEventListener("alpaca-account-change", handleAccountChange);
    };
  }, []);

  function hrefWithAccount(href: string) {
    if (!accountId) {
      return href;
    }

    return `${href}?account=${encodeURIComponent(accountId)}`;
  }

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 bg-sidebar px-4 py-5 text-white shadow-sidebar lg:flex lg:flex-col">
        <Link
          href={hrefWithAccount("/overview")}
          className="flex items-center gap-3 px-1"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm ring-1 ring-white/15">
            <Activity size={21} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sidebarMuted">
              Private Paper Desk
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-tight">
              Alpaca Command Center
            </h1>
          </div>
        </Link>

        <nav className="mt-8 grid gap-1.5">
          {navItems.map(([href, label, Icon]) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  active
                    ? "bg-white text-sidebar shadow-sm"
                    : "text-sidebarMuted hover:bg-white/10 hover:text-white",
                )}
                href={hrefWithAccount(href)}
              >
                <Icon
                  size={18}
                  className={clsx(
                    "shrink-0 transition",
                    active
                      ? "text-accent"
                      : "text-sidebarMuted group-hover:text-white",
                  )}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3">
          <AccountSwitcher accounts={accounts} />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sidebarMuted">
              Operativa
            </p>
            <p className="mt-2 text-sm font-semibold">Paper · Read only</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-accentSoft" />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line/80 bg-panel/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              href={hrefWithAccount("/overview")}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-panel">
                <Activity size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Paper Desk
                </p>
                <p className="truncate text-sm font-semibold">Command Center</p>
              </div>
            </Link>
          </div>

          <nav className="scrollbar-none flex max-w-full min-w-0 gap-2 overflow-x-auto px-4 pb-3">
            {navItems.map(([href, label, Icon]) => {
              const active = isActive(pathname, href);

              return (
                <Link
                  key={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-sm transition",
                    active
                      ? "border-ink bg-ink text-panel"
                      : "border-line bg-panel text-muted",
                  )}
                  href={hrefWithAccount(href)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-line px-4 py-3">
            <AccountSwitcher accounts={accounts} tone="light" />
          </div>
        </header>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
