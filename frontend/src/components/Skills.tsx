import { motion } from 'framer-motion';
import { Activity, Coins, Lock, Shield, TrendingUp, Users } from 'lucide-react';
import type { LandingContent } from '../types/content';

interface SkillsProps {
  section: LandingContent['tokenomicsSection'];
}

const tokenBlockStyles = [
  { icon: Coins, color: 'text-aurora-start' },
  { icon: Lock, color: 'text-aurora-mid' },
  { icon: TrendingUp, color: 'text-aurora-end' },
  { icon: Users, color: 'text-electric' },
  { icon: Shield, color: 'text-neon' },
  { icon: Activity, color: 'text-aurora-mid' },
];

const barGradients = [
  'from-aurora-start to-aurora-mid',
  'from-aurora-mid to-electric',
  'from-electric to-neon',
  'from-neon to-aurora-end',
  'from-aurora-end to-aurora-mid',
  'from-slate-400 to-slate-500',
];

export default function Skills({ section }: SkillsProps) {
  return (
    <section id="skills" className="relative bg-gradient-to-b from-transparent via-deep/50 to-transparent px-6 py-28">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-extrabold text-text-primary md:text-6xl">
            {section.title}
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-text-secondary">
            {section.description}
          </p>
        </motion.div>

        <div className="mb-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm"
          >
            <h3 className="font-display text-2xl font-bold text-text-primary">{section.allocationTitle}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {section.allocationDescription}
            </p>

            <div className="mt-8 space-y-4">
              {section.allocations.map((allocation, index) => (
                <div key={allocation.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-base font-bold text-text-primary">{allocation.label}</p>
                      <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                        {allocation.value} • {allocation.percentage}% {section.allocationLegendLabel}
                      </p>
                    </div>
                    <div className="font-display text-lg font-bold text-text-primary">{allocation.percentage}%</div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-deep">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradients[index % barGradients.length]}`}
                      style={{ width: `${allocation.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{section.title}</p>
                <h3 className="mt-3 font-display text-2xl font-bold text-text-primary">
                  {section.description}
                </h3>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {section.metrics.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-surface bg-deep p-5">
                    <div className="font-display text-3xl font-extrabold text-text-primary">
                      {stat.value}
                    </div>
                    <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.blocks.map((block, index) => {
            const style = tokenBlockStyles[index % tokenBlockStyles.length];
            const Icon = style.icon;

            return (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group rounded-[1.75rem] border border-surface bg-white p-6 shadow-sm transition-all duration-300 hover:border-aurora-mid/30 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-xl bg-deep p-3 ${style.color} transition-transform group-hover:scale-105`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text-primary">{block.title}</h3>
                </div>

                <ul className="space-y-2">
                  {block.items.map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-aurora-mid" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
