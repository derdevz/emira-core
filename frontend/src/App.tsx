import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Gem,
  Grid3X3,
  LogOut,
  Menu,
  Repeat,
  Search,
  Settings2,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { BrowserRouter, HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import neafIcon from './assets/neaf.png';
import ovaBackground from './assets/ova.jpg';
import { useLeafSystem } from './hooks/useLeafSystem';
import { connectFreighter, inspectFreighter, type WalletConnection } from './lib/freighter';
import { isMarketplaceConfigured, resolveMarketplaceAddress, signAndSubmitMarketPayment } from './lib/stellarMarket';

type WalletUiState = 'checking' | 'missing' | 'ready' | 'connecting' | 'connected' | 'error';
type Rarity = 'Legendary' | 'Epic' | 'Rare' | 'Common';
type UpgradeKind = 'tap' | 'passive' | 'luck';
type PickerOption = { id: string; name: string; image: string; price?: number };
type LeaderboardPlayer = {
  name: string;
  badge: string;
  taps: number;
  balance: number;
  ownedCount: number;
  isSelf: boolean;
  avatar?: string | null;
  accent: string;
};

const freighterInstallUrl = 'https://www.freighter.app/';

const navigation = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Muze', path: '/museum' },
  { name: 'Pazar', path: '/market' },
  { name: 'Profil', path: '/profile' },
  { name: 'Liderlik', path: '/leaderboard' },
];

const nftAssets = import.meta.glob('./assets/game/nft/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const homeTreeAssets = import.meta.glob('./assets/game/ana-ekran-click/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const profileBackgroundAssets = import.meta.glob('./assets/game/profil-background/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const nftRarityScale: { rarity: Rarity; power: string; tone: string }[] = [
  { rarity: 'Legendary', power: '+18%', tone: 'from-amber-200 via-orange-200 to-rose-300' },
  { rarity: 'Epic', power: '+12%', tone: 'from-sky-200 via-cyan-200 to-blue-400' },
  { rarity: 'Rare', power: '+8%', tone: 'from-fuchsia-200 via-pink-200 to-rose-300' },
  { rarity: 'Common', power: '+3%', tone: 'from-emerald-200 via-lime-200 to-teal-300' },
];

const marketOwners = ['MOTTO45', 'neafguild', 'catkeeper', 'sorobanlabs', 'novaemira', 'collector_x'];
const marketBackgrounds = ['Gunesli Doku', 'Mavi Sis', 'Pembe Aura', 'Cam Bahce'];
const marketMoods = ['Merakli', 'Atik', 'Sakin', 'Keskin'];
const marketAccessories = ['Kolye', 'Alev Deseni', 'Pixel Isik', 'Retro Rozet', 'Aurora Iz'];
const comboCycleLength = 25;

function buildNftSummary(name: string, rarity: string) {
  return `${name} Emira evreninde ${rarity.toLowerCase()} sinifinda yer alan ozel bir koleksiyon parcasi.`;
}

function stellarAccessCopy(name: string) {
  return `${name} sadece Stellar aginda XLM ile edinilebilen ozel bir koleksiyon parcasi.`;
}

function buildNftStory(name: string, rarity: string, index: number) {
  const origins = [
    'Sisli ova sabahlarinda bulunan ilk izlerden biri olarak kayda gecti.',
    'Eski oyuncularin sezon sonu kasalarindan cikan nadir serilerden biri sayiliyor.',
    'Topluluk icindeki mini etkinlikler sirasinda adini duyuran NFT serilerinden biri oldu.',
    'Muze arsivine eklenmeden once uzun sure gizli koleksiyonda saklandi.',
  ];

  const moods = [
    'Sahibine vitrin prestiji ve koleksiyon hikayesi kazandirir.',
    'Gorunusu kadar anlatisi da oyuncular arasinda kolayca hatirlanir.',
    'Her sergide farkli bir yorumla anilan ikonik parcalardan biridir.',
    'Emira evrenindeki karakter odakli anlatinin guclu orneklerinden biri kabul edilir.',
  ];

  return `${name}, ${origins[index % origins.length]} ${rarity} kategorisindeki bu parca ${moods[index % moods.length]}`;
}

function toTitleCase(rawName: string) {
  return rawName
    .normalize('NFC')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const [first = '', ...rest] = [...word];
      return `${first.toLocaleUpperCase('tr-TR')}${rest.join('').toLocaleLowerCase('tr-TR')}`;
    })
    .join(' ');
}

function baseNameFromPath(path: string) {
  return path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? path;
}

const nftNameOverrides: Record<string, string> = {
  'acık kahve kedi': 'Açık Kahve Kedi',
  'ates kedisi': 'Ateş Kedisi',
  'balıkcı kedi': 'Balıkçı Kedi',
  'bogazicili kedi': 'Boğaziçili Kedi',
  'tatlı sşyah kedi': 'Tatlı Siyah Kedi',
  'kahve benekli kedi2': 'Kahve Benekli Kedi 2',
  'linux cat': 'Linux Cat',
  'reverse cart kedi': 'Reverse Cart Kedi',
};

function normalizeNftName(fileName: string) {
  const rawName = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = rawName.normalize('NFC').toLocaleLowerCase('tr-TR');
  return nftNameOverrides[normalizedKey] ?? toTitleCase(rawName);
}

function formatAssetName(path: string) {
  return toTitleCase(baseNameFromPath(path));
}

