import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type PanelLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function PanelLayout({ children }: PanelLayoutProps) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
