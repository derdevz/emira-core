import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Gem,
  Grid3X3,
  LogOut,
  Menu,
  Repeat,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { BrowserRouter, HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import treeButton from './assets/agac1.png';
import neafIcon from './assets/neaf.png';
import ovaBackground from './assets/ova.jpg';
import { connectFreighter, inspectFreighter, type WalletConnection } from './lib/freighter';

type WalletUiState = 'checking' | 'missing' | 'ready' | 'connecting' | 'connected' | 'error';
type Rarity = 'Legendary' | 'Epic' | 'Rare' | 'Common';
type UpgradeKind = 'tap' | 'passive' | 'luck';

const freighterInstallUrl = 'https://www.freighter.app/';

const navigation = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Muze', path: '/museum' },
  { name: 'Pazar', path: '/market' },
  { name: 'Profil', path: '/profile' },
  { name: 'Liderlik', path: '/leaderboard' },
];

const nftAssets = import.meta.glob('../../nft/*.{png,jpg,jpeg,webp,avif}', {
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

function buildNftSummary(name: string, rarity: string) {
  return `${name} Emira evreninde ${rarity.toLowerCase()} sinifinda yer alan ozel bir koleksiyon parcasi.`;
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

const nftNameOverrides: Record<string, string> = {
  'acık kahve kedi': 'Açık Kahve Kedi',
  'ates kedisi': 'Ateş Kedisi',
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

const nftCollection = Object.entries(nftAssets)
  .sort(([left], [right]) => left.localeCompare(right, 'tr'))
  .map(([path, image], index) => {
    const metadata = nftRarityScale[index % nftRarityScale.length];
    const fileName = path.split('/').pop() ?? path;
    const name = normalizeNftName(fileName);

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
      ...metadata,
    };
  });

type NftItem = (typeof nftCollection)[number];

const upgrades = [
  {
    id: 'tap-boost',
    name: 'Tap Boost',
    description: 'Her tiklamada daha fazla NEAF kazan.',
    price: 1200,
    boost: 8,
    bonus: '+8 tap gucu',
    kind: 'tap' as UpgradeKind,
    icon: Zap,
  },
  {
    id: 'hourly-flow',
    name: 'Hourly Flow',
    description: 'Her saat basi gelen pasif NEAF miktarini arttirir.',
    price: 4600,
    boost: 24,
    bonus: '+24/saat pasif NEAF',
    kind: 'passive' as UpgradeKind,
    icon: Clock,
  },
  {
    id: 'nft-drop-lens',
    name: 'NFT Drop Lens',
    description: 'Tiklamalarda NFT cikma olasiligini yukseltir.',
    price: 9200,
    boost: 3,
    bonus: '+3% NFT sansi',
    kind: 'luck' as UpgradeKind,
    icon: Gem,
  },
];

type UpgradeId = (typeof upgrades)[number]['id'];

const leaderboard = [
  { name: 'emira_queen', score: 884200, badge: 'Diamond' },
  { name: 'tapmaster', score: 761040, badge: 'Platinum' },
  { name: 'sorobanx', score: 640800, badge: 'Gold' },
  { name: 'you', score: 128450, badge: 'Silver' },
  { name: 'moonforge', score: 118030, badge: 'Bronze' },
];

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

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
  const [tapPower, setTapPower] = useState(42);
  const [passiveIncome, setPassiveIncome] = useState(120);
  const [nftDropChance, setNftDropChance] = useState(1);
  const [combo, setCombo] = useState(1);
  const [upgradeLevels, setUpgradeLevels] = useState<Record<UpgradeId, number>>({
    'tap-boost': 0,
    'hourly-flow': 0,
    'nft-drop-lens': 0,
  });
  const [owned] = useState<string[]>(() => nftCollection.slice(0, 1).map((nft) => nft.name));
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
    setCombo((current) => current + 1);
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
      setNftDropChance((current) => current + boost);
    }
    setUpgradeLevels((current) => ({ ...current, [id]: current[id] + 1 }));
  };

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
                    `relative font-mono text-sm transition-colors ${
                      isActive ? 'text-aurora-start' : 'text-text-secondary hover:text-aurora-start'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.name}
                      <span
                        className={`absolute -bottom-2 left-0 h-0.5 bg-aurora-mid transition-all duration-300 ${
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
                    `font-mono text-sm ${isActive ? 'text-aurora-start' : 'text-text-secondary hover:text-aurora-start'}`
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
                upgradeLevels={upgradeLevels}
                walletState={walletState}
                onTap={tapCoin}
                onBuyUpgrade={buyUpgrade}
              />
            }
          />
          <Route path="/museum" element={<MuseumPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/profile" element={<ProfilePage balance={balance} tapPower={tapPower} ownedCount={owned.length} wallet={wallet} walletState={walletState} walletMessage={walletMessage} onConnect={handleConnectWallet} />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
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
  upgradeLevels,
  walletState,
  onTap,
  onBuyUpgrade,
}: {
  balance: number;
  tapPower: number;
  passiveIncome: number;
  nftDropChance: number;
  combo: number;
  upgradeLevels: Record<UpgradeId, number>;
  walletState: WalletUiState;
  onTap: () => void;
  onBuyUpgrade: (id: UpgradeId, price: number, boost: number, kind: UpgradeKind) => void;
}) {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-4 lg:grid-cols-[1fr_392px] lg:overflow-hidden">
      <div className="grid h-full place-items-center lg:justify-items-start lg:pl-18 xl:pl-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid place-items-center select-none"
        >
          <button
            className="tree-tap-button grid place-items-center select-none transition active:scale-[1.018]"
            type="button"
            onClick={onTap}
            aria-label="NEAF kazanmak icin agaca tikla"
          >
            <img
              className="pointer-events-none h-60 w-60 object-contain drop-shadow-[0_24px_40px_rgba(15,108,189,0.22)] sm:h-[22rem] sm:w-[22rem] xl:h-[24rem] xl:w-[24rem]"
              src={treeButton}
              alt="Emira agaci"
              draggable={false}
            />
          </button>
          <div className="-mt-1 pointer-events-none rounded-full border border-surface bg-white/88 px-5 py-3 text-center shadow-sm backdrop-blur sm:-mt-3">
            <div className="flex items-center justify-center gap-2">
              <img className="h-8 w-8 object-contain" src={neafIcon} alt="" aria-hidden="true" />
              <span className="font-display text-2xl font-extrabold text-text-primary">{formatNumber(balance)}</span>
            </div>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">NEAF x{combo} / +{tapPower}</p>
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
          <HomeStat label="NFT sansi" value={`%${nftDropChance}`} />
          <HomeStat label="Bakiye" value={`${formatNumber(balance)} NEAF`} />
        </div>
        <div className="mt-4 space-y-3.5">
          {upgrades.map(({ id, name, description, price, boost, bonus, kind, icon: Icon }) => {
            const level = upgradeLevels[id];
            const currentPrice = Math.round(price * 1.45 ** level);
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
              <div className={`relative grid aspect-square place-items-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${nft.tone}`}>
                <img
                  className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
                  src={nft.image}
                  alt={`${nft.name} NFT gorseli`}
                  loading="lazy"
                />
                <span className="absolute bottom-3 right-3 rounded-full border border-white/45 bg-white/78 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-primary">
                  {nft.rarity}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-text-primary">{nft.name}</h3>
            </motion.article>
          );
        })}
      </div>
      {selectedNft ? <MuseumDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} /> : null}
    </div>
  );
}

