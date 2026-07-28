export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white/85 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Projeto em desenvolvimento
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Professor Sync
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Plataforma web para ajudar professores a organizar planejamento,
          registros pedagógicos e sincronizações administrativas em um só lugar.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Esta é a fundação técnica inicial da aplicação. Os módulos de negócio
          serão implementados nas próximas etapas.
        </p>
      </section>
    </main>
  );
}
