export default function DashboardHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl px-6 py-10">
      <section className="w-full rounded-[32px] border border-slate-200 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Officer Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Officer shell with Firebase email login.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Day 2 adds role-aware backend verification and the initial API contracts used by the upcoming escalation queue.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white"
            href="/dashboard/login"
          >
            Sign in as Officer
          </a>
          <a
            className="rounded-full border border-brand-300 px-5 py-3 font-semibold text-brand-800"
            href="/"
          >
            Landing
          </a>
        </div>
      </section>
    </main>
  );
}
