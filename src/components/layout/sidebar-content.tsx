import { isPathActive, navigationItems } from "@/lib/navigation";

import { NavItem } from "./nav-item";

type SidebarContentProps = {
  currentPath: string;
  onNavigate?: () => void;
};

export function SidebarContent({
  currentPath,
  onNavigate
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--sidebar-border)] px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
          Plataforma docente
        </p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
          Professor Sync
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-soft)]">
          Painel inicial para acompanhar planejamento, pendências e módulos do
          produto.
        </p>
      </div>

      <nav className="flex-1 px-4 py-6" aria-label="Navegação principal">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <NavItem
                href={item.href}
                label={item.label}
                isActive={isPathActive(currentPath, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
