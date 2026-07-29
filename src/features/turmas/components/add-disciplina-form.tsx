"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createDisciplinaAction } from "../actions";
import { SUBJECT_STATUS_OPTIONS } from "../utils/turmas";
import type { FormActionState } from "../types";

import { FormSubmitButton } from "./form-submit-button";

type AddDisciplinaFormProps = {
  turmaId: string;
};

const initialState: FormActionState = {
  status: "idle",
  message: ""
};

export function AddDisciplinaForm({ turmaId }: AddDisciplinaFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    createDisciplinaAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Disciplinas da turma
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Cadastre disciplinas reais vinculadas a esta turma no Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          aria-expanded={isOpen}
        >
          Adicionar disciplina
        </button>
      </div>

      {isOpen ? (
        <form
          ref={formRef}
          action={formAction}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="turmaId" value={turmaId} />

          <Field label="Nome da disciplina">
            <input
              required
              name="nome"
              className={inputClassName}
              placeholder="Ex.: Sistemas Operacionais"
            />
          </Field>

          <Field label="Carga horária total">
            <input
              required
              type="number"
              min="1"
              name="cargaHorariaTotal"
              className={inputClassName}
              placeholder="60"
            />
          </Field>

          <Field label="Aulas semanais">
            <input
              required
              type="number"
              min="1"
              name="aulasSemanais"
              className={inputClassName}
              placeholder="2"
            />
          </Field>

          <Field label="Status">
            <select required name="status" className={inputClassName}>
              {SUBJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            {state.message ? (
              <p
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  state.status === "success"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                }`}
              >
                {state.message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <FormSubmitButton
                idleLabel="Salvar disciplina"
                pendingLabel="Salvando disciplina..."
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
