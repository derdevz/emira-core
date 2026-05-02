import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { LandingContent, Locale } from '../types/content';

interface NavigationProps {
  brandName: string;
  navigation: LandingContent['navigation'];
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function Navigation({ brandName, navigation, locale, onLocaleChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-surface/70 bg-white/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          className="font-display text-2xl font-extrabold text-text-primary"
          whileHover={{ scale: 1.05 }}
        >
          {brandName}
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navigation.links.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.href}
              className="font-mono text-sm text-text-secondary hover:text-aurora-start transition-colors relative group"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {link.name}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-aurora-mid group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}

          <div className="flex items-center rounded-full border border-surface bg-deep p-1">
            {(['tr', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onLocaleChange(option)}
                className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors ${
                  locale === option
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <a
            href={navigation.cta.href}
            className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-aurora-start"
          >
            {navigation.cta.label}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-text-primary"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-surface/70 bg-white/95"
        >
          <div className="px-6 py-4 flex flex-col gap-4">
            <div className="flex items-center rounded-full border border-surface bg-deep p-1">
              {(['tr', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onLocaleChange(option)}
                  className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors ${
                    locale === option
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {navigation.links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-mono text-sm text-text-secondary hover:text-aurora-start transition-colors"
              >
                {link.name}
              </a>
            ))}
            <a
              href={navigation.cta.href}
              onClick={() => setIsOpen(false)}
              className="inline-flex w-fit rounded-full border border-aurora-mid/20 bg-aurora-mid px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white"
            >
              {navigation.cta.label}
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
