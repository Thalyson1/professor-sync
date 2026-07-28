import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeScript } from "@/components/layout/theme-script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Professor Sync",
  description:
    "Plataforma para centralizar planejamento, registros e sincronização acadêmica de professores."
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
