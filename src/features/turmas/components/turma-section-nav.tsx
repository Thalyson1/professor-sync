import Link from "next/link";

import { turmaSections } from "../utils/turmas";
import type { SecaoTurma } from "../types";

type TurmaSectionNavProps = {
  turmaId: string;
  activeSection: SecaoTurma;
};

export function TurmaSectionNav({
  turmaId,
  activeSection
}: TurmaSectionNavProps) {
  return (
    <nav
      aria-label="Seções internas do diário da turma"
      className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm"
    >
      <ul className="flex min-w-max gap-2">
        {turmaSections.map((section) => {
          const isActive = activeSection === section.id;
          const href =
            section.id === "visao-geral"
              ? `/turmas/${turmaId}`
              : `/turmas/${turmaId}?sec=${section.id}`;

          return (
            <li key={section.id}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                  isActive
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)]"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
