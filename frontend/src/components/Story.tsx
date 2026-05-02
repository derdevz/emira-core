import { motion } from 'framer-motion';
import { Coins, Gamepad2, Layers3, Zap } from 'lucide-react';
import type { Locale } from '../types/content';

interface StoryProps {
  locale: Locale;
}

export default function Story({ locale }: StoryProps) {
  const content =
    locale === 'tr'
      ? {
          eyebrow: 'Hackathon Story',
          title: 'Emira neden var?',
          description:
            'Emira, bir clicker coin fikrini sadece hype ile degil hikaye, utility ve Soroban altyapisiyla anlatmak icin tasarlanan bir hackathon projesidir.',
          cards: [
            {
              icon: Gamepad2,
              title: 'Clicker Coin Kurgusu',
              description:
                'Topluluk dikkatini oyunlastirma ile toplar; kullaniciya coin mantigini basit bir akista anlatir.',
            },
            {
              icon: Layers3,
              title: 'Soroban Altyapisi',
              description:
                'Odul mantigi ve kampanya state yapisi Stellar Soroban akilli sozlesme modeliyle dusunulur.',
            },
            {
              icon: Coins,
              title: 'Token Hikayesi',
              description:
                'Dagilim, treasury, staking ve topluluk odakli buyume tek bir okunabilir lansman anlatisinda birlesir.',
            },
            {
              icon: Zap,
              title: 'Hackathon Hazirligi',
              description:
                'Repo; web, API, dokumanlar, ekran goruntuleri ve teslim kalemlerine gore organize edilir.',
            },
          ],
        }
      : {
          eyebrow: 'Hackathon Story',
          title: 'Why does Emira exist?',
          description:
            'Emira is a hackathon-built clicker coin promo project designed to explain a token with narrative, utility and Soroban-backed structure instead of pure hype.',
          cards: [
            {
              icon: Gamepad2,
              title: 'Clicker Coin Concept',
              description:
                'It captures community attention with a gamified loop and explains the coin through a simple, low-friction user flow.',
            },
            {
              icon: Layers3,
              title: 'Soroban Foundation',
              description:
                'Reward logic and campaign state are designed around a Stellar Soroban smart contract model.',
            },
            {
              icon: Coins,
              title: 'Token Story',
              description:
                'Allocation, treasury, staking and community-led growth are presented in one readable launch narrative.',
            },
            {
              icon: Zap,
              title: 'Hackathon Ready',
              description:
                'The repository is organized around web, API, documentation, screenshots and submission-ready deliverables.',
            },
          ],
        };

  return (
    <section id="story" className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-aurora-start">{content.eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-text-primary md:text-6xl">
            {content.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">{content.description}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {content.cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[1.75rem] border border-surface bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-deep p-3 text-aurora-start">
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-xl font-bold text-text-primary">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
