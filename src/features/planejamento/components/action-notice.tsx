type ActionNoticeProps = {
  status?: string;
  error?: string;
};

export function ActionNotice({ status, error }: ActionNoticeProps) {
  if (error) {
    return (
      <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </p>
    );
  }

  if (status) {
    return (
      <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        {status}
      </p>
    );
  }

  return null;
}
