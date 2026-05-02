import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes, Landmark, RadioTower, Vault } from 'lucide-react';
import type { LandingContent } from '../types/content';

interface ProjectsProps {
  section: LandingContent['modulesSection'];
}

const moduleStyles = [
  { icon: Boxes, gradient: 'bg-gradient-to-br from-aurora-start/20 to-aurora-mid/20' },
  { icon: RadioTower, gradient: 'bg-gradient-to-br from-aurora-mid/20 to-aurora-end/20' },
  { icon: Landmark, gradient: 'bg-gradient-to-br from-electric/20 to-neon/20' },
  { icon: Vault, gradient: 'bg-gradient-to-br from-aurora-end/20 to-electric/20' },
];

export default function Projects({ section }: ProjectsProps) {
  return (
    <section id="projects" className="relative px-6 py-28">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="mb-4 font-display text-4xl font-extrabold text-text-primary md:text-6xl">
            {section.title}
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-text-secondary">
            {section.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {section.modules.map((module, index) => {
            const style = moduleStyles[index % moduleStyles.length];
            const Icon = style.icon;

            return (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-surface bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-aurora-mid/30 hover:shadow-lg">
                <div className={`absolute inset-x-0 top-0 h-1 ${style.gradient}`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="mb-4 inline-flex rounded-2xl bg-deep p-3 text-aurora-start">
                        <Icon size={22} />
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary transition-colors group-hover:text-aurora-start">
                        {module.title}
                      </h3>
                    </div>
                    <div className="rounded-full border border-surface bg-deep p-2 text-text-secondary">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                    {module.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {module.tech.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-surface bg-deep px-3 py-1 text-xs font-mono text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  );
}