function initialsFromName(name: string) {
  return name
    .replace('@', '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

function safeFontClass(value: string) {
  return /[çğıöşüÇĞİÖŞÜ]/.test(value) ? 'font-soft-safe' : 'font-nft';
}

const rarityByName: Partial<Record<string, Rarity>> = {
  'Balıkçı Kedi': 'Legendary',
  'Ben10 Kedi': 'Legendary',
  Caska: 'Legendary',
  Guts: 'Legendary',
  'Winrar Kedi': 'Legendary',
  'Minecraft Kedisi': 'Legendary',
  'Ateş Kedisi': 'Epic',
  'Boşluk Kedisi': 'Epic',
  'Boğaziçili Kedi': 'Epic',
  'Bonibon Kedi': 'Epic',
  'Buz Kedi': 'Epic',
  'Elmas Kedi': 'Epic',
  'Coder Kedi': 'Epic',
  'Habibi Kedi': 'Epic',
  'Havalı Kedi': 'Epic',
  'Hipnoz Kedi': 'Epic',
  'Kabarcıklı Kedi': 'Epic',
  'Kral Kedi': 'Epic',
  'Linux Cat': 'Epic',
  'Marshmallow Kedi': 'Epic',
  'Reverse Cart Kedi': 'Epic',
  'Steve Kedisi': 'Epic',
  'Sünger Kedi': 'Epic',
  'Tuğla Kedi': 'Epic',
  'Tilkimsi Kedi': 'Rare',
  'Tılsımlı Kedi': 'Rare',
  'Şeker Kedi': 'Rare',
  'Siyahımsı Kedi': 'Rare',
  Tekir: 'Rare',
  'Siyah Beyaz Kedi': 'Rare',
  'Kurdeleli Kedi': 'Rare',
  'Kahve Benekli Kedi 2': 'Rare',
  'Kahve Kedi': 'Rare',
  'Gri Benekli Kedi': 'Rare',
};

const nftImageScaleByName: Partial<Record<string, number>> = {
  'Balıkçı Kedi': 0.9,
  'Ben10 Kedi': 0.92,
  Caska: 0.9,
  Guts: 0.9,
  'Winrar Kedi': 0.95,
  'Minecraft Kedisi': 0.93,
  'Boğaziçili Kedi': 0.86,
  'Bonibon Kedi': 0.9,
  'Buz Kedi': 0.88,
  'Coin Kedisi': 0.9,
  'Linux Cat': 0.92,
  'Reverse Cart Kedi': 0.92,
  'Sünger Kedi': 0.92,
  'İlgi Çekici Kedi': 0.94,
};

const rarityMeta = Object.fromEntries(nftRarityScale.map((item) => [item.rarity, item])) as Record<Rarity, { rarity: Rarity; power: string; tone: string }>;

const nftCollection = Object.entries(nftAssets)
  .sort(([left], [right]) => left.localeCompare(right, 'tr'))
  .map(([path, image], index) => {
    const fileName = path.split('/').pop() ?? path;
    const name = normalizeNftName(fileName);
    const rarity = rarityByName[name] ?? 'Common';
    const metadata = rarityMeta[rarity];

    return {
      name,
      image,
      summary: buildNftSummary(name, metadata.rarity),
      story: buildNftStory(name, metadata.rarity, index),
      price: 1800 + index * 275,
      tokenId: 4200 + index,
      owner: marketOwners[index % marketOwners.length],
      listed: index % 5 !== 0,
      lastSale: 1500 + index * 210,
      backgroundTrait: marketBackgrounds[index % marketBackgrounds.length],
      moodTrait: marketMoods[index % marketMoods.length],
      accessoryTrait: marketAccessories[index % marketAccessories.length],
      imageScale: nftImageScaleByName[name] ?? 0.92,
      ...metadata,
    };
  });

type NftItem = (typeof nftCollection)[number];

const homeTreeOptions = Object.entries(homeTreeAssets)
  .filter(([path]) => {
    const lower = path.toLocaleLowerCase('tr-TR');
    return !lower.includes('neaf') && !lower.includes('günes') && !lower.includes('gunes');
  })
  .sort(([left], [right]) => left.localeCompare(right, 'tr'))
  .map(([path, image]) => ({
    id: baseNameFromPath(path),
    name:
      (
        {
          agac1: 'Yumusak Tepe',
          agac2: 'Esinti Dali',
          akasya: 'Akasya Golgesi',
          'cicekli agac2': 'Bahar Buketi',
          'güllü agac': 'Gul Tacı',
          'kuru agac': 'Eski Koru',
        } as Record<string, string>
      )[baseNameFromPath(path)] ?? formatAssetName(path),
    image,
    price:
      ({
        agac1: 0,
        agac2: 1800,
        akasya: 3600,
        'cicekli agac2': 7200,
        'güllü agac': 12400,
        'kuru agac': 18600,
      } as Record<string, number>)[baseNameFromPath(path)] ?? 4200,
  }));

const profileBackgroundOptions = Object.entries(profileBackgroundAssets)
  .filter(([path]) => !path.endsWith('.DS_Store') && !path.includes('/ev3.'))
  .sort(([left], [right]) => left.localeCompare(right, 'tr'))
  .map(([path, image]) => ({
    id: baseNameFromPath(path),
    name:
      (
        {
          ev1: 'Pencere Isigi',
          ev2: 'Sakin Oda',
          ev4: 'Perde Izi',
          ev5: 'Aksam Bahcesi',
        } as Record<string, string>
      )[baseNameFromPath(path)] ?? `Profil Arka Plan`,
    image,
    price:
      (
        {
          ev1: 0,
          ev2: 2600,
          ev4: 5400,
          ev5: 9200,
        } as Record<string, number>
      )[baseNameFromPath(path)] ?? 3800,
  }));

const upgrades = [
  {
    id: 'tap-boost',
    name: 'Tap Boost',
    description: 'Her tiklamada daha fazla NEAF kazan.',
    price: 1200,
    boost: 2,
    bonus: '+2 tap gucu',
    kind: 'tap' as UpgradeKind,
    icon: Zap,
  },
  {
    id: 'hourly-flow',
    name: 'Hourly Flow',
    description: 'Her saat basi gelen pasif NEAF miktarini arttirir.',
    price: 4600,
    boost: 8,
    bonus: '+8/saat pasif NEAF',
    kind: 'passive' as UpgradeKind,
    icon: Clock,
  },
  {
    id: 'nft-drop-lens',
    name: 'NFT Drop Lens',
    description: 'Tiklamalarda NFT cikma olasiligini yukseltir.',
    price: 9200,
    boost: 0.1,
    bonus: '+0.1% NFT sansi',
    kind: 'luck' as UpgradeKind,
    icon: Gem,
  },
];

type UpgradeId = (typeof upgrades)[number]['id'];
type LeaderboardMode = 'taps' | 'balance' | 'owned';

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
const formatPercent = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const modalRoot = typeof document !== 'undefined' ? document.body : null;
const calculateUpgradePrice = (basePrice: number, level: number) => Math.round(basePrice * (1 + Math.log2(level + 1) * 0.92));

function NftArtwork({
  nft,
  className = '',
  imageClassName = '',
}: {
  nft: NftItem;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={`grid place-items-center overflow-hidden bg-gradient-to-br ${nft.tone} ${className}`}>
      <img
        className={`h-full w-full object-contain transition duration-500 ${imageClassName}`}
        style={{ transform: `scale(${nft.imageScale})` }}
        src={nft.image}
        alt={`${nft.name} NFT gorseli`}
        loading="lazy"
      />
    </div>
  );
}

export default function App() {
  const Router = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <GameApp />
    </Router>
  );
}

function GameApp() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isOpen, setIsOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [balance, setBalance] = useState(128450);
  const [tapPower, setTapPower] = useState(1);
  const [passiveIncome, setPassiveIncome] = useState(120);
  const [nftDropChance, setNftDropChance] = useState(1);
  const [combo, setCombo] = useState(1);
  const [selectedTreeId, setSelectedTreeId] = useState(() => homeTreeOptions[0]?.id ?? '');
  const [ownedTreeIds, setOwnedTreeIds] = useState<string[]>(() => (homeTreeOptions[0] ? [homeTreeOptions[0].id] : []));
  const [selectedProfileBackgroundId, setSelectedProfileBackgroundId] = useState(() => profileBackgroundOptions[0]?.id ?? '');
  const [ownedProfileBackgroundIds, setOwnedProfileBackgroundIds] = useState<string[]>(() =>
    profileBackgroundOptions[0] ? [profileBackgroundOptions[0].id] : [],
  );
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [upgradeLevels, setUpgradeLevels] = useState<Record<UpgradeId, number>>({
    'tap-boost': 0,
    'hourly-flow': 0,
    'nft-drop-lens': 0,
  });
  const [owned, setOwned] = useState<string[]>(() => nftCollection.slice(0, 3).map((nft) => nft.name));
  const [listedNftNames, setListedNftNames] = useState<string[]>(() => nftCollection.filter((nft) => nft.listed).map((nft) => nft.name));
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletState, setWalletState] = useState<WalletUiState>('checking');
  const [walletMessage, setWalletMessage] = useState('Freighter kontrol ediliyor.');
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    inspectFreighter()
      .then((status) => {
        if (status.state === 'connected') {
          setWallet(status.connection);
          setWalletState('connected');
          setWalletMessage('Freighter ile giris yapildi.');
          return;
        }

        setWallet(null);
        setWalletState(status.state);
        setWalletMessage(status.message);
      })
      .catch(() => {
        setWallet(null);
        setWalletState('error');
        setWalletMessage('Freighter durumu okunamadi.');
      });
  }, []);

  const handleConnectWallet = async () => {
    setWalletMenuOpen(false);
    setWalletState('connecting');
    setWalletMessage('Freighter izni bekleniyor.');
    try {
      const connection = await connectFreighter();
      setWallet(connection);
      setWalletState('connected');
      setWalletMessage('Freighter ile giris yapildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Freighter baglantisi basarisiz oldu.';
      setWallet(null);
      setWalletState(message.includes('bulunamadi') ? 'missing' : 'error');
      setWalletMessage(message);
    }
  };

  const handleDisconnectWallet = () => {
    setWallet(null);
    setWalletMenuOpen(false);
    setWalletState('ready');
    setWalletMessage('Cuzdan oturumu bu uygulamada kapatildi.');
  };

  const handleCopyAddress = async () => {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 1400);
  };

  const tapCoin = () => {
    const gain = tapPower * combo;
    setBalance((current) => current + gain);
    setCombo((current) => (current >= comboCycleLength ? 1 : current + 1));
  };

  const buyUpgrade = (id: UpgradeId, price: number, boost: number, kind: UpgradeKind) => {
    if (balance < price) return;
    setBalance((current) => current - price);
    if (kind === 'tap') {
      setTapPower((current) => current + boost);
    }
    if (kind === 'passive') {
      setPassiveIncome((current) => current + boost);
    }
    if (kind === 'luck') {
      setNftDropChance((current) => Number((current + boost).toFixed(1)));
    }
    setUpgradeLevels((current) => ({ ...current, [id]: current[id] + 1 }));
  };

  const buyTree = (id: string, price: number) => {
    if (ownedTreeIds.includes(id) || balance < price) return;
    setBalance((current) => current - price);
    setOwnedTreeIds((current) => [...current, id]);
  };

  const buyProfileBackground = (id: string, price: number) => {
    if (ownedProfileBackgroundIds.includes(id) || balance < price) return;
    setBalance((current) => current - price);
    setOwnedProfileBackgroundIds((current) => [...current, id]);
  };

  const handleToggleListing = (name: string) => {
    const nft = nftCollection.find((item) => item.name === name);
    if (!nft || !owned.includes(name)) return;
    setListedNftNames((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  };

  const handlePurchaseNft = async (nft: NftItem) => {
    if (!wallet) {
      throw new Error('XLM ile satin alma icin Freighter baglantisi gerekli.');
    }

    const receipt = await signAndSubmitMarketPayment({
      wallet,
      amountXlm: nft.price,
      memoText: `EMIRA-${nft.tokenId}`,
      destinationAddress: resolveMarketplaceAddress(wallet),
    });

    setOwned((current) => (current.includes(nft.name) ? current : [...current, nft.name]));
    setListedNftNames((current) => current.filter((item) => item !== nft.name));
    return receipt;
  };

  const leaderboardPlayers = useMemo(
    () => [
      { name: 'Emira Dreamer', badge: 'Yumusak Isik', taps: tapPower, balance, ownedCount: owned.length, isSelf: true, avatar: profileAvatar, accent: 'from-sky-200 to-cyan-300' },
      { name: 'Cloud Paws', badge: 'Sabah Yildizi', taps: 164, balance: 884200, ownedCount: 12, isSelf: false, accent: 'from-violet-200 to-fuchsia-300' },
      { name: 'Mint Whisker', badge: 'Ay Cizgisi', taps: 138, balance: 761040, ownedCount: 9, isSelf: false, accent: 'from-emerald-200 to-lime-300' },
      { name: 'Soroban Bloom', badge: 'Altin Esinti', taps: 121, balance: 640800, ownedCount: 7, isSelf: false, accent: 'from-amber-200 to-orange-300' },
      { name: 'Nova Nest', badge: 'Gun Batimi', taps: 88, balance: 118030, ownedCount: 4, isSelf: false, accent: 'from-rose-200 to-pink-300' },
    ],
    [balance, owned.length, profileAvatar, tapPower],
  );

  return (
    <div className={`relative overflow-x-hidden bg-void text-text-primary ${isHomePage ? 'h-screen overflow-y-hidden' : 'min-h-screen'}`}>
      <GridBackground />
      <ScrollToTop />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-surface/70 bg-white/80 backdrop-blur-xl"
      >
        <div className="grid h-[92px] grid-cols-[auto_1fr_auto] items-center px-6 md:px-10 lg:px-16 xl:px-24">
          <NavLink to="/" className="font-display text-3xl font-extrabold text-text-primary">
            Emira
          </NavLink>

          <div className="hidden justify-center md:flex">
            <div className="flex items-center gap-8">
              {navigation.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-1 font-soft text-2xl transition-colors ${
                      isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      <span
                        className={`absolute -bottom-2 left-0 h-0.5 rounded-full bg-aurora-mid transition-all duration-300 ${
                          isActive ? 'w-full' : 'w-0'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden justify-end md:flex">
            <WalletMenu
              wallet={wallet}
              state={walletState}
              copied={copiedAddress}
              onConnect={handleConnectWallet}
              onCopy={handleCopyAddress}
              onDisconnect={handleDisconnectWallet}
              onSwitch={handleConnectWallet}
              open={walletMenuOpen}
              onOpenChange={setWalletMenuOpen}
            />
          </div>

          <button className="justify-self-end text-text-primary md:hidden" type="button" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-surface/70 bg-white/95 md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
              {navigation.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `font-soft text-2xl ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              {walletState === 'missing' ? (
                <a
                  className="inline-flex w-fit rounded-full border border-aurora-mid/20 bg-aurora-mid px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white"
                  href={freighterInstallUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Freighter kur
                </a>
              ) : (
                <button
                  className="inline-flex w-fit rounded-full border border-aurora-mid/20 bg-aurora-mid px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white disabled:cursor-wait disabled:opacity-70"
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={walletState === 'checking' || walletState === 'connecting'}
                >
                  {walletButtonLabel(walletState, wallet)}
                </button>
              )}
            </div>
          </motion.div>
        ) : null}
      </motion.nav>

      <main className={`relative z-10 px-6 pt-30 md:px-10 lg:px-16 xl:px-24 ${isHomePage ? 'h-[calc(100svh-5.5rem)] overflow-hidden pb-0 md:pt-32' : 'pb-10 md:pt-34'}`}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                balance={balance}
                tapPower={tapPower}
                passiveIncome={passiveIncome}
                nftDropChance={nftDropChance}
                combo={combo}
                comboLimit={comboCycleLength}
                selectedTree={homeTreeOptions.find((tree) => tree.id === selectedTreeId) ?? homeTreeOptions[0]}
                treeOptions={homeTreeOptions}
                ownedTreeIds={ownedTreeIds}
                upgradeLevels={upgradeLevels}
                walletState={walletState}
                onTap={tapCoin}
                onSelectTree={setSelectedTreeId}
                onBuyTree={buyTree}
                onBuyUpgrade={buyUpgrade}
              />
            }
          />
          <Route path="/museum" element={<MuseumPage />} />
          <Route
            path="/market"
            element={
              <MarketPage
                wallet={wallet}
                walletState={walletState}
                ownedNftNames={owned}
                listedNftNames={listedNftNames}
                onToggleListing={handleToggleListing}
                onPurchaseNft={handlePurchaseNft}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                selectedBackground={profileBackgroundOptions.find((item) => item.id === selectedProfileBackgroundId) ?? profileBackgroundOptions[0]}
                backgroundOptions={profileBackgroundOptions}
                balance={balance}
                ownedBackgroundIds={ownedProfileBackgroundIds}
                onSelectBackground={setSelectedProfileBackgroundId}
                onBuyBackground={buyProfileBackground}
                profileAvatar={profileAvatar}
                onAvatarChange={setProfileAvatar}
                wallet={wallet}
                walletMessage={walletMessage}
              />
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage players={leaderboardPlayers} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function HomePage({
  balance,
  tapPower,
  passiveIncome,
  nftDropChance,
  combo,
  comboLimit,
  selectedTree,
  treeOptions,
  ownedTreeIds,
  upgradeLevels,
  walletState,
  onTap,
  onSelectTree,
  onBuyTree,
  onBuyUpgrade,
}: {
  balance: number;
  tapPower: number;
  passiveIncome: number;
  nftDropChance: number;
  combo: number;
  comboLimit: number;
  selectedTree?: PickerOption;
  treeOptions: PickerOption[];
  ownedTreeIds: string[];
  upgradeLevels: Record<UpgradeId, number>;
  walletState: WalletUiState;
  onTap: () => void;
  onSelectTree: (id: string) => void;
  onBuyTree: (id: string, price: number) => void;
  onBuyUpgrade: (id: UpgradeId, price: number, boost: number, kind: UpgradeKind) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const treeButtonRef = useRef<HTMLButtonElement | null>(null);
  const { canvasRef, burst, resize } = useLeafSystem();

  useEffect(() => {
    const syncCanvas = () => {
      const target = treeButtonRef.current;
      if (!target) return;
      resize(target.clientWidth, target.clientHeight);
    };

    syncCanvas();
    window.addEventListener('resize', syncCanvas);
    return () => window.removeEventListener('resize', syncCanvas);
  }, [resize, selectedTree?.id]);

  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-4 lg:grid-cols-[1fr_392px] lg:overflow-hidden">
      <div className="relative grid h-full place-items-center lg:justify-items-start lg:pl-18 xl:pl-24">
        <button
          className="absolute left-0 top-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface bg-white/92 text-text-secondary shadow-sm transition hover:border-aurora-mid hover:text-aurora-start"
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Ana ekran agac ayarlari"
        >
          <Settings2 size={20} />
        </button>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative grid place-items-center select-none"
        >
          <button
            ref={treeButtonRef}
            className="tree-tap-button relative grid place-items-center select-none transition active:scale-[1.018]"
            type="button"
            onClick={(event) => {
              onTap();
              const rect = event.currentTarget.getBoundingClientRect();
              burst(event.clientX - rect.left, event.clientY - rect.top);
            }}
            aria-label="NEAF kazanmak icin agaca tikla"
          >
            <img
              className="pointer-events-none h-60 w-60 object-contain drop-shadow-[0_24px_40px_rgba(15,108,189,0.22)] sm:h-[22rem] sm:w-[22rem] xl:h-[24rem] xl:w-[24rem]"
              src={selectedTree?.image ?? homeTreeOptions[0]?.image}
              alt="Emira agaci"
              draggable={false}
            />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
          </button>
          <div className="-mt-1 pointer-events-none rounded-full border border-surface bg-white/88 px-5 py-3 text-center shadow-sm backdrop-blur sm:-mt-3">
            <div className="flex items-center justify-center gap-2">
              <img className="h-8 w-8 object-contain" src={neafIcon} alt="" aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold text-text-primary">{formatNumber(balance)}</span>
            </div>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">NEAF x{combo}/{comboLimit} / +{tapPower}</p>
          </div>
        </motion.div>
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-[1.6rem] border border-surface bg-white/92 p-5 shadow-lg backdrop-blur lg:-translate-y-2"
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Yukseltmeler</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <HomeStat label="Tap gucu" value={`+${tapPower}`} />
          <HomeStat label="Pasif/saat" value={formatNumber(passiveIncome)} />
          <HomeStat label="NFT sansi" value={`%${formatPercent(nftDropChance)}`} />
          <HomeStat label="Bakiye" value={`${formatNumber(balance)} NEAF`} />
        </div>
        <div className="mt-4 space-y-3.5">
          {upgrades.map(({ id, name, description, price, boost, bonus, kind, icon: Icon }) => {
            const level = upgradeLevels[id];
            const currentPrice = calculateUpgradePrice(price, level);
            return (
              <button
                key={name}
                className={`w-full rounded-2xl border p-3.5 text-left transition ${
                  balance < currentPrice || walletState === 'checking' || walletState === 'connecting'
                    ? 'border-surface bg-deep/60 text-text-muted'
                    : 'border-surface bg-white hover:-translate-y-0.5 hover:border-aurora-mid'
                }`}
                type="button"
                disabled={balance < currentPrice || walletState === 'checking' || walletState === 'connecting'}
                onClick={() => onBuyUpgrade(id, currentPrice, boost, kind)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-deep p-3 text-aurora-start">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">{name}</p>
                    <p className="text-xs leading-5 text-text-secondary">{description}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">Seviye {level}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em]">
                  <span>{formatNumber(currentPrice)} NEAF</span>
                  <span className="text-aurora-start">{bonus}</span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.aside>
      {settingsOpen ? (
        <AssetPickerModal
          title="Agac secimi"
          subtitle="Ana ekran ayarlari"
          selectedTreeId={selectedTree?.id ?? ''}
          options={treeOptions}
          balance={balance}
          ownedOptionIds={ownedTreeIds}
          onClose={() => setSettingsOpen(false)}
          onPurchase={onBuyTree}
          onSelect={(id) => {
            onSelectTree(id);
            setSettingsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MuseumPage() {
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);

  return (
    <div>
      <SectionHeader title="Muze" />
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {nftCollection.map((nft, index) => {
          return (
            <motion.article
              key={nft.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group cursor-pointer rounded-[1.75rem] border border-surface bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-aurora-mid/30 hover:shadow-lg"
              onClick={() => setSelectedNft(nft)}
            >
              <NftArtwork nft={nft} className="aspect-square rounded-[1.25rem]" imageClassName="p-4 group-hover:scale-[1.03]" />
              <div className="mt-5 flex items-center justify-between gap-3">
                <h3 className={`${safeFontClass(nft.name)} text-2xl text-text-primary`}>{nft.name}</h3>
                <span className="rounded-full border border-surface bg-deep px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {nft.rarity}
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
      {selectedNft ? <MuseumDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} /> : null}
    </div>
  );
}

function MarketPage({
  wallet,
  walletState,
  ownedNftNames,
  listedNftNames,
  onToggleListing,
  onPurchaseNft,
}: {
  wallet: WalletConnection | null;
  walletState: WalletUiState;
  ownedNftNames: string[];
  listedNftNames: string[];
  onToggleListing: (name: string) => void;
  onPurchaseNft: (nft: NftItem) => Promise<{ hash: string; recipient: string; amount: string }>;
}) {
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sortMode, setSortMode] = useState<'low' | 'high'>('low');
  const [isCompactGrid, setIsCompactGrid] = useState(false);

  const marketItems = nftCollection;

  const filteredItems = marketItems
    .filter((nft) => (rarityFilter === 'all' ? true : nft.rarity === rarityFilter))
    .filter((nft) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return [nft.name, nft.owner, nft.backgroundTrait, nft.accessoryTrait].some((value) => value.toLowerCase().includes(term));
    })
    .sort((left, right) => (sortMode === 'low' ? left.price - right.price : right.price - left.price));

  return (
    <div>
      <SectionHeader title="Pazar" centered />
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-surface bg-white/88 p-5 shadow-lg backdrop-blur lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[1.5rem] border border-surface bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-2xl font-bold text-text-primary">Nadirlik</p>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-surface bg-deep px-3 py-2 text-text-muted transition hover:border-aurora-mid hover:text-aurora-start"
              type="button"
              onClick={() => {
                setRarityFilter('all');
                setSearchTerm('');
                setSortMode('low');
                setIsCompactGrid(false);
              }}
              aria-label="Pazar filtrelerini sifirla"
            >
              <SlidersHorizontal size={18} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Sifirla</span>
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {['all', 'Legendary', 'Epic', 'Rare', 'Common'].map((rarity) => (
              <button
                key={rarity}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  rarityFilter === rarity
                    ? 'border-aurora-mid/30 bg-aurora-mid/8 text-text-primary'
                    : 'border-surface text-text-secondary hover:border-aurora-mid/20 hover:text-text-primary'
                }`}
                type="button"
                onClick={() => setRarityFilter(rarity as 'all' | Rarity)}
              >
                <span>{rarity === 'all' ? 'Tum seviyeler' : rarity}</span>
                <span className="text-xs text-text-muted">{rarity === 'all' ? nftCollection.length : nftCollection.filter((nft) => nft.rarity === rarity).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-surface bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-surface bg-deep/70 px-4 py-3">
              <Search size={18} className="text-text-muted" />
              <input
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="NFT adi, sahibi ya da trait ara"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-surface bg-deep/70 px-4 py-3 text-sm text-text-secondary"
                type="button"
                onClick={() => setIsCompactGrid((current) => !current)}
              >
                <Grid3X3 size={16} />
                {isCompactGrid ? 'Liste' : 'Izgara'}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-surface bg-deep/70 px-4 py-3 text-sm text-text-secondary"
                type="button"
                onClick={() => setSortMode((current) => (current === 'low' ? 'high' : 'low'))}
              >
                <ArrowUpDown size={16} />
                {sortMode === 'low' ? 'Fiyat dusukten yuksege' : 'Fiyat yuksekten dusuge'}
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${isCompactGrid ? 'md:grid-cols-1 xl:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
            {filteredItems.map((nft) => (
              <button
                key={nft.name}
                className={`overflow-hidden rounded-[1.35rem] border border-surface bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-aurora-mid/30 hover:shadow-lg ${
                  isCompactGrid ? 'md:grid md:grid-cols-[220px_1fr]' : ''
                }`}
                type="button"
                onClick={() => setSelectedNft(nft)}
              >
                <NftArtwork
                  nft={nft}
                  className={`${isCompactGrid ? 'aspect-auto h-full min-h-[220px]' : 'aspect-square'}`}
                  imageClassName="p-4"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`${safeFontClass(nft.name)} text-2xl text-text-primary`}>{nft.name}</p>
                      <p className="mt-1 text-sm text-text-muted">#{nft.tokenId}</p>
                    </div>
                    <span className="rounded-full border border-surface bg-deep px-3 py-1 text-xs text-text-secondary">{nft.rarity}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-text-secondary">Sahip {nft.owner}</span>
                    <span className="rounded-full border border-surface bg-deep px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      {listedNftNames.includes(nft.name) ? nft.rarity : 'Portfolyde'}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-surface pt-4">
                    <p className="font-display text-2xl font-extrabold text-text-primary">{formatNumber(nft.price)} XLM</p>
                    <p className="mt-1 text-sm text-text-muted">Stellar pazarinda listelenir</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedNft ? (
            <MarketDetailModal
              nft={selectedNft}
              wallet={wallet}
              walletState={walletState}
              isOwned={ownedNftNames.includes(selectedNft.name)}
              isListed={listedNftNames.includes(selectedNft.name)}
              onToggleListing={onToggleListing}
              onPurchase={onPurchaseNft}
              onClose={() => setSelectedNft(null)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MuseumDetailModal({
  nft,
  onClose,
}: {
  nft: NftItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/35 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-4xl rounded-[2rem] border border-surface bg-white p-6 shadow-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">NFT detay penceresi</p>
            <h3 className={`mt-2 ${safeFontClass(nft.name)} text-4xl text-text-primary md:text-5xl`}>{nft.name}</h3>
          </div>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <NftArtwork nft={nft} className="aspect-square rounded-[1.75rem]" imageClassName="p-6" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{nft.rarity}</span>
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">Stellar koleksiyonu</span>
            </div>
            <p className="mt-5 text-base leading-7 text-text-secondary">{stellarAccessCopy(nft.name)}</p>
            <div className="mt-6 rounded-[1.4rem] border border-surface bg-deep/70 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Hikayesi</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{nft.story}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MarketDetailModal({
  nft,
  wallet,
  walletState,
  isOwned,
  isListed,
  onToggleListing,
  onPurchase,
  onClose,
}: {
  nft: NftItem;
  wallet: WalletConnection | null;
  walletState: WalletUiState;
  isOwned: boolean;
  isListed: boolean;
  onToggleListing: (name: string) => void;
  onPurchase: (nft: NftItem) => Promise<{ hash: string; recipient: string; amount: string }>;
  onClose: () => void;
}) {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const content = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/25 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-surface bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Pazar detay</p>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[0.95fr_1.05fr] md:items-start md:p-8">
          <NftArtwork nft={nft} className="aspect-square rounded-[1.5rem]" imageClassName="p-5" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{nft.rarity}</span>
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">Stellar / XLM</span>
            </div>
            <h3 className={`mt-4 ${safeFontClass(nft.name)} text-4xl text-text-primary md:text-5xl`}>{nft.name}</h3>
            <p className="mt-3 font-display text-3xl font-extrabold text-text-primary">{formatNumber(nft.price)} XLM</p>
            <p className="mt-2 text-sm text-text-secondary">Sahip {nft.owner} · Token #{nft.tokenId}</p>
            <p className="mt-6 text-base leading-7 text-text-secondary">{stellarAccessCopy(nft.name)}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-surface bg-deep/70 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Koleksiyon</p>
                <p className="mt-2 text-sm text-text-secondary">{nft.backgroundTrait}</p>
              </div>
              <div className="rounded-[1.25rem] border border-surface bg-deep/70 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Stellar notu</p>
                <p className="mt-2 text-sm text-text-secondary">{nft.moodTrait} · {nft.accessoryTrait}</p>
              </div>
            </div>
            {submitMessage ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  submitState === 'error'
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {submitMessage}
              </div>
            ) : null}
            <div className="mt-6">
              {isOwned ? (
                <button
                  className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => onToggleListing(nft.name)}
                >
                  {isListed ? 'Listeden kaldir' : 'XLM ile listele'}
                </button>
              ) : walletState === 'connected' && isMarketplaceConfigured(wallet) ? (
                <button
                  className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={submitState === 'submitting'}
                  onClick={async () => {
                    try {
                      setSubmitState('submitting');
                      setSubmitMessage('Freighter uzerinde XLM islemi imzalaniyor.');
                      const receipt = await onPurchase(nft);
                      setSubmitState('success');
                      setSubmitMessage(`Islem gonderildi: ${receipt.hash}`);
                    } catch (error) {
                      setSubmitState('error');
                      setSubmitMessage(error instanceof Error ? error.message : 'XLM islemi basarisiz oldu.');
                    }
                  }}
                >
                  {submitState === 'submitting' ? 'Imza bekleniyor' : 'XLM ile satin al'}
                </button>
              ) : walletState !== 'connected' ? (
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Satin alma icin Freighter baglanmali.</p>
              ) : (
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Pazar alici adresi ayarlanmamis. `VITE_STELLAR_MARKETPLACE_ADDRESS` gerekli.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return modalRoot ? createPortal(content, modalRoot) : content;
}

function ProfilePage({
  selectedBackground,
  backgroundOptions,
  balance,
  ownedBackgroundIds,
  onSelectBackground,
  onBuyBackground,
  profileAvatar,
  onAvatarChange,
  wallet,
  walletMessage,
}: {
  selectedBackground?: { id: string; name: string; image: string };
  backgroundOptions: PickerOption[];
  balance: number;
  ownedBackgroundIds: string[];
  onSelectBackground: (id: string) => void;
  onBuyBackground: (id: string, price: number) => void;
  profileAvatar: string | null;
  onAvatarChange: (url: string | null) => void;
  wallet: WalletConnection | null;
  walletMessage: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const viewedPlayer = new URLSearchParams(location.search).get('player') ?? '@emira_player';
  const isOwnProfile = viewedPlayer === '@emira_player';

  return (
    <div>
      <SectionHeader title="Profil" />
      <div className="mx-auto max-w-7xl">
        {isOwnProfile ? (
          <div className="mb-4 flex items-center gap-3">
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface bg-white/92 text-text-secondary shadow-sm transition hover:border-aurora-mid hover:text-aurora-start"
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Profil arka plan ayarlari"
            >
              <Settings2 size={20} />
            </button>
          </div>
        ) : null}
        <div className="relative overflow-hidden rounded-[2rem] border border-surface bg-white shadow-sm">
          {isOwnProfile ? (
            <button
              className="absolute right-6 top-6 z-20 inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border border-surface bg-white/94 text-text-secondary shadow-lg transition hover:border-aurora-mid hover:text-aurora-start"
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Profil resmi ekle"
            >
              {profileAvatar ? <img className="h-full w-full object-cover" src={profileAvatar} alt="Profil resmi" /> : <span className="font-soft text-3xl">+</span>}
            </button>
          ) : null}
          <div className="relative h-[40rem] bg-[#f8f3e7]">
            <img className="h-full w-full object-contain object-center" src={selectedBackground?.image} alt={selectedBackground?.name ?? 'Profil arka plani'} />
            <div className="absolute inset-0 bg-gradient-to-t from-white/92 via-white/18 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Profil arka plan preview</p>
              <h3 className="mt-3 font-display text-4xl font-extrabold text-text-primary">{viewedPlayer}</h3>
              <p className="mt-2 max-w-xl text-sm text-text-secondary">{isOwnProfile && wallet ? `${wallet.network} agi aktif` : isOwnProfile ? walletMessage : 'Topluluk profili goruntuleniyor.'}</p>
            </div>
          </div>
        </div>
        {isOwnProfile ? (
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onAvatarChange(URL.createObjectURL(file));
            }}
          />
        ) : null}
      </div>
      {settingsOpen && isOwnProfile ? (
        <AssetPickerModal
          title="Profil arka plani"
          subtitle="Profil ayarlari"
          selectedTreeId={selectedBackground?.id ?? ''}
          options={backgroundOptions}
          balance={balance}
          ownedOptionIds={ownedBackgroundIds}
          imageClassName="object-cover"
          onClose={() => setSettingsOpen(false)}
          onPurchase={onBuyBackground}
          onSelect={(id) => {
            onSelectBackground(id);
            setSettingsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function LeaderboardPage({
  players,
}: {
  players: LeaderboardPlayer[];
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LeaderboardMode>('taps');
  const ranking = [...players].sort((left, right) => {
    if (mode === 'taps') return right.taps - left.taps;
    if (mode === 'balance') return right.balance - left.balance;
    return right.ownedCount - left.ownedCount;
  });

  return (
    <div>
      <SectionHeader title="Liderlik Siralamasi" centered />
      <div className="mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        {[
          { key: 'taps', label: 'Tiklama' },
          { key: 'balance', label: 'Neaf Bakiyesi' },
          { key: 'owned', label: "Sahip Olunan NFT" },
        ].map((item) => (
          <button
            key={item.key}
            className={`rounded-full border px-5 py-3 font-soft text-lg transition ${
              mode === item.key ? 'border-aurora-mid/30 bg-aurora-mid/8 text-text-primary' : 'border-surface bg-white text-text-secondary hover:border-aurora-mid/20 hover:text-text-primary'
            }`}
            type="button"
            onClick={() => setMode(item.key as LeaderboardMode)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-surface bg-white shadow-sm">
        {ranking.map((player, index) => (
          <div key={player.name} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-surface/70 px-6 py-5 last:border-b-0">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl font-display font-extrabold ${index < 3 ? 'bg-aurora-mid/10 text-aurora-start' : 'bg-deep text-text-secondary'}`}>
              {index + 1}
            </div>
            <div className="flex items-center gap-4">
              <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[1.15rem] bg-gradient-to-br ${player.accent} text-sm font-display font-extrabold text-text-primary`}>
                {player.avatar ? <img className="h-full w-full object-cover" src={player.avatar} alt={`${player.name} avatar`} /> : initialsFromName(player.name)}
              </div>
              <div>
                <p className={`${safeFontClass(player.name)} text-2xl text-text-primary`}>{player.name}</p>
                <p className="mt-1 inline-flex rounded-full border border-surface bg-deep px-3 py-1 font-soft text-xs text-text-secondary">{player.badge}</p>
              </div>
            </div>
            <div className="justify-self-end text-right">
              <p className="font-display text-lg font-extrabold">
                {mode === 'taps' ? `+${player.taps}` : mode === 'balance' ? formatNumber(player.balance) : player.ownedCount}
              </p>
              <button
                className="mt-2 rounded-full border border-aurora-mid/20 bg-aurora-mid/8 px-3 py-1 font-soft text-xs text-aurora-start"
                type="button"
                onClick={() => navigate(`/profile?player=${encodeURIComponent(player.name)}`)}
              >
                Yolculuk
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetPickerModal({
  title,
  subtitle,
  selectedTreeId,
  options,
  imageClassName = 'object-contain',
  balance,
  ownedOptionIds,
  onClose,
  onPurchase,
  onSelect,
}: {
  title: string;
  subtitle: string;
  selectedTreeId: string;
  options: PickerOption[];
  imageClassName?: string;
  balance?: number;
  ownedOptionIds?: string[];
  onClose: () => void;
  onPurchase?: (id: string, price: number) => void;
  onSelect: (id: string) => void;
}) {
  const [draftId, setDraftId] = useState(selectedTreeId);

  const selectedIndex = Math.max(0, options.findIndex((item) => item.id === draftId));
  const current = options[selectedIndex] ?? options[0];
  const previous = options[(selectedIndex - 1 + options.length) % options.length];
  const next = options[(selectedIndex + 1) % options.length];
  const ownedIds = ownedOptionIds ?? options.map((item) => item.id);
  const isOwned = ownedIds.includes(current.id);
  const canAfford = balance === undefined || (current.price ?? 0) <= balance;
  const isSelected = current.id === selectedTreeId;

  const content = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/25 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl rounded-[2rem] border border-surface bg-white p-6 shadow-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">{subtitle}</p>
            <h3 className="mt-2 font-soft text-4xl text-text-primary">{title}</h3>
          </div>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-5">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface bg-deep text-text-secondary transition hover:border-aurora-mid hover:text-aurora-start"
              type="button"
              onClick={() => setDraftId(previous.id)}
              aria-label="Onceki oge"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="overflow-hidden rounded-[1.6rem] border border-surface bg-white shadow-sm">
              <div className="grid aspect-[1.15/0.9] place-items-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5">
                <img className={`h-full max-h-72 w-full ${imageClassName}`} src={current.image} alt={current.name} />
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <span className="font-soft text-3xl text-text-primary">{current.name}</span>
                  {!isOwned && (current.price ?? 0) > 0 ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-surface bg-deep px-3 py-1">
                      <img className="h-4 w-4 object-contain" src={neafIcon} alt="" aria-hidden="true" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{formatNumber(current.price ?? 0)} NEAF</span>
                    </div>
                  ) : null}
                </div>
                <span className="rounded-full border border-surface bg-deep px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {selectedIndex + 1}/{options.length}
                </span>
              </div>
            </div>
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface bg-deep text-text-secondary transition hover:border-aurora-mid hover:text-aurora-start"
              type="button"
              onClick={() => setDraftId(next.id)}
              aria-label="Sonraki oge"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            {options.map((item, index) => (
              <button
                key={item.id}
                className={`h-2.5 rounded-full transition ${index === selectedIndex ? 'w-8 bg-aurora-mid' : 'w-2.5 bg-surface hover:bg-text-muted/40'}`}
                type="button"
                onClick={() => setDraftId(item.id)}
                aria-label={`${item.name} sec`}
              />
            ))}
          </div>
          <div className="flex justify-center">
            {isOwned ? (
              <button
                className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start"
                type="button"
                onClick={() => onSelect(current.id)}
              >
                {isSelected ? 'Secili' : 'Sec'}
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-55"
                type="button"
                disabled={!canAfford}
                onClick={() => onPurchase?.(current.id, current.price ?? 0)}
              >
                <img className="h-4 w-4 object-contain" src={neafIcon} alt="" aria-hidden="true" />
                {formatNumber(current.price ?? 0)} NEAF
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return modalRoot ? createPortal(content, modalRoot) : content;
}

function WalletMenu({
  wallet,
  state,
  copied,
  open,
  onConnect,
  onCopy,
  onDisconnect,
  onSwitch,
  onOpenChange,
}: {
  wallet: WalletConnection | null;
  state: WalletUiState;
  copied: boolean;
  open: boolean;
  onConnect: () => void;
  onCopy: () => void;
  onDisconnect: () => void;
  onSwitch: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  if (state === 'missing') {
    return (
      <a
        className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-white transition-colors hover:bg-aurora-start"
        href={freighterInstallUrl}
        target="_blank"
        rel="noreferrer"
      >
        Freighter kur
      </a>
    );
  }

  if (!wallet) {
    return (
      <button
        className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-white transition-colors hover:bg-aurora-start disabled:cursor-wait disabled:opacity-70"
        type="button"
        onClick={onConnect}
        disabled={state === 'checking' || state === 'connecting'}
      >
        {walletButtonLabel(state, wallet)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-3 rounded-full border border-aurora-mid/20 bg-aurora-mid px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-white transition-colors hover:bg-aurora-start"
        type="button"
        onClick={() => onOpenChange(!open)}
      >
        {shortAddress(wallet.address)}
        <ChevronDown size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 top-16 w-80 rounded-[1.25rem] border border-surface bg-white p-3 shadow-lg">
          <div className="border-b border-surface px-3 pb-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{wallet.network}</p>
            <p className="mt-1 break-all font-mono text-sm text-text-primary">{wallet.address}</p>
          </div>
          <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-text-secondary hover:bg-deep hover:text-text-primary" type="button" onClick={onCopy}>
            {copied ? <Check size={18} className="text-neon" /> : <Copy size={18} />}
            {copied ? 'Adres kopyalandi' : 'Cuzdan adresini kopyala'}
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-text-secondary hover:bg-deep hover:text-text-primary" type="button" onClick={onSwitch}>
            <Repeat size={18} />
            Cuzdan degistir
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-500 hover:bg-red-50" type="button" onClick={onDisconnect}>
            <LogOut size={18} />
            Cuzdandan cikis yap
          </button>
        </div>
      ) : null}
    </div>
  );
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function walletButtonLabel(state: WalletUiState, wallet: WalletConnection | null) {
  if (wallet) return shortAddress(wallet.address);
  if (state === 'checking') return 'Kontrol';
  if (state === 'connecting') return 'Bekleniyor';
  if (state === 'missing') return 'Freighter kur';
  return 'Freighter giris';
}

function HomeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-surface bg-deep px-4 py-3">
      <p className="font-display text-lg font-extrabold text-text-primary">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return null;
}

function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <img
        className="absolute inset-0 h-full w-full object-cover opacity-[0.5]"
        src={ovaBackground}
        alt=""
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-void/44 to-void/56" />
      <div
        className="absolute inset-0 opacity-24"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 108, 189, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 108, 189, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />
    </div>
  );
}

function SectionHeader({ title, description, centered = false }: { title: string; description?: string; centered?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto mb-14 max-w-7xl ${centered ? 'text-center' : ''}`}
    >
      <h2 className="font-display text-4xl font-extrabold text-text-primary md:text-6xl">{title}</h2>
      {description ? <p className={`mt-4 max-w-5xl text-lg leading-relaxed text-text-secondary ${centered ? 'mx-auto' : ''}`}>{description}</p> : null}
    </motion.div>
  );
}
