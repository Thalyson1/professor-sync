"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  idleLabel: string;
  pendingLabel: string;
  tone?: "danger" | "neutral";
};

export function ConfirmSubmitButton({
  confirmMessage,
  idleLabel,
  pendingLabel,
  tone = "danger",
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        props.onClick?.(event);
      }}
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
        tone === "danger"
          ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          : "border-[var(--border)] bg-[var(--card-strong)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-[var(--primary)]"
      } disabled:cursor-not-allowed disabled:opacity-70 ${props.className ?? ""}`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
