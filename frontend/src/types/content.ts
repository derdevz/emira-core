export interface NavLink {
  name: string;
  href: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroSpotlight {
  title: string;
  description: string;
  tag: string;
}

export interface ModuleCard {
  title: string;
  description: string;
  tech: string[];
}

export interface TokenBlock {
  title: string;
  items: string[];
}

export interface MetricCard {
  label: string;
  value: string;
}

export interface AllocationItem {
  label: string;
  percentage: number;
  value: string;
}

export interface InfoCard {
  title: string;
  value: string;
}

export interface CommunityChannel {
  label: string;
  href: string;
}

export interface LandingContent {
  locale: 'en' | 'tr';
  brand: {
    name: string;
    ticker: string;
    tagline: string;
  };
  navigation: {
    links: NavLink[];
    cta: CtaLink;
  };
  hero: {
    badge: string;
    title: string;
    headline: string;
    description: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    stats: HeroStat[];
    spotlight: HeroSpotlight;
  };
  modulesSection: {
    title: string;
    description: string;
    modules: ModuleCard[];
  };
  tokenomicsSection: {
    title: string;
    description: string;
    allocationTitle: string;
    allocationDescription: string;
    allocationLegendLabel: string;
    allocations: AllocationItem[];
    blocks: TokenBlock[];
    metrics: MetricCard[];
  };
  communitySection: {
    title: string;
    description: string;
    formLabels: {
      name: string;
      email: string;
      message: string;
      submit: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      messagePlaceholder: string;
    };
    waitlistSuccessMessage: string;
    channelsTitle: string;
    cards: InfoCard[];
    channels: CommunityChannel[];
    quote: string;
  };
  footer: {
    copyright: string;
    meta: string;
  };
}

export type Locale = LandingContent['locale'];
