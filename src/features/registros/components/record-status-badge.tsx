import { getLessonRecordStatusLabel } from "../utils";

import type { LessonRecordStatus } from "../types";

export function RecordStatusBadge({ status }: { status: LessonRecordStatus }) {
  const color = {
    draft: "bg-slate-200 text-slate-700",
    ready: "bg-sky-100 text-sky-800",
    synced: "bg-emerald-100 text-emerald-800",
    sync_error: "bg-rose-100 text-rose-800"
  }[status];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{getLessonRecordStatusLabel(status)}</span>;
}
