import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  Gem,
  LogOut,
  Menu,
  Repeat,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import treeButton from './assets/agac1.png';
import neafIcon from './assets/neaf.png';
import ovaBackground from './assets/ova.jpg';
import { connectFreighter, inspectFreighter, type WalletConnection } from './lib/freighter';

type WalletUiState = 'checking' | 'missing' | 'ready' | 'connecting' | 'connected' | 'error';

const freighterInstallUrl = 'https://www.freighter.app/';

const navigation = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'NFT Muzesi', path: '/museum' },
  { name: 'Pazar', path: '/market' },
  { name: 'Profil', path: '/profile' },
  { name: 'Liderlik', path: '/leaderboard' },
];

const nftCollection = [
  { name: 'Genesis Emira', rarity: 'Legendary', power: '+18%', tone: 'from-amber-200 to-rose-300' },
  { name: 'Neon Falcon', rarity: 'Epic', power: '+12%', tone: 'from-sky-200 to-blue-400' },
  { name: 'Ruby Core', rarity: 'Rare', power: '+8%', tone: 'from-red-200 to-fuchsia-400' },
  { name: 'Mint Runner', rarity: 'Common', power: '+3%', tone: 'from-emerald-200 to-lime-300' },
];

type UpgradeKind = 'tap' | 'passive' | 'luck';

const upgrades = [
  {
    name: 'Tap Boost',
    description: 'Her tiklamada daha fazla NEAF kazan.',
    price: 1200,
    boost: 8,
    bonus: '+8 tap gucu',
    kind: 'tap' as UpgradeKind,
    icon: Zap,
  },
  {
    name: 'Hourly Flow',
    description: 'Her saat basi gelen pasif NEAF miktarini arttirir.',
    price: 4600,
    boost: 24,
    bonus: '+24/saat pasif NEAF',
    kind: 'passive' as UpgradeKind,
    icon: Clock,
  },
  {
    name: 'NFT Drop Lens',
    description: 'Tiklamalarda NFT cikma olasiligini yukseltir.',
    price: 9200,
    boost: 3,
    bonus: '+3% NFT sansi',
    kind: 'luck' as UpgradeKind,
    icon: Gem,
  },
];

const leaderboard = [
  { name: 'emira_queen', score: 884200, badge: 'Diamond' },
  { name: 'tapmaster', score: 761040, badge: 'Platinum' },
  { name: 'sorobanx', score: 640800, badge: 'Gold' },
  { name: 'you', score: 128450, badge: 'Silver' },
  { name: 'moonforge', score: 118030, badge: 'Bronze' },
];

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export default function App() {
  return (
    <BrowserRouter>
      <GameApp />
    </BrowserRouter>
  );
}

function GameApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [balance, setBalance] = useState(128450);
  const [tapPower, setTapPower] = useState(42);
  const [passiveIncome, setPassiveIncome] = useState(120);
  const [nftDropChance, setNftDropChance] = useState(1);
  const [combo, setCombo] = useState(1);
  const [owned, setOwned] = useState(['Genesis Emira']);
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
    setCombo((current) => (current >= 5 ? 1 : current + 1));
  };

  const buyUpgrade = (price: number, boost: number, kind: UpgradeKind) => {
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
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void text-text-primary">
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

      <main className="relative z-10 px-6 pb-24 pt-36 md:px-10 lg:px-16 xl:px-24">
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
                walletState={walletState}
                onTap={tapCoin}
                onBuyUpgrade={buyUpgrade}
              />
            }
          />
          <Route path="/museum" element={<MuseumPage owned={owned} onAddNft={(name) => setOwned((current) => (current.includes(name) ? current : [...current, name]))} />} />
          <Route path="/market" element={<MarketPage balance={balance} onBuyUpgrade={buyUpgrade} />} />
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
  walletState,
  onTap,
  onBuyUpgrade,
}: {
  balance: number;
  tapPower: number;
  passiveIncome: number;
  nftDropChance: number;
  combo: number;
  walletState: WalletUiState;
  onTap: () => void;
  onBuyUpgrade: (price: number, boost: number, kind: UpgradeKind) => void;
}) {
  return (
    <div className="mx-auto grid h-[calc(100vh-9.5rem)] max-w-7xl items-center gap-8 overflow-hidden lg:grid-cols-[1fr_430px]">
      <div className="grid h-full place-items-center lg:justify-items-start lg:pl-20 xl:pl-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative grid place-items-center"
        >
          <button
            className="tree-tap-button grid place-items-center transition active:scale-[1.018]"
            type="button"
            onClick={onTap}
            aria-label="NEAF kazanmak icin agaca tikla"
          >
            <img className="h-72 w-72 object-contain drop-shadow-[0_24px_40px_rgba(15,108,189,0.22)] sm:h-[29rem] sm:w-[29rem]" src={treeButton} alt="Emira agaci" />
          </button>
          <div className="pointer-events-none absolute bottom-8 rounded-full border border-surface bg-white/86 px-5 py-3 text-center shadow-sm backdrop-blur">
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
        className="min-h-[34rem] rounded-[1.75rem] border border-surface bg-white/92 p-6 shadow-lg backdrop-blur"
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Yukseltmeler</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <HomeStat label="Tap gucu" value={`+${tapPower}`} />
          <HomeStat label="Pasif/saat" value={formatNumber(passiveIncome)} />
          <HomeStat label="NFT sansi" value={`%${nftDropChance}`} />
          <HomeStat label="Bakiye" value={`${formatNumber(balance)} NEAF`} />
        </div>
        <div className="mt-5 space-y-4">
          {upgrades.map(({ name, description, price, boost, bonus, kind, icon: Icon }) => {
            const disabled = balance < price || walletState === 'checking' || walletState === 'connecting';
            return (
              <button
                key={name}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  disabled ? 'border-surface bg-deep/60 text-text-muted' : 'border-surface bg-white hover:-translate-y-0.5 hover:border-aurora-mid'
                }`}
                type="button"
                disabled={disabled}
                onClick={() => onBuyUpgrade(price, boost, kind)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-deep p-3 text-aurora-start">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">{name}</p>
                    <p className="text-xs leading-5 text-text-secondary">{description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-xs uppercase tracking-[0.14em]">
                  <span>{formatNumber(price)} NEAF</span>
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

function MuseumPage({ owned, onAddNft }: { owned: string[]; onAddNft: (name: string) => void }) {
  return (
    <div>
      <SectionHeader title="NFT Muzesi" description="Eski frontend'deki moduler kart mantigiyla koleksiyonu sergileyen oyun bolumu." />
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {nftCollection.map((nft, index) => {
          const isOwned = owned.includes(nft.name);
          return (
            <motion.article
              key={nft.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group rounded-[1.75rem] border border-surface bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-aurora-mid/30 hover:shadow-lg"
            >
              <div className={`grid aspect-square place-items-center rounded-[1.25rem] bg-gradient-to-br ${nft.tone}`}>
                <Gem className="h-16 w-16 text-white drop-shadow" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold">{nft.name}</h3>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{nft.rarity}</p>
                </div>
                <span className="rounded-full border border-surface bg-deep px-3 py-1 font-mono text-xs text-aurora-start">{nft.power}</span>
              </div>
              <button
                className={`mt-5 w-full rounded-full px-4 py-3 font-display text-sm font-bold ${
                  isOwned ? 'bg-neon/10 text-neon' : 'bg-aurora-mid text-white hover:bg-aurora-start'
                }`}
                type="button"
                onClick={() => onAddNft(nft.name)}
              >
                {isOwned ? 'Koleksiyonda' : 'Muzeye ekle'}
              </button>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function MarketPage({ balance, onBuyUpgrade }: { balance: number; onBuyUpgrade: (price: number, boost: number, kind: UpgradeKind) => void }) {
  return (
    <div>
      <SectionHeader title="Pazar" description="NEAF ile oyun ekonomisini guclendiren yukseltmeler." centered />
      <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-surface bg-white p-8 shadow-sm">
        <h3 className="font-display text-2xl font-bold">Yukseltmeler</h3>
        <div className="mt-6 space-y-4">
          {upgrades.map(({ name, description, price, boost, bonus, kind, icon: Icon }) => {
            const disabled = balance < price;
            return (
              <button
                key={name}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  disabled ? 'border-surface bg-deep/60 text-text-muted' : 'border-surface bg-white hover:-translate-y-0.5 hover:border-aurora-mid'
                }`}
                type="button"
                disabled={disabled}
                onClick={() => onBuyUpgrade(price, boost, kind)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-deep p-3 text-aurora-start">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold">{name}</p>
                    <p className="text-sm text-text-secondary">{description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                  <span>{formatNumber(price)} NEAF</span>
                  <span className="text-aurora-start">{bonus}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
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
      <SectionHeader title="Profil" description="Oyuncunun Telegram kimligi, lig durumu, cuzdan baglantisi ve oyun metrikleri." />
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
      <SectionHeader title="Liderlik Siralamasi" description="Haftalik yaris, oyuncu rozetleri ve odul havuzu icin ana liste." centered />
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
        className="absolute inset-0 h-full w-full object-cover opacity-[0.38]"
        src={ovaBackground}
        alt=""
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/52 via-void/56 to-void/68" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 108, 189, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 108, 189, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />
    </div>
  );
}

function SectionHeader({ title, description, centered = false }: { title: string; description: string; centered?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto mb-14 max-w-7xl ${centered ? 'text-center' : ''}`}
    >
      <h2 className="font-display text-4xl font-extrabold text-text-primary md:text-6xl">{title}</h2>
      <p className={`mt-4 max-w-3xl text-lg leading-relaxed text-text-secondary ${centered ? 'mx-auto' : ''}`}>{description}</p>
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
