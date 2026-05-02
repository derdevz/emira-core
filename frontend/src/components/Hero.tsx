import { motion } from 'framer-motion';
import { ArrowDown, CheckCircle2, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import type { LandingContent } from '../types/content';

interface HeroProps {
  brand: LandingContent['brand'];
  hero: LandingContent['hero'];
  locale: LandingContent['locale'];
}

export default function Hero({ brand, hero, locale }: HeroProps) {
  const trustItems =
    locale === 'tr'
      ? ['Acik dagilim modeli', 'Basit onboarding', 'Topluluk odakli growth']
      : ['Visible allocations', 'Simpler onboarding', 'Community-led growth'];

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(rgba(15, 108, 189, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15, 108, 189, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="text-center lg:text-left">
            <motion.div
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-aurora-mid/15 bg-white px-4 py-2 shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Sparkles size={16} className="text-aurora-mid" />
              <span className="font-mono text-sm text-text-secondary">{hero.badge}</span>
            </motion.div>

            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[0.95] text-text-primary md:text-7xl lg:text-8xl">
              <span className="text-glow">{hero.title}</span>
              <span className="mt-4 block text-balance">{hero.headline}</span>
            </h1>

            <motion.p
              className="mb-10 mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {hero.description}
            </motion.p>

            <motion.div
              className="flex flex-col items-center gap-4 sm:flex-row lg:items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <a
                href={hero.primaryCta.href}
                className="neo-brutal group relative overflow-hidden bg-aurora-mid px-8 py-4 font-display text-lg font-bold text-white transition-all duration-300 hover:bg-aurora-start"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Rocket size={18} />
                  {hero.primaryCta.label}
                </span>
              </a>

              <a
                href={hero.secondaryCta.href}
                className="rounded-full border border-surface bg-white px-8 py-4 font-display text-lg font-bold text-text-primary transition-all duration-300 hover:border-aurora-mid hover:bg-deep/70"
              >
                {hero.secondaryCta.label}
              </a>
            </motion.div>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              {trustItems.map((item) => (
                <div key={item} className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 size={16} className="text-neon" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="rounded-[2rem] border border-surface/70 bg-white p-6 text-left shadow-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">{brand.ticker}</p>
                <p className="mt-2 font-display text-2xl font-bold text-text-primary">{brand.tagline}</p>
              </div>
              <div className="rounded-2xl bg-neon/10 p-3 text-neon">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-surface/80 bg-deep px-5 py-4">
                  <div className="font-display text-3xl font-extrabold text-text-primary">{stat.value}</div>
                  <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-surface bg-white px-5 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-neon/10 p-3 text-neon">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-text-primary">{hero.spotlight.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{hero.spotlight.description}</p>
                  <div className="mt-4 inline-flex rounded-full border border-aurora-mid/15 bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-aurora-start">
                    {hero.spotlight.tag}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 flex items-center justify-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="rounded-full border border-surface bg-white px-5 py-3 text-center shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{brand.ticker}</p>
            <p className="mt-1 text-sm text-text-secondary">{brand.tagline}</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ArrowDown size={32} className="text-aurora-mid" />
        </motion.div>
      </div>

      <motion.div
        className="absolute left-10 top-24 h-20 w-20 rounded-full bg-aurora-start/10 blur-2xl"
        animate={{ y: [0, -12, 0], scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />
      <motion.div
        className="absolute bottom-20 right-10 h-28 w-28 rounded-full bg-aurora-end/10 blur-2xl"
        animate={{ y: [0, 14, 0], scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 7 }}
      />
    </section>
  );
}
