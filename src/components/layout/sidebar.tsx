"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  function openMobileMenu() {
    setIsMobileOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-sm lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Professor Sync
          </p>
          <p className="mt-1 text-sm text-[var(--muted-soft)]">
            Navegação principal
          </p>
        </div>
        <button
          type="button"
          onClick={openMobileMenu}
          className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-sidebar"
        >
          Menu
        </button>
      </div>

      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] backdrop-blur lg:block">
        <SidebarContent currentPath={pathname} />
      </aside>

      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden"
          onClick={closeMobileMenu}
        >
          <aside
            id="mobile-sidebar"
            className="h-full w-[85vw] max-w-xs border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-end px-4 py-4">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                Fechar
              </button>
            </div>
            <SidebarContent currentPath={pathname} onNavigate={closeMobileMenu} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
