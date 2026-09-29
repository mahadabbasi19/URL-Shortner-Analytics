import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CreateLinkCard } from '../components/CreateLinkCard'
import { Features } from '../components/landing/Features'
import { HowItWorks } from '../components/landing/HowItWorks'
import { ProductPreview } from '../components/ProductPreview'
import { Button } from '../components/ui/Button'

export function Landing() {
  return (
    <>
      <section id="product" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
            Short links.
            <br />
            Clear insights.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-text-secondary sm:text-base">
            Create clean short links, share them anywhere, and understand every click — all from one simple
            dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg">Start for free</Button>
            </Link>
            <a href="#product-shortener">
              <Button size="lg" variant="secondary">
                Try it now
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required.</p>
        </div>

        <div id="product-shortener" className="mx-auto mt-12 max-w-xl scroll-mt-24">
          <CreateLinkCard />
        </div>
      </section>

      <section id="analytics" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-20 sm:px-6 sm:pb-28">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
          More than a shorter link
        </p>
        <div className="mt-6">
          <ProductPreview />
        </div>
      </section>

      <div className="border-t border-border">
        <Features />
      </div>

      <div className="border-t border-border">
        <HowItWorks />
      </div>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Every click tells a story.
          </h2>
          <p className="mt-3 text-[15px] text-text-secondary">Start tracking yours.</p>
          <div className="mt-7">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Create your first link
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
