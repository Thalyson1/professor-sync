import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { RecordStatusBadge } from "@/features/registros/components/record-status-badge";
import { markLessonRecordReadyAction, updateLessonRecordAction } from "@/features/registros/form-actions";
import { getLessonRecordById } from "@/features/registros/queries";
import { SIAGE_METHODOLOGIES } from "@/features/planejamento/utils/constants";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> };

export default async function RecordDetailPage({ params, searchParams }: Props) {
  const { id } = await params; const messages = await searchParams;
  const result = await getLessonRecordById(id);
  if (!result.configured) return <EmptyState title="Supabase nÃ£o configurado" description="Configure a conexÃ£o antes de acessar registros." />;
  if (result.error) return <EmptyState title="NÃ£o foi possÃ­vel carregar o registro" description={result.error} />;
  if (!result.data) notFound();
  const record = result.data; const locked = record.status === "synced";

  return <section className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/registros" className="text-sm font-medium text-[var(--primary)]">Voltar para registros</Link><p className="mt-4 text-sm text-[var(--muted)]">{record.className} · {record.subjectName}</p><h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{record.plannedLessonTitle}</h1></div><RecordStatusBadge status={record.status} /></div>
    {messages.notice ? <Notice message={messages.notice} /> : null}{messages.error ? <Notice message={messages.error} error /> : null}
    <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-5 md:grid-cols-4"><Info label="Data" value={formatDate(record.lessonDate)} /><Info label="Tempos" value={String(record.numberOfLessons)} /><Info label="Planejamento" value="Aula planejada relacionada" /><Info label="Origem" value="ExecuÃ§Ã£o no cronograma" /></div>
    <form action={updateLessonRecordAction} className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
      <input type="hidden" name="id" value={record.id} />
      <h2 className="text-xl font-semibold text-[var(--foreground)]">ConteÃºdo realizado</h2>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Data da aula"><input name="lessonDate" type="date" defaultValue={record.lessonDate} disabled={locked} className={inputClass} /></Field><Field label="Quantidade de tempos"><input name="numberOfLessons" type="number" min="1" defaultValue={record.numberOfLessons} disabled={locked} className={inputClass} /></Field><Field label="Metodologia"><select name="methodology" defaultValue={record.methodology ?? ""} disabled={locked} className={inputClass}><option value="">Selecione</option>{SIAGE_METHODOLOGIES.map((item) => <option key={item}>{item}</option>)}</select></Field></div>
      <Field label="Objetos de conhecimento"><textarea name="knowledgeObjects" rows={4} defaultValue={record.knowledgeObjects ?? ""} disabled={locked} className={textareaClass} /></Field>
      <Field label="ObservaÃ§Ãµes"><textarea name="observations" rows={4} defaultValue={record.observations ?? ""} disabled={locked} className={textareaClass} /></Field>
      {!locked ? <FormSubmitButton idleLabel="Salvar revisÃ£o" pendingLabel="Salvando registro..." /> : <p className="text-sm text-[var(--muted)]">Registros sincronizados ficam protegidos contra ediÃ§Ã£o.</p>}
    </form>
    {!locked ? <form action={markLessonRecordReadyAction} className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><input type="hidden" name="id" value={record.id} /><h2 className="font-semibold text-sky-950">Preparar para sincronizaÃ§Ã£o</h2><p className="mt-2 text-sm text-sky-900">Revise o conteÃºdo acima. Esta aÃ§Ã£o apenas altera o status interno e nÃ£o envia dados ao SIAGE.</p><div className="mt-4"><FormSubmitButton idleLabel="Marcar como pronto" pendingLabel="Atualizando status..." /></div></form> : null}
    <p className="text-sm text-[var(--muted)]">Origem: <Link className="text-[var(--primary)]" href={`/planejamento/${record.teachingPlanId}/cronograma`}>planejamento e aula planejada relacionados</Link>.</p>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">{label}</p><p className="mt-1 text-sm text-[var(--foreground)]">{value}</p></div>; }
function Notice({ message, error = false }: { message: string; error?: boolean }) { return <p className={`rounded-xl p-4 text-sm ${error ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{message}</p>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)); }
const inputClass = "h-11 rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 text-sm text-[var(--foreground)] disabled:opacity-70";
const textareaClass = "rounded-xl border border-[var(--border)] bg-[var(--card-strong)] p-3 text-sm text-[var(--foreground)] disabled:opacity-70";
