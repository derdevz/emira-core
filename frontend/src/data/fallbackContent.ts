import type { LandingContent, Locale } from '../types/content';

export const fallbackContentByLocale: Record<Locale, LandingContent> = {
  en: {
    locale: 'en',
    brand: {
      name: 'Emira',
      ticker: '$EMR',
      tagline: 'A clicker coin story built for the Soroban ecosystem.',
    },
    navigation: {
      links: [
        { name: 'HOME', href: '#hero' },
        { name: 'MODULES', href: '#projects' },
        { name: 'TOKENOMICS', href: '#skills' },
        { name: 'COMMUNITY', href: '#contact' },
      ],
      cta: {
        label: 'Join Presale',
        href: '#contact',
      },
    },
    hero: {
      badge: 'Clear structure, predictable token flow, and community-first launch',
      title: 'EMIRA',
      headline: 'A clearer crypto website for users who want the basics fast.',
      description:
        'Emira is a hackathon-built clicker coin promo project that combines token storytelling, community rewards, and a Soroban-first smart contract vision in one simple experience.',
      primaryCta: {
        label: 'See Product Modules',
        href: '#projects',
      },
      secondaryCta: {
        label: 'Review Tokenomics',
        href: '#skills',
      },
      stats: [
        { label: 'Total Supply', value: '1B' },
        { label: 'Community Share', value: '42%' },
        { label: 'Staking Yield', value: '18%' },
      ],
      spotlight: {
        title: 'Built for readable token economics',
        description:
          'Transparent allocations, phased unlocks and a treasury policy that users can understand without digging through a whitepaper first.',
        tag: 'Presale Q3 2026',
      },
    },
    modulesSection: {
      title: 'Core Modules',
      description:
        'Instead of overwhelming visitors with jargon, the site explains the parts that matter most for Emira: the clicker loop, Soroban reward logic, launch flow and treasury model.',
      modules: [
        {
          title: 'Clicker Launch Loop',
          description:
            'Turn attention into action with a simple clicker-style acquisition loop that feeds presale, waitlist and campaign momentum.',
          tech: ['Clicker Loop', 'Presale', 'Waitlist', 'Campaign'],
        },
        {
          title: 'Soroban Rewards Contract',
          description:
            'Reward and campaign state are designed around Soroban so the project can evolve from promotional website to onchain participation logic.',
          tech: ['Soroban', 'Rewards', 'State', 'Rust/Wasm'],
        },
        {
          title: 'Community Growth Rail',
          description:
            'Show how users move from curiosity to contribution through referral mechanics, waitlist capture and community activation.',
          tech: ['Referrals', 'Waitlist', 'X Community', 'Activation'],
        },
        {
          title: 'Treasury Vault',
          description:
            'Explain how Emira balances campaign growth, liquidity and treasury reserves without making the token model feel opaque.',
          tech: ['Treasury', 'Liquidity', 'Reserves', 'Buybacks'],
        },
      ],
    },
    tokenomicsSection: {
      title: 'Tokenomics',
      description:
        'The section is now easier to scan: headline metrics, allocation bars and plain-language rules for a hackathon clicker coin launch.',
      allocationTitle: 'Allocation Breakdown',
      allocationDescription:
        'A quick view of how supply is distributed at launch so users can evaluate balance and long-term incentives.',
      allocationLegendLabel: 'of total supply',
      allocations: [
        { label: 'Community & Rewards', percentage: 42, value: '420M' },
        { label: 'Liquidity', percentage: 18, value: '180M' },
        { label: 'Treasury', percentage: 12, value: '120M' },
        { label: 'Team', percentage: 15, value: '150M' },
        { label: 'Ecosystem Growth', percentage: 8, value: '80M' },
        { label: 'Advisors', percentage: 5, value: '50M' },
      ],
      blocks: [
        {
          title: 'Supply Model',
          items: ['1B fixed supply', 'No hidden minting', 'Planned unlock schedule', 'DAO review'],
        },
        {
          title: 'Vesting',
          items: ['12-month team cliff', 'Locked LP', 'Treasury tranches', 'Advisor vesting'],
        },
        {
          title: 'Value Flow',
          items: ['Fee routing', 'Buyback triggers', 'Staking yield', 'Liquidity depth'],
        },
        {
          title: 'Community',
          items: ['Early access', 'Referral tiers', 'Ambassador program', 'Local chapters'],
        },
        {
          title: 'Security',
          items: ['Multi-sig treasury', 'Audit window', 'Rate limits', 'Emergency pause'],
        },
        {
          title: 'Roadmap',
          items: ['Presale', 'DEX launch', 'Staking V1', 'Governance V1'],
        },
      ],
      metrics: [
        { label: 'Presale Target', value: '$4.2M' },
        { label: 'Initial MCAP', value: '$780K' },
        { label: 'Treasury Reserve', value: '12%' },
        { label: 'DEX Liquidity', value: '18%' },
      ],
    },
    communitySection: {
      title: 'Join the Community',
      description:
        'Keep the entry point simple: collect interest, show the key channels and make next steps obvious.',
      formLabels: {
        name: 'Name',
        email: 'Email',
        message: 'Message',
        submit: 'Join Waitlist',
        namePlaceholder: 'Your name',
        emailPlaceholder: 'john@example.com',
        messagePlaceholder: 'Tell us briefly how you want to participate.',
      },
      waitlistSuccessMessage:
        'You have been added to the early-access list. Connect this form to your provider when you are ready.',
      channelsTitle: 'Channels',
      cards: [
        { title: 'Hackathon Track', value: 'Rise In x Soroban clicker coin concept' },
        { title: 'Launch Window', value: 'Demo campaign opens September 2026' },
      ],
      channels: [
        { label: 'Docs', href: '#' },
        { label: 'Audit', href: '#' },
        { label: 'X', href: '#' },
      ],
      quote:
        'Users stay longer when the token story is simple, the allocations are visible and the next step is obvious.',
    },
    footer: {
      copyright: '© 2026 Emira. Built as a Soroban-powered clicker coin story for hackathon demo and community launch.',
      meta: 'Stellar • Soroban • Clicker Coin • Community Rewards',
    },
  },
  tr: {
    locale: 'tr',
    brand: {
      name: 'Emira',
      ticker: '$EMR',
      tagline: 'Soroban ekosistemi icin gelistirilmis clicker coin hikayesi.',
    },
    navigation: {
      links: [
        { name: 'ANA SAYFA', href: '#hero' },
        { name: 'MODULLER', href: '#projects' },
        { name: 'TOKENOMICS', href: '#skills' },
        { name: 'TOPLULUK', href: '#contact' },
      ],
      cta: {
        label: 'On Satis Basvurusu',
        href: '#contact',
      },
    },
    hero: {
      badge: 'Net yapi, ongorulebilir token akisi ve topluluk odakli lansman',
      title: 'EMIRA',
      headline: 'Kullanicinin hizli anlayabilecegi daha sade bir kripto urun sayfasi.',
      description:
        'Emira; hackathon kapsaminda geliştirilen bir clicker coin tanitim projesidir. Token hikayesini, topluluk odullerini ve Soroban akilli sozlesme vizyonunu tek bir sade deneyimde birlestirir.',
      primaryCta: {
        label: 'Modulleri Incele',
        href: '#projects',
      },
      secondaryCta: {
        label: 'Tokenomics Gor',
        href: '#skills',
      },
      stats: [
        { label: 'Toplam Arz', value: '1B' },
        { label: 'Topluluk Payi', value: '42%' },
        { label: 'Staking Getirisi', value: '18%' },
      ],
      spotlight: {
        title: 'Okunabilir token ekonomisi',
        description:
          'Dagilim, kilit acilim planlari ve treasury politikasi; kullanicinin whitepaper okumadan da ana resmi anlayabilecegi sekilde sunulur.',
        tag: 'On Satis Q3 2026',
      },
    },
    modulesSection: {
      title: 'Temel Moduller',
      description:
        'Karmasik teknik dil yerine Emira icin onemli alanlar acikca anlatilir: clicker dongusu, Soroban odul mantigi, lansman akisi ve treasury modeli.',
      modules: [
        {
          title: 'Clicker Lansman Dongusu',
          description:
            'Dikkati aksiyona ceviren sade bir clicker tarzi akisi on satis ve kampanya momentumuna baglar.',
          tech: ['Clicker Loop', 'On Satis', 'Waitlist', 'Campaign'],
        },
        {
          title: 'Soroban Odul Sozlesmesi',
          description:
            'Odul ve kampanya state yapisi Soroban uzerinde dusunulur; proje boylece tanitimdan onchain katilima evrilebilir.',
          tech: ['Soroban', 'Rewards', 'State', 'Rust/Wasm'],
        },
        {
          title: 'Topluluk Buyume Raili',
          description:
            'Kullanici ilgisinin waitlist, referans mekanigi ve topluluk aktivasyonuna nasil donustugunu gosterir.',
          tech: ['Referral', 'Waitlist', 'X Community', 'Activation'],
        },
        {
          title: 'Treasury Vault',
          description:
            'Emira nin kampanya buyumesi, likidite ve treasury rezervlerini nasil dengeleyecegini sade sekilde aciklar.',
          tech: ['Treasury', 'Likidite', 'Rezervler', 'Buyback'],
        },
      ],
    },
    tokenomicsSection: {
      title: 'Tokenomics',
      description:
        'Bu alan artik daha kolay okunuyor: ust duzey metrikler, dagilim cubuklari ve hackathon clicker coin lansmani icin sade kurallar.',
      allocationTitle: 'Dagilim Ozeti',
      allocationDescription:
        'Arzin lansman aninda nasil paylastirildigini hizlica gosterir; kullanici dengeyi ve uzun vadeli tesvikleri daha rahat degerlendirir.',
      allocationLegendLabel: 'toplam arz icindeki pay',
      allocations: [
        { label: 'Topluluk ve Oduller', percentage: 42, value: '420M' },
        { label: 'Likidite', percentage: 18, value: '180M' },
        { label: 'Treasury', percentage: 12, value: '120M' },
        { label: 'Ekip', percentage: 15, value: '150M' },
        { label: 'Ekosistem Buyumesi', percentage: 8, value: '80M' },
        { label: 'Danismanlar', percentage: 5, value: '50M' },
      ],
      blocks: [
        {
          title: 'Arz Modeli',
          items: ['1B sabit arz', 'Gizli mint yok', 'Planli unlock takvimi', 'DAO denetimi'],
        },
        {
          title: 'Vesting',
          items: ['12 ay ekip cliff', 'LP lock', 'Treasury tranche', 'Danisman vesting'],
        },
        {
          title: 'Deger Akisi',
          items: ['Fee routing', 'Buyback tetikleyicileri', 'Staking getirisi', 'Likidite derinligi'],
        },
        {
          title: 'Topluluk',
          items: ['Erken erisim', 'Referans katmanlari', 'Ambassador programi', 'Yerel topluluklar'],
        },
        {
          title: 'Guvenlik',
          items: ['Multi-sig treasury', 'Audit sureci', 'Rate limits', 'Acil durdurma'],
        },
        {
          title: 'Yol Haritasi',
          items: ['On satis', 'DEX lansmani', 'Staking V1', 'Governance V1'],
        },
      ],
      metrics: [
        { label: 'On Satis Hedefi', value: '$4.2M' },
        { label: 'Baslangic MCAP', value: '$780K' },
        { label: 'Treasury Rezervi', value: '12%' },
        { label: 'DEX Likiditesi', value: '18%' },
      ],
    },
    communitySection: {
      title: 'Topluluga Katil',
      description:
        'Giris noktasini sade tutun: ilgiyi toplayin, ana kanallari gosterin ve sonraki adimi netlestirin.',
      formLabels: {
        name: 'Ad Soyad',
        email: 'E-posta',
        message: 'Mesaj',
        submit: 'Bekleme Listesine Katil',
        namePlaceholder: 'Adiniz',
        emailPlaceholder: 'ornek@mail.com',
        messagePlaceholder: 'Kisaca nasil katkida bulunmak istediginizi yazin.',
      },
      waitlistSuccessMessage:
        'Erken erisim listesine eklendiniz. Hazir oldugunuzda bu formu gercek servisinizle baglayabilirsiniz.',
      channelsTitle: 'Kanallar',
      cards: [
        { title: 'Hackathon Track', value: 'Rise In x Soroban clicker coin konsepti' },
        { title: 'Lansman Donemi', value: 'Demo kampanyasi Eylul 2026 tarihinde aciliyor' },
      ],
      channels: [
        { label: 'Docs', href: '#' },
        { label: 'Audit', href: '#' },
        { label: 'X', href: '#' },
      ],
      quote:
        'Token hikayesi basitse, dagilim gorunurse ve sonraki adim netse kullanici daha uzun sure kalir.',
    },
    footer: {
      copyright: '© 2026 Emira. Hackathon demosu ve topluluk lansmani icin Soroban odakli clicker coin hikayesi.',
      meta: 'Stellar • Soroban • Clicker Coin • Community Rewards',
    },
  },
};

export function getFallbackContent(locale: Locale): LandingContent {
  return fallbackContentByLocale[locale];
}
