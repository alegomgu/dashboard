import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getSafeAlpacaAccounts } from "@/lib/alpaca-accounts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpaca Trading Command Center",
  description: "Private paper-first Alpaca trading dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const accounts = getSafeAlpacaAccounts().map(({ id, name, isDefault }) => ({
    id,
    name,
    isDefault,
  }));

  return (
    <html lang="es">
      <body>
        <Suspense>
          <AppShell accounts={accounts}>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
