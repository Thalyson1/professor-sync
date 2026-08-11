"use client";

import Link from "next/link";

type PlanejamentoErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PlanejamentoError({
  error,
  reset
}: PlanejamentoErrorProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-rose-300 bg-rose-50 p-8 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      <div>
        <h1 className="text-2xl font-semibold">Erro no módulo de Planejamento</h1>
        <p className="mt-3 text-sm leading-7">
          {error.message || "Ocorreu um erro inesperado ao carregar esta área."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-2xl border border-rose-500 bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Tentar novamente
        </button>
        <Link
          href="/planejamento"
          className="inline-flex items-center justify-center rounded-2xl border border-current px-4 py-3 text-sm font-medium"
        >
          Voltar para Planejamento
        </Link>
      </div>
    </section>
  );
}
