"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createTurmaAction } from "../actions";
import {
  TURMA_MODALITY_OPTIONS,
  TURMA_SHIFT_OPTIONS,
  TURMA_STATUS_OPTIONS,
  formatSemesterLabel
} from "../utils/turmas";
import type { Escola, FormActionState, Semestre } from "../types";

import { FormSubmitButton } from "./form-submit-button";

type AddTurmaFormProps = {
  escolas: Escola[];
  semestres: Semestre[];
};

const initialState: FormActionState = {
  status: "idle",
  message: ""
};

export function AddTurmaForm({ escolas, semestres }: AddTurmaFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(createTurmaAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="w-full max-w-xl">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        aria-expanded={isOpen}
      >
        Adicionar turma
      </button>

      {isOpen ? (
        <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--card-strong)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Nova turma
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Cadastro persistido no Supabase para desenvolvimento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-2xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Fechar
            </button>
          </div>

          <form
            ref={formRef}
            action={formAction}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <FormField label="Nome da turma">
              <input
                required
                name="nome"
                className={inputClassName}
                placeholder="Ex.: 1ª Série A"
              />
            </FormField>

            <FormField label="Série">
              <input
                required
                name="serie"
                className={inputClassName}
                placeholder="Ex.: 1ª Série"
              />
            </FormField>

            <FormField label="Curso">
              <input
                required
                name="curso"
                className={inputClassName}
                defaultValue="Informática"
              />
            </FormField>

            <FormField label="Quantidade de alunos">
              <input
                required
                type="number"
                min="0"
                name="quantidadeAlunos"
                className={inputClassName}
                defaultValue="0"
              />
            </FormField>

            <FormField label="Turno">
              <select required name="turno" className={inputClassName}>
                {TURMA_SHIFT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Modalidade">
              <select required name="modalidade" className={inputClassName}>
                {TURMA_MODALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Escola">
              <select required name="escolaId" className={inputClassName}>
                <option value="">Selecione</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.id}>
                    {escola.nome}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Semestre">
              <select required name="semestreId" className={inputClassName}>
                <option value="">Selecione</option>
                {semestres.map((semestre) => (
                  <option key={semestre.id} value={semestre.id}>
                    {formatSemesterLabel(semestre)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status">
              <select required name="status" className={inputClassName}>
                {TURMA_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

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

              <FormSubmitButton
                idleLabel="Salvar turma"
                pendingLabel="Salvando turma..."
              />
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function FormField({
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
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
