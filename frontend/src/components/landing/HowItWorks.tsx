const STEPS = [
  { n: '01', title: 'Paste your URL', body: 'Drop in any long link — no account required to try it.' },
  { n: '02', title: 'Share your Snip link', body: 'A short, clean link ready to post anywhere.' },
  { n: '03', title: 'Understand every click', body: 'See who clicked, from where, and on what — in real time.' },
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-2">How it works</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Create, share, learn.
        </h2>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.n} className="relative">
            <span className="font-mono text-sm text-text-muted">{step.n}</span>
            <h3 className="mt-3 text-[15px] font-semibold text-text">{step.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{step.body}</p>
            {i < STEPS.length - 1 && (
              <div className="mt-6 hidden h-px w-full bg-gradient-to-r from-border to-transparent sm:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
