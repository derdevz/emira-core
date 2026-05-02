import { motion } from 'framer-motion';
import { Globe, Mail, Send, ShieldCheck, Sparkles, Twitter } from 'lucide-react';
import { useState } from 'react';
import type { LandingContent } from '../types/content';

interface ContactProps {
  section: LandingContent['communitySection'];
}

const channelIcons = {
  Docs: Globe,
  Audit: ShieldCheck,
  X: Twitter,
} as const;

const cardIcons = [Mail, Sparkles];

export default function Contact({ section }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative px-6 py-28">
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
          <p className="text-lg text-text-secondary">
            {section.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-surface bg-white p-8 shadow-sm">
              <div>
                <label htmlFor="name" className="font-mono text-sm text-text-secondary block mb-2">
                  {section.formLabels.name}
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-2xl border border-surface bg-deep px-4 py-3 text-text-primary outline-none transition-colors focus:border-aurora-mid"
                  placeholder={section.formLabels.namePlaceholder}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="font-mono text-sm text-text-secondary block mb-2">
                  {section.formLabels.email}
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border border-surface bg-deep px-4 py-3 text-text-primary outline-none transition-colors focus:border-aurora-mid"
                  placeholder={section.formLabels.emailPlaceholder}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="font-mono text-sm text-text-secondary block mb-2">
                  {section.formLabels.message}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-surface bg-deep px-4 py-3 text-text-primary outline-none transition-colors focus:border-aurora-mid"
                  placeholder={section.formLabels.messagePlaceholder}
                  required
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="neo-brutal flex w-full items-center justify-center gap-2 bg-aurora-mid px-8 py-4 font-display text-lg font-bold text-white transition-all duration-300 hover:bg-aurora-start"
              >
                <span>{section.formLabels.submit}</span>
                <Send size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {submitted ? (
                <p className="font-mono text-sm text-neon">
                  {section.waitlistSuccessMessage}
                </p>
              ) : null}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {section.cards.map((card, index) => {
              const Icon = cardIcons[index % cardIcons.length];
              const tone = index % 2 === 0 ? 'text-aurora-start' : 'text-aurora-mid';

              return (
                <div key={card.title} className="rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`rounded-xl bg-deep p-3 ${tone}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-text-primary">{card.title}</h3>
                      <p className="text-sm text-text-secondary">{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm">
              <h3 className="mb-4 font-display text-xl font-bold text-text-primary">{section.channelsTitle}</h3>
              <div className="flex gap-4">
                {section.channels.map(({ href, label }) => {
                  const Icon = channelIcons[label as keyof typeof channelIcons] ?? Globe;

                  return (
                  <motion.a
                    key={label}
                    href={href}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-xl bg-deep p-3 text-text-secondary transition-colors hover:bg-aurora-mid/10 hover:text-aurora-start"
                    aria-label={label}
                  >
                    <Icon size={24} />
                  </motion.a>
                  );
                })}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm"
            >
              <p className="text-text-secondary italic leading-relaxed">
                "{section.quote}"
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
