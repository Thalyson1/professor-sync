"use client";

import { usePathname } from "next/navigation";

import { getPageMetadata } from "@/lib/navigation";

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const page = getPageMetadata(pathname);

  return (
    <header className="flex flex-col gap-5 border-b border-[var(--border)] bg-[var(--card)] px-5 py-5 shadow-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--primary)]">
          Professor Sync
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {page.label}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-soft)]">
          {page.description}
        </p>
      </div>

      <div className="flex items-center gap-3 self-start lg:self-auto">
        <ThemeToggle />
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 shadow-sm">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]"
            aria-hidden="true"
          >
            PR
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Professor
            </p>
            <p className="text-xs text-[var(--muted-soft)]">
              Perfil provisório
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
