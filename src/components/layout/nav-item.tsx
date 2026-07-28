import Link from "next/link";

type NavItemProps = {
  href: string;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
};

export function NavItem({ href, label, isActive, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
        isActive
          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
          : "text-[var(--muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}
