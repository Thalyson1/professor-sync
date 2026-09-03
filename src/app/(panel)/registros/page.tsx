import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { RecordStatusBadge } from "@/features/registros/components/record-status-badge";
import { listLessonRecords } from "@/features/registros/queries";
import { isLessonRecordStatus } from "@/features/registros/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ classId?: string; subjectId?: string; status?: string; startDate?: string; endDate?: string; error?: string; notice?: string }> };

export default async function RecordsPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawStatus = params.status ?? "";
  const status = isLessonRecordStatus(rawStatus) ? rawStatus : undefined;
  const result = await listLessonRecords({ classId: params.classId, subjectId: params.subjectId, status, startDate: params.startDate, endDate: params.endDate });
  const records = result.data ?? [];
  const classes = unique(records, "classId", "className");
  const subjects = unique(records, "subjectId", "subjectName");

  return <PageSection title="Registros de aula" description="Revise o que foi realizado e prepare os registros internos para a futura sincronizaÃ§Ã£o com o SIAGE.">
    {params.notice ? <Notice message={params.notice} /> : null}
    {params.error || result.error ? <Notice error message={params.error ?? result.error ?? ""} /> : null}
    <form className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-5">
      <select name="classId" defaultValue={params.classId ?? ""} className={inputClass}><option value="">Todas as turmas</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select name="subjectId" defaultValue={params.subjectId ?? ""} className={inputClass}><option value="">Todas as disciplinas</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select name="status" defaultValue={status ?? ""} className={inputClass}><option value="">Todos os status</option><option value="draft">Rascunho</option><option value="ready">Pronto para SIAGE</option><option value="synced">Sincronizado</option><option value="sync_error">Erro</option></select>
      <input name="startDate" type="date" defaultValue={params.startDate} className={inputClass} aria-label="Data inicial" />
      <input name="endDate" type="date" defaultValue={params.endDate} className={inputClass} aria-label="Data final" />
      <button className="rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white md:col-span-5">Aplicar filtros</button>
    </form>
    {!result.configured ? <EmptyState title="Supabase nÃ£o configurado" description="Configure as variÃ¡veis pÃºblicas do Supabase para carregar os registros." /> : null}
    {result.configured && records.length === 0 ? <EmptyState title="Nenhum registro encontrado" description="Conclua uma aula no cronograma e gere um registro para revisÃ£o." /> : null}
    <div className="grid gap-4">{records.map((record) => <Link key={record.id} href={`/registros/${record.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-[var(--primary)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-[var(--muted)]">{formatDate(record.lessonDate)} · {record.className} · {record.subjectName}</p><h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{record.plannedLessonTitle}</h2><p className="mt-2 text-sm text-[var(--muted)]">{record.numberOfLessons} tempo(s)</p></div><RecordStatusBadge status={record.status} /></div></Link>)}</div>
  </PageSection>;
}

function unique(items: Awaited<ReturnType<typeof listLessonRecords>>["data"], idKey: "classId" | "subjectId", labelKey: "className" | "subjectName") { return [...new Map((items ?? []).map((item) => [item[idKey], { id: item[idKey], label: item[labelKey] }])).values()]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)); }
function Notice({ message, error = false }: { message: string; error?: boolean }) { return <p className={`rounded-xl p-4 text-sm ${error ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{message}</p>; }
const inputClass = "h-11 rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-3 text-sm text-[var(--foreground)]";