function MarketPage() {
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sortMode, setSortMode] = useState<'low' | 'high'>('low');

  const filteredItems = nftCollection
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
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-white/8 bg-[#121214]/95 p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.28)] lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[1.5rem] border border-white/8 bg-[#17181c] p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-2xl font-bold">Nadirlik</p>
            <SlidersHorizontal size={18} className="text-white/60" />
          </div>
          <div className="mt-6 grid gap-3">
            {['all', 'Legendary', 'Epic', 'Rare', 'Common'].map((rarity) => (
              <button
                key={rarity}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  rarityFilter === rarity ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                }`}
                type="button"
                onClick={() => setRarityFilter(rarity as 'all' | Rarity)}
              >
                <span>{rarity === 'all' ? 'Tum seviyeler' : rarity}</span>
                <span className="text-xs text-white/40">{rarity === 'all' ? nftCollection.length : nftCollection.filter((nft) => nft.rarity === rarity).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-[#17181c] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
              <Search size={18} className="text-white/45" />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/32"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="NFT adi, sahibi ya da trait ara"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72" type="button">
                <Grid3X3 size={16} />
                Izgara
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72"
                type="button"
                onClick={() => setSortMode((current) => (current === 'low' ? 'high' : 'low'))}
              >
                <ArrowUpDown size={16} />
                {sortMode === 'low' ? 'Fiyat dusukten yuksege' : 'Fiyat yuksekten dusuge'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredItems.map((nft) => (
              <button
                key={nft.name}
                className="overflow-hidden rounded-[1.35rem] border border-white/8 bg-[#1a1c22] text-left transition hover:-translate-y-1 hover:border-white/18"
                type="button"
                onClick={() => setSelectedNft(nft)}
              >
                <div className={`relative grid aspect-square place-items-center bg-gradient-to-br ${nft.tone}`}>
                  <img className="h-full w-full object-contain p-3" src={nft.image} alt={`${nft.name} NFT gorseli`} loading="lazy" />
                  <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/28 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                    {nft.rarity}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold text-white">{nft.name}</p>
                      <p className="mt-1 text-sm text-white/50">#{nft.tokenId}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/68">{nft.power}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-white/48">Sahip {nft.owner}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${nft.listed ? 'bg-[#1e8cff]/18 text-[#65b3ff]' : 'bg-white/8 text-white/50'}`}>
                      {nft.listed ? 'Listede' : 'Hazirlaniyor'}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-white/8 pt-4">
                    <p className="font-display text-2xl font-extrabold text-white">{formatNumber(nft.price)} NEAF</p>
                    <p className="mt-1 text-sm text-white/44">Son fiyat {formatNumber(nft.lastSale)} NEAF</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedNft ? <MarketDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} /> : null}
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
            <h3 className="mt-2 font-display text-3xl font-extrabold text-text-primary md:text-4xl">{nft.name}</h3>
          </div>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <div className={`grid aspect-square place-items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${nft.tone}`}>
            <img className="h-full w-full object-contain p-6" src={nft.image} alt={`${nft.name} NFT gorseli`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{nft.rarity}</span>
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-aurora-start">{nft.power}</span>
              <span className="rounded-full border border-surface bg-deep px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">{formatNumber(nft.price)} NEAF</span>
            </div>
            <p className="mt-5 text-base leading-7 text-text-secondary">{nft.summary}</p>
            <div className="mt-6 rounded-[1.4rem] border border-surface bg-deep/70 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Hikayesi</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{nft.story}</p>
            </div>
            <p className="mt-6 text-sm text-text-secondary">Kart detaylari popup icinde acilir; gorsel solda, hikaye ve aciklama sag tarafta yer alir.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MarketDetailModal({ nft, onClose }: { nft: NftItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-6xl overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#111214] text-white shadow-[0_30px_90px_rgba(0,0,0,0.44)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            {nftCollection.slice(0, 8).map((item) => (
              <button
                key={item.name}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${item.name === nft.name ? 'border-white/40' : 'border-white/10'}`}
                type="button"
              >
                <img className="h-full w-full object-contain bg-white/6 p-1" src={item.image} alt="" />
              </button>
            ))}
          </div>
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70 transition hover:text-white" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/8 bg-[#0b0c0f] p-6 lg:border-b-0 lg:border-r">
            <div className={`grid aspect-square place-items-center rounded-[1.4rem] bg-gradient-to-br ${nft.tone}`}>
              <img className="h-full w-full object-contain p-8" src={nft.image} alt={`${nft.name} NFT gorseli`} />
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <h3 className="font-display text-4xl font-extrabold">{nft.name}</h3>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/58">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Sparkles size={14} />
                Emira Cats
              </span>
              <span>Sahip {nft.owner}</span>
              <span>Token #{nft.tokenId}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MarketMetric label="Top offer" value={`${formatNumber(nft.price - 125)} NEAF`} />
              <MarketMetric label="Taban fiyat" value={`${formatNumber(nft.price)} NEAF`} />
              <MarketMetric label="Rarity" value={nft.rarity} />
              <MarketMetric label="Last sale" value={`${formatNumber(nft.lastSale)} NEAF`} />
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/42">Liste fiyati</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span className="font-display text-5xl font-extrabold">{formatNumber(nft.price)}</span>
                <span className="pb-2 text-xl text-white/70">NEAF</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {nft.summary} Pazar detayinda hikaye, trait yapisi ve son hareketler birlikte izlenir.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button className="rounded-2xl bg-[#1e8cff] px-5 py-4 font-display text-lg font-bold text-white transition hover:bg-[#4aa2ff]" type="button">
                  Teklif ver
                </button>
                <button className="rounded-2xl border border-white/10 bg-transparent px-5 py-4 font-display text-lg font-bold text-white transition hover:bg-white/6" type="button">
                  Listeyi incele
                </button>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center gap-6 border-b border-white/8 pb-3 text-sm">
                <span className="border-b-2 border-white pb-3 font-display font-bold text-white">Detaylar</span>
                <span className="text-white/42">Aktivite</span>
                <span className="text-white/42">Teklifler</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <TraitCard label="Background" value={nft.backgroundTrait} percent="18%" />
                <TraitCard label="Mood" value={nft.moodTrait} percent="11%" />
                <TraitCard label="Accessory" value={nft.accessoryTrait} percent="7%" />
                <TraitCard label="Power" value={nft.power} percent="14%" />
                <TraitCard label="Collection" value={nft.rarity} percent="22%" />
                <TraitCard label="Story" value={nft.story} percent="Curated" long />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MarketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/38">{label}</p>
      <p className="mt-3 font-display text-2xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function TraitCard({ label, value, percent, long = false }: { label: string; value: string; percent: string; long?: boolean }) {
  return (
    <div className={`rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 ${long ? 'xl:col-span-3' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/42">{label}</p>
        <span className="rounded-full bg-[#1e8cff]/16 px-2.5 py-1 text-xs text-[#6ab5ff]">{percent}</span>
      </div>
      <p className={`mt-3 ${long ? 'text-sm leading-6 text-white/68' : 'font-display text-xl font-bold text-white'}`}>{value}</p>
    </div>
  );
}

function ProfilePage({
  balance,
  tapPower,
  ownedCount,
  wallet,
  walletState,
  walletMessage,
  onConnect,
}: {
  balance: number;
  tapPower: number;
  ownedCount: number;
  wallet: WalletConnection | null;
  walletState: WalletUiState;
  walletMessage: string;
  onConnect: () => void;
}) {
  return (
    <div>
      <SectionHeader title="Profil" />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-surface bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-deep text-aurora-start">
            <UserRound size={44} />
          </div>
          <h3 className="mt-6 font-display text-3xl font-extrabold">@emira_player</h3>
          <p className="mt-2 text-text-secondary">Silver II ligi</p>
          <button
            className="mt-6 rounded-full bg-aurora-mid px-6 py-3 font-display font-bold text-white hover:bg-aurora-start disabled:cursor-wait disabled:opacity-70"
            type="button"
            onClick={onConnect}
            disabled={walletState === 'checking' || walletState === 'connecting'}
          >
            {walletButtonLabel(walletState, wallet)}
          </button>
          <p className="mt-3 text-sm text-text-secondary">{wallet ? `${wallet.network} agi aktif` : walletMessage}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileMetric label="Toplam NEAF" value={formatNumber(balance)} />
          <ProfileMetric label="Tap gucu" value={`+${tapPower}`} />
          <ProfileMetric label="NFT sayisi" value={String(ownedCount)} />
          <ProfileMetric label="Gunluk seri" value="7 gun" />
          <ProfileMetric label="Gorev" value="68%" />
          <ProfileMetric label="Referans" value="12 kisi" />
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  return (
    <div>
      <SectionHeader title="Liderlik Siralamasi" centered />
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-surface bg-white shadow-sm">
        {leaderboard.map((player, index) => (
          <div key={player.name} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-surface/70 px-6 py-5 last:border-b-0">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl font-display font-extrabold ${index < 3 ? 'bg-aurora-mid/10 text-aurora-start' : 'bg-deep text-text-secondary'}`}>
              {index + 1}
            </div>
            <div>
              <p className="font-display text-lg font-bold">{player.name}</p>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{player.badge}</p>
            </div>
            <p className="font-display text-lg font-extrabold">{formatNumber(player.score)}</p>
          </div>
        ))}
      </div>
    </div>
  );
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

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.5rem] border border-surface bg-white p-6 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-extrabold text-text-primary">{value}</p>
    </article>
  );
}
