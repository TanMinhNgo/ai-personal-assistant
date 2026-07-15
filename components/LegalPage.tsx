import Link from 'next/link';

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 px-5 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/landing"
            className="text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100"
          >
            OmniMind
          </Link>
          <nav
            aria-label="Legal pages"
            className="flex items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            <Link
              href="/privacy"
              className="transition hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Terms
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Last updated: July 15, 2026
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {summary}
        </p>
        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 marker:text-emerald-600 dark:text-slate-300 dark:marker:text-emerald-400">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <footer className="mt-14 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          These pages describe the current OmniMind product. Update them if the
          product, data practices, or business contact details change.
        </footer>
      </article>
    </main>
  );
}
