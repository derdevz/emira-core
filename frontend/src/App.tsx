import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Lock,
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
import lockedCatImage from './assets/locked-cat.png';
import bubbleMoon from './assets/bubbles/ay.png';
import bubbleHeart from './assets/bubbles/kalp.png';
import bubbleMusic from './assets/bubbles/muzik.png';
import bubbleDots from './assets/bubbles/nokta.png';
import bubbleQuestion from './assets/bubbles/soru.png';
import bubbleStar from './assets/bubbles/yildiz.png';
import { useLeafSystem } from './hooks/useLeafSystem';
import {
  authenticateTelegram,
  fetchAppConfig,
  fetchLeaderboard,
  fetchMarketListings,
  fetchProfile,
  fetchSession,
  linkWallet,
  prepareMarketCancel,
  prepareMarketListing,
  recordTap,
} from './lib/apiClient';
import { connectPrimaryWallet, inspectPrimaryWallet, type WalletConnection } from './lib/wallet';
import { buildTelegramMiniAppUrl, prepareTelegramWebApp, readTelegramWebAppContext, resolveTelegramInitData } from './lib/wallet/telegram';

type WalletUiState = 'checking' | 'missing' | 'ready' | 'connecting' | 'connected' | 'error';
type Rarity = 'Legendary' | 'Epic' | 'Rare' | 'Common';
type UpgradeKind = 'tap' | 'passive' | 'luck';
type PickerOption = { id: string; name: string; image: string; price?: number };
type LeaderboardPlayer = {
  id: string;
  username: string;
  name: string;
  badge: string;
  taps: number;
  balance: number;
  ownedCount: number;
  isSelf: boolean;
  avatar?: string | null;
  accent: string;
};

type MarketListing = {
  tokenId: number;
  name: string;
  rarity: Rarity;
  owner: string;
  priceXlm: number;
  settlement: string;
  network: string;
  requiresFreighter: boolean;
};

type CatDropResult = {
  nft: NftItem;
  chance: number;
  forced?: boolean;
};

type OwnedInventory = Record<string, number>;

type ProfileRecord = {
  id: string;
  username: string;
  displayName: string;
  badge: string;
  taps: number;
  balanceNeaf: number;
  ownedCount: number;
  walletAddress: string | null;
};

type AppRuntimeConfig = {
  wallets?: {
    telegram: string[];
    web: string[];
  };
  marketContractId?: string;
  rewardsContractId?: string;
  telegram?: {
    enabled?: boolean;
    botUsername?: string;
    webAppUrl?: string;
    launchUrl?: string | null;
    validationMode?: string;
  };
};

const freighterInstallUrl = 'https://www.freighter.app/';
const promoSiteUrl = import.meta.env.VITE_PROMO_SITE_URL ?? 'https://sopwit.github.io/Neaf-Web/';
const configuredMarketplaceAddress = import.meta.env.VITE_STELLAR_MARKETPLACE_ADDRESS ?? '';

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
const rarityRank: Record<Rarity, number> = {
  Legendary: 0,
  Epic: 1,
  Rare: 2,
  Common: 3,
};

const marketOwners = ['MOTTO45', 'neafguild', 'catkeeper', 'sorobanlabs', 'novaemira', 'collector_x'];
const marketBackgrounds = ['Gunesli Doku', 'Mavi Sis', 'Pembe Aura', 'Cam Bahce'];
const marketMoods = ['Merakli', 'Atik', 'Sakin', 'Keskin'];
const marketAccessories = ['Kolye', 'Alev Deseni', 'Pixel Isik', 'Retro Rozet', 'Aurora Iz'];
const comboCycleLength = 25;

function buildNftSummary(name: string, rarity: string) {
  return `${name} Emira evreninde ${rarity.toLowerCase()} sinifinda yer alan ozel bir koleksiyon parcasi.`;
}

function buildNftStory(name: string, rarity: string, index: number) {
  const story = nftStories[name];
  if (story) return story;

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

function stripTurkish(value: string) {
  return value
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİI]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[şŞ]/g, 's')
    .replace(/[üÜ]/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toTitleCase(rawName: string) {
  return stripTurkish(rawName)
    .normalize('NFC')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const [first = '', ...rest] = [...word];
      return `${first.toLocaleUpperCase('en-US')}${rest.join('').toLocaleLowerCase('en-US')}`;
    })
    .join(' ');
}

function baseNameFromPath(path: string) {
  return path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? path;
}

const nftNameOverrides: Record<string, string> = {
  'acik kahve kedi': 'Acik Kahve Kedi',
  'ates kedisi': 'Ates Kedisi',
  'balikci kedi': 'Balikci Kedi',
  'bogazicili kedi': 'Bogazicili Kedi',
  'tatli ssyah kedi': 'Tatli Siyah Kedi',
  'ilgi cekici kedi': 'Ilgi Cekici Kedi',
  'kahve benekli kedi2': 'Kahve Benekli Kedi 2',
  'ben10 kedi': 'Ben 10 Kedi',
  caska: 'Error Code 36',
  'winrar kedi': 'WinRar Kedi',
  'linux cat': 'Linux Cat',
  'reverse cart kedi': 'Reverse Cart Kedi',
};

function normalizeNftName(fileName: string) {
  const rawName = fileName.replace(/\.[^.]+$/, '');
  const normalizedKey = stripTurkish(rawName).normalize('NFC').toLocaleLowerCase('en-US');
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
  void value;
  return 'font-nft';
}

const rarityByName: Partial<Record<string, Rarity>> = {
  'Balikci Kedi': 'Legendary',
  'Ben 10 Kedi': 'Legendary',
  'Error Code 36': 'Legendary',
  Guts: 'Legendary',
  'WinRar Kedi': 'Legendary',
  'Minecraft Kedisi': 'Legendary',
  'Ates Kedisi': 'Epic',
  'Bosluk Kedisi': 'Epic',
  'Bogazicili Kedi': 'Epic',
  'Bonibon Kedi': 'Epic',
  'Coin Kedisi': 'Epic',
  'Buz Kedi': 'Epic',
  'Elmas Kedi': 'Epic',
  'Coder Kedi': 'Epic',
  'Habibi Kedi': 'Epic',
  'Havali Kedi': 'Epic',
  'Hipnoz Kedi': 'Epic',
  'Kabarcikli Kedi': 'Epic',
  'Kral Kedi': 'Epic',
  'Linux Cat': 'Epic',
  'Marshmallow Kedi': 'Epic',
  'Reverse Cart Kedi': 'Epic',
  'Steve Kedisi': 'Epic',
  'Sunger Kedi': 'Epic',
  'Tugla Kedi': 'Epic',
  'Acik Kahve Kedi': 'Rare',
  'Gri Kedi': 'Rare',
  'Ilgi Cekici Kedi': 'Rare',
  'Kahve Benekli Kedi': 'Rare',
  'Mavi Kedi': 'Rare',
  'Sari Benekli Kedi': 'Rare',
  'Sari Kedi': 'Rare',
  'Siyah Kedi': 'Rare',
  'Sokak Kedisi': 'Rare',
  'Tatli Kedi': 'Rare',
  'Tatli Siyah Kedi': 'Rare',
  'Tilkimsi Kedi': 'Rare',
  'Tilsimli Kedi': 'Rare',
  'Seker Kedi': 'Rare',
  'Siyahimsi Kedi': 'Rare',
  Tekir: 'Rare',
  'Siyah Beyaz Kedi': 'Rare',
  'Beyaz Kedi': 'Rare',
  'Kurdeleli Kedi': 'Rare',
  'Kahve Benekli Kedi 2': 'Rare',
  'Kahve Kedi': 'Rare',
  'Gri Benekli Kedi': 'Rare',
  'Kozmik Kedi': 'Rare',
};

const nftImageScaleByName: Partial<Record<string, number>> = {
  'Balikci Kedi': 0.9,
  'Ben 10 Kedi': 0.92,
  'Error Code 36': 0.9,
  Guts: 0.9,
  'WinRar Kedi': 0.95,
  'Minecraft Kedisi': 0.93,
  'Bogazicili Kedi': 0.86,
  'Bonibon Kedi': 0.9,
  'Buz Kedi': 0.88,
  'Coin Kedisi': 0.9,
  'Linux Cat': 0.92,
  'Reverse Cart Kedi': 0.92,
  'Sunger Kedi': 0.92,
  'Ilgi Cekici Kedi': 0.94,
};

const nftStories: Record<string, string> = {
  'Acik Kahve Kedi':
    'Acik Kahve Kedi, gunesli koy yollarinda dolasmayi seven sakin bir kedidir. Her tiklamada sahibine sabir ve bereket getirdigine inanilir. Sessiz gorunur ama sansli kasalarin kokusunu uzaktan alir.',
  'Gri Benekli Kedi':
    'Gri Benekli Kedi, sokaklarin en merakli gezginlerinden biridir. Uzerindeki beneklerin her biri, acilmis eski bir kasanin hatirasidir. Sahibini nadir odullere goturen kucuk ipuclarini hep o fark eder.',
  'Gri Kedi':
    'Gri Kedi, kalabaligin icinde kaybolmayi seven gizemli bir kedidir. Sessizce izler, dogru zamani bekler ve en kritik anda ortaya cikar. Liderlik tablosunda yukselmek isteyenlerin ugurlu dostudur.',
  'Ilgi Cekici Kedi':
    'Ilgi Cekici Kedi girdigi her profilde hemen fark edilir. Tatli bakislariyla rakiplerin dikkatini dagitir, sahibine ise ekstra motivasyon verir. Onu gorenler genelde "bu kedi normal degil" der.',
  'Kahve Benekli Kedi':
    'Kahve Benekli Kedi, eski haritalarin ve gizli sandiklarin pesinde gezen bir maceracidir. Benekleri ona kamuflaj saglar, bu yuzden kasalara herkesten once ulasir. En sevdigi sey, sahibinin envanterini surprizlerle doldurmaktir.',
  'Kahve Benekli Kedi 2':
    'Kahve Benekli Kedi 2, ilkinden daha sessiz ama daha stratejiktir. Her hamlesini hesaplar, sonra bir anda ortaya cikip odulu kapar. Ozellikle sabirli oyuncularla guclu bag kurar.',
  'Kahve Kedi':
    'Kahve Kedi, sicak kahve kokusunu ve uzun oyun seanslarini sever. Gece boyunca sahibinin yaninda bekler ve tiklama gucunu hic dusurmez. Sadakatiyle bilinen klasik ama degerli bir NFT kedisidir.',
  'Kurdeleli Kedi':
    'Kurdeleli Kedi, profil vitrinlerinin yildizi olmak icin dogmustur. Zarif gorunusunun arkasinda oldukca rekabetci bir ruh tasir. Liderlik tablosunda yukselen sahipleriyle gurur duyar.',
  'Mavi Kedi':
    'Mavi Kedi, ay isiginda parlayan nadir turlerden biridir. Renginin, eski bir Stellar gecidinden gectigi gun degistigi soylenir. Onu profiline koyan oyuncular, herkesten farkli gorunmeyi sever.',
  'Sari Benekli Kedi':
    'Sari Benekli Kedi, neseli enerjisiyle etrafindaki herkesi hizlandirir. Benekleri, actigi kasalardan cikan altin tozlariyla olusmustur. Sans ve eglenceyi ayni anda seven oyuncularin kedisidir.',
  'Sari Kedi':
    'Sari Kedi, gunesin temsilcisi gibi parlak ve pozitiftir. Tiklama serileri uzadikca daha da enerjik hale gelir. Oyuncular arasinda "moral kedisi" olarak taninir.',
  'Siyah Beyaz Kedi':
    'Siyah Beyaz Kedi, gece ve gunduz dengesini tasiyan asil bir kedidir. Ne tamamen sessizdir ne de fazla hareketli; tam dogru anda hamle yapar. Dengeli oyuncularin profilinde cok iyi durur.',
  'Siyah Kedi':
    'Siyah Kedi, kasalarin golgesinde yasayan gizemli bir figurdur. Bazilari onun ugursuz oldugunu soyler ama sahipleri tam tersini bilir. En beklenmedik anda nadir odul getirmesiyle unludur.',
  'Siyahimsi Kedi':
    'Siyahimsi Kedi, karanlikta kaybolup sadece gozleriyle kendini belli eder. Tamamen siyah degildir; uzerinde gecmis savaslardan kalan hafif izler tasir. Sessiz ama guclu karakterli oyunculara yakisir.',
  'Sokak Kedisi':
    'Sokak Kedisi, hicbir kasaya bedava guvenmeyen tecrubeli bir hayatta kalandir. Sehrin arka sokaklarinda tiklama ekonomisinin kurallarini ogrenmistir. Azla yetinir ama dogru sahibin elinde cok degerlenir.',
  'Seker Kedi':
    'Seker Kedi, tatli gorunusuyle herkesin kalbini calar. Ancak sevimliliginin arkasinda kasa acarken inanilmaz bir sans saklidir. Profilinde yumusak ve temiz bir hava isteyenler icin idealdir.',
  'Tatli Kedi':
    'Tatli Kedi, oyuncularin envanterinde huzur veren bir dosttur. Buyuk hedefleri yokmus gibi gorunur ama sahibini her gun oyuna dondurmeyi basarir. Basit, sevimli ve vazgecilmezdir.',
  'Tatli Siyah Kedi':
    'Tatli Siyah Kedi, karanlik gorunusune ragmen oldukca yumusak huyludur. Geceleri profil ekraninda sessizce bekler ve sahibinin basarilarini izler. Karanlik tema seven oyuncularin favorisidir.',
  Tekir:
    'Tekir, klasik sokak zekasini tasiyan cesur bir kedidir. Her ortamda hayatta kalir, her kasadan bir sey cikarma umudunu asla kaybetmez. Siradan gorunur ama en guvenilir dostlardan biridir.',
  'Tilkimsi Kedi':
    'Tilkimsi Kedi, kedi mi tilki mi oldugu hala tartisilan kurnaz bir NFTdir. Hizli dusunur, hizli hareket eder ve firsatlari kacirmaz. Pazar yerinde degerini bilen oyuncular tarafindan aranir.',
  'Tilsimli Kedi':
    'Tilsimli Kedinin boynundaki isaretin eski bir sans buyusu tasidigi soylenir. Kasalar acilirken sessizce parlar ve sahibine umut verir. Nadirlik pesinde kosan oyuncular icin ozel bir semboldur.',
  'Ates Kedisi':
    'Ates Kedisi, lavlarin icinden dogmus gibi gorunen enerjik bir kedidir. Her tiklamada icindeki alev biraz daha buyur. Sabirsiz, hizli ve agresif oynayan oyuncularin ruhunu temsil eder.',
  'Bogazicili Kedi':
    'Bogazicili Kedi, universite ogrencilerine ders anlatan bilge bir internet hocasindan ilham almistir. Zor konulari bile sakin sakin aciklar, sonra gidip bir kasa acar. Onun profilde olmasi "bu oyuncu hem calisir hem kazanir" mesaji verir.',
  'Bonibon Kedi':
    'Bonibon Kedi, rengarenk seker parcalariyla kapli neseli bir kedidir. Nereden gectiyse orada renkli izler birakir. Kasa acarken en sevdigi sey, siradan odulleri bile eglenceli gostermektir.',
  'Coder Kedi':
    'Coder Kedi, geceleri terminal isiginda yasayan dijital bir kedidir. Tuylerinin uzerinde akan yesil kodlar, onun blockchain aglariyla konusabildigini gosterir. Hatalari sessizce bulur, deploy aninda sahibinin yaninda durur.',
  'Coin Kedisi':
    'Coin Kedisi, altin pariltilari arasinda buyumus zengin ruhlu bir kedidir. Her tiklamanin bir gun buyuk kazanca donusecegine inanir. Marketplacete gosterisli durmayi seven oyuncular icin birebirdir.',
  'Elmas Kedi':
    'Elmas Kedi, buz gibi parlakligiyla nadirligin semboludur. Isigi farkli acilardan kirilir ve profil ekraninda hemen dikkat ceker. Onu elde eden oyuncular genelde kolay kolay satmak istemez.',
  Guts:
    'Guts, karanlik savaslardan gecmis yalniz ve sert bir kedidir. Buyuk kilici ve yipranmis gorunusu, onun asla pes etmeyen ruhunu anlatir. Zorlu grind yapan ve liderlik tablosunda savasan oyunculara yakisir.',
  'Habibi Kedi':
    'Habibi Kedi, col ruzgarlariyla gezen sicak kanli bir kedidir. Tarzi, durusu ve sakinligiyle her ortamda dikkat ceker. Sahibini sadece sansla degil, karizmayla da one cikarir.',
  'Havali Kedi':
    'Havali Kedi, gozlugunu takip hicbir seyi fazla ciddiye almadan yurur. Ama rahat tavrinin altinda iyi hesap yapan bir oyuncu ruhu vardir. Profilde "ben buradayim ve rahatim" demenin en iyi yoludur.',
  'Kral Kedi':
    'Kral Kedi, tiklama kralliginin altin tahtina goz diken asil bir kedidir. Taci sadece sus degildir; her zaferin ve her acilan kasanin semboludur. Liderlik tablosunun ust siralarinda gorunmek icin yaratilmistir.',
  'Linux Cat':
    'Linux Cat, acik kaynak dunyasinin sessiz kahramanidir. Penguen dostlariyla birlikte sistemleri ayakta tutar ve hatalari sabirla duzeltir. Docker, terminal ve gece mesaisi seven oyuncularin kedisidir.',
  'Minecraft Kedisi':
    'Minecraft Kedisi, bloklu dunyalardan cikip Stellar evrenine gelmistir. En sevdigi sey kaynak toplamak, gizli sandik bulmak ve kendi kucuk ussunu kurmaktir. Sabirli grind yapan oyuncularla cok iyi anlasir.',
  'Reverse Cart Kedi':
    'Reverse Cart Kedi, kurallari tersine cevirmeyi seven asi bir kedidir. Herkes ileri giderken o geri hamle yapar ve beklenmedik odulu kapar. Risk almayi seven oyuncular icin ozel bir koleksiyon parcasidir.',
  'Steve Kedisi':
    'Steve Kedisi, elindeki kilicla piksel evrenlerinden gelen cesur bir savascidir. Gorunusu sade olabilir ama macera ruhu cok buyuktur. Kasa acmayi madencilik gibi gorur: ne cikacagi asla belli olmaz.',
  'WinRar Kedi':
    'WinRar Kedi, yillardir "deneme surumu" ruhuyla yasamaya devam eden efsanevi bir kedidir. Sirtindaki arsiv renkleri, onun sikistirilmis hazineleri korudugunu gosterir. Envanteri duzenli tutmayi seven oyuncularin dostudur.',
  'Balikci Kedi':
    'Balikci Kedi, sakin gollerin kenarinda sabirla bekleyen bir avcidir. Her tiklamayi oltaya atilmis kucuk bir yem gibi gorur. Bazen en buyuk odulu yakalamak icin sadece beklemek gerektigini bilir.',
  'Ben 10 Kedi':
    'Ben 10 Kedi, uzayli enerjisiyle dolu yesil bir kahramandir. Farkli formlara donusemese de farkli oyun tarzlarina hemen uyum saglar. Genc, hizli ve enerjik oyuncularin favorisidir.',
  'Bosluk Kedisi':
    'Bosluk Kedisi, evrenin karanlik tarafinda kaybolmus gizemli bir varliktir. Vucudu isigi yutar, sadece dikkatli bakanlar onun gercek seklini gorebilir. En nadir kasalardan cikmis gibi duran soguk bir auraya sahiptir.',
  'Buz Kedi':
    'Buz Kedi, donmus yildizlardan dusen kristal tuylerle kaplidir. Ne kadar rekabet kizisirsa kizissin, o hep sogukkanli kalir. Stratejik oynayan ve acele etmeyen oyunculara yakisir.',
  'Hipnoz Kedi':
    'Hipnoz Kedinin tuylerinde donen desenlere uzun sure bakmak tehlikelidir. Rakiplerin dikkatini dagitir, sahibine ise odaklanma gucu verir. Pazar yerinde en gizemli kedilerden biri olarak bilinir.',
  'Kabarcikli Kedi':
    'Kabarcikli Kedi, kopukler ve baloncuklar arasinda dogmus neseli bir kedidir. Uzerindeki kabarciklar her tiklamada hafifce parlar. Eglenceli, temiz ve ferah profil tasarimlarina cok yakisir.',
  'Kozmik Kedi':
    'Kozmik Kedi, yildiz tozlari ve galaksi isiklariyla kapli efsanevi bir NFTdir. Geceleri profil ekraninda kucuk bir evren gibi parlar. Buyuk hedefleri olan oyuncular icin uzayin sessiz destegidir.',
  'Marshmallow Kedi':
    'Marshmallow Kedi, yumusak renkleri ve tatli gorunusuyle adeta seker dunyasindan gelmistir. Kirilgan gorunur ama sahibine moral verme konusunda cok gucludur. Sevimlilik ve nadirlik arasinda guzel bir denge kurar.',
  'Sunger Kedi':
    'Sunger Kedi, deniz altindan gelen turuncu ve delikli yapisiyla eglenceli bir karakterdir. Suyu, sansi ve komik anlari uzerine ceker. Oyunu fazla ciddiye almadan keyif almak isteyenlerin kedisidir.',
  'Tugla Kedi':
    'Tugla Kedi, saglamligi ve dayanikliligiyla bilinir. Duvar gibi durur, kolay kolay pes etmez ve uzun vadeli oyunculara eslik eder. Yavas ama emin adimlarla yukselenlerin semboludur.',
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
  })
  .sort((left, right) => rarityRank[left.rarity] - rarityRank[right.rarity] || left.name.localeCompare(right.name, 'tr'));

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
    name: 'Kedi Sans Mercegi',
    description: 'Her seviyede Common +%1, Rare +%0.1, Epic +%0.01, Legendary +%0.001 sans ekler.',
    price: 9200,
    boost: 1,
    bonus: '+1% temel NFT sansi',
    kind: 'luck' as UpgradeKind,
    icon: Gem,
  },
];

type UpgradeId = (typeof upgrades)[number]['id'];
type LeaderboardMode = 'taps' | 'balance' | 'owned';

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);
const formatPercent = (value: number) => (value >= 1 && Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));
const modalRoot = typeof document !== 'undefined' ? document.body : null;
const calculateUpgradePrice = (basePrice: number, level: number) => Math.round(basePrice * (1 + Math.log2(level + 1) * 1.25 + level * 0.18));
const dropRarityOrder: Rarity[] = ['Legendary', 'Epic', 'Rare', 'Common'];
const dropChanceMultiplier: Record<Rarity, number> = {
  Common: 1,
  Rare: 0.1,
  Epic: 0.01,
  Legendary: 0.001,
};
const bubbleImages = [bubbleMoon, bubbleHeart, bubbleMusic, bubbleDots, bubbleQuestion, bubbleStar];
const guestProfileCats = [
  ['Mavi Kedi', 'Tekir', 'Coin Kedisi'],
  ['Sari Kedi', 'Gri Kedi', 'Kahve Kedi'],
  ['Siyah Kedi', 'Kurdeleli Kedi', 'Tatli Kedi'],
];

const seededMarketListings: MarketListing[] = [
  {
    tokenId: 4208,
    name: 'Coin Kedisi',
    rarity: 'Epic',
    owner: 'catkeeper',
    priceXlm: 42,
    settlement: 'XLM',
    network: 'Stellar',
    requiresFreighter: true,
  },
  {
    tokenId: 4222,
    name: 'Mavi Kedi',
    rarity: 'Rare',
    owner: 'novaemira',
    priceXlm: 18,
    settlement: 'XLM',
    network: 'Stellar',
    requiresFreighter: true,
  },
  {
    tokenId: 4240,
    name: 'Tekir',
    rarity: 'Rare',
    owner: 'collector_x',
    priceXlm: 9,
    settlement: 'XLM',
    network: 'Stellar',
    requiresFreighter: true,
  },
];

function normalizeListings(listings: MarketListing[]) {
  const byToken = new Map<number, MarketListing>();
  [...seededMarketListings, ...listings].forEach((listing) => {
    const isLegacyAutoListing = (listing.tokenId === 4200 && listing.owner === 'MOTTO45') || (listing.tokenId === 4201 && listing.owner === 'neafguild');
    if (isLegacyAutoListing) return;
    const nft = nftCollection.find((item) => item.tokenId === listing.tokenId || item.name === listing.name);
    if (!nft) return;
    byToken.set(nft.tokenId, {
      ...listing,
      tokenId: nft.tokenId,
      name: nft.name,
      rarity: nft.rarity,
      priceXlm: Math.max(0.01, Number(listing.priceXlm) || nft.price),
    });
  });
  return [...byToken.values()];
}

function totalOwnedCats(inventory: OwnedInventory) {
  return Object.values(inventory).reduce((sum, count) => sum + count, 0);
}

function visibleOwnedCount(inventory: OwnedInventory, listedNames: string[], name: string) {
  return Math.max(0, (inventory[name] ?? 0) - (listedNames.includes(name) ? 1 : 0));
}

function addOwnedCat(inventory: OwnedInventory, name: string, amount = 1) {
  return {
    ...inventory,
    [name]: (inventory[name] ?? 0) + amount,
  };
}

function rollCatDrop(baseChancePercent: number): CatDropResult | null {
  for (const rarity of dropRarityOrder) {
    const chance = baseChancePercent * dropChanceMultiplier[rarity];
    if (Math.random() * 100 > chance) continue;
    const candidates = nftCollection.filter((nft) => nft.rarity === rarity);
    if (!candidates.length) continue;
    return {
      nft: candidates[Math.floor(Math.random() * candidates.length)],
      chance,
    };
  }
  return null;
}

function forceCatDrop(): CatDropResult {
  const candidates = nftCollection.filter((nft) => nft.rarity === 'Common');
  const fallbackCandidates = candidates.length ? candidates : nftCollection;
  return {
    nft: fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)],
    chance: 100,
    forced: true,
  };
}

function NftArtwork({
  nft,
  className = '',
  imageClassName = '',
  locked = false,
}: {
  nft: NftItem;
  className?: string;
  imageClassName?: string;
  locked?: boolean;
}) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${locked ? 'bg-[#d8d8d8]' : `bg-gradient-to-br ${nft.tone}`} ${className}`}>
      <img
        className={`h-full w-full object-contain transition duration-500 ${locked ? 'opacity-95 grayscale' : ''} ${imageClassName}`}
        style={{ transform: `scale(${locked ? 0.82 : nft.imageScale})` }}
        src={locked ? lockedCatImage : nft.image}
        alt={locked ? 'Kilitli kedi gorseli' : `${nft.name} NFT gorseli`}
        loading="lazy"
      />
      {locked ? (
        <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/88 text-text-muted shadow-sm">
          <Lock size={15} />
        </div>
      ) : null}
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
  const telegramContext = readTelegramWebAppContext();
  const fallbackTelegramLaunchUrl = buildTelegramMiniAppUrl();
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
  const [owned, setOwned] = useState<OwnedInventory>(() =>
    Object.fromEntries(nftCollection.slice(0, 3).map((nft, index) => [nft.name, index === 0 ? 2 : 1])),
  );
  const [listedNftNames, setListedNftNames] = useState<string[]>(() => seededMarketListings.map((listing) => listing.name));
  const [lastDrop, setLastDrop] = useState<CatDropResult | null>(null);
  const [dropToast, setDropToast] = useState<CatDropResult | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [profileDisplayName, setProfileDisplayName] = useState('Emira Dreamer');
  const [selectedProfileCatNames, setSelectedProfileCatNames] = useState<string[]>(() => nftCollection.slice(0, 3).map((nft) => nft.name));
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletState, setWalletState] = useState<WalletUiState>('checking');
  const [, setWalletMessage] = useState('Stellar cuzdan baglantisi kontrol ediliyor.');
  const [, setTelegramMessage] = useState(telegramContext.isTelegram ? 'Telegram oturumu kontrol ediliyor.' : 'Telegram Mini App bagli degil.');
  const [telegramSessionToken, setTelegramSessionToken] = useState<string | null>(() => localStorage.getItem('emira.telegram.session'));
  const [currentPlayer, setCurrentPlayer] = useState<ProfileRecord | null>(null);
  const [remoteLeaderboard, setRemoteLeaderboard] = useState<ProfileRecord[]>([]);
  const [marketListings, setMarketListings] = useState<MarketListing[]>(() => seededMarketListings);
  const dropMissesRef = useRef(0);
  const [walletSupport, setWalletSupport] = useState<{ telegram: string[]; web: string[] } | null>(null);
  const [appConfig, setAppConfig] = useState<AppRuntimeConfig | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const telegramLaunchUrl = appConfig?.telegram?.launchUrl ?? fallbackTelegramLaunchUrl;
  const telegramEnabled = Boolean(appConfig?.telegram?.enabled);

  const reloadLeaderboard = () =>
    fetchLeaderboard('taps')
      .then((payload) => {
        setRemoteLeaderboard(payload.items ?? []);
      })
      .catch(() => {});

  useEffect(() => {
    if (telegramContext.isTelegram) {
      prepareTelegramWebApp();
    }
  }, [telegramContext.isTelegram]);

  useEffect(() => {
    inspectPrimaryWallet()
      .then((status) => {
        if (status.state === 'connected') {
          setWallet(status.connection);
          setWalletState('connected');
          setWalletMessage(`${status.connection.provider === 'freighter' ? 'Freighter' : 'WalletConnect'} ile giris yapildi.`);
          return;
        }

        setWallet(null);
        setWalletState(status.state);
        setWalletMessage(status.message);
      })
      .catch(() => {
        setWallet(null);
        setWalletState('error');
        setWalletMessage('Stellar cuzdan durumu okunamadi.');
      });
  }, []);

  useEffect(() => {
    fetchAppConfig()
      .then((payload) => {
        setAppConfig(payload ?? null);
        setWalletSupport(payload.wallets ?? null);
      })
      .catch(() => {});

    fetchMarketListings()
      .then((payload) => {
        const listings = normalizeListings(payload.items ?? []);
        setMarketListings(listings);
        setListedNftNames(listings.map((item) => item.name));
      })
      .catch(() => {});

    void reloadLeaderboard();
  }, []);

  useEffect(() => {
    if (!telegramSessionToken) return;

    fetchSession(telegramSessionToken)
      .then((payload) => {
        if (!payload?.ok || !payload.player) {
          localStorage.removeItem('emira.telegram.session');
          setTelegramSessionToken(null);
          return;
        }

        setCurrentPlayer(payload.player);
        setTelegramMessage(`Telegram oturumu aktif: ${payload.player.username}`);
      })
      .catch(() => {
        localStorage.removeItem('emira.telegram.session');
        setTelegramSessionToken(null);
      });
  }, [telegramSessionToken]);

  useEffect(() => {
    if (!telegramContext.isTelegram || telegramSessionToken) return;

    const initData = resolveTelegramInitData(telegramContext);
    if (!initData) return;

    authenticateTelegram(initData)
      .then((payload) => {
        const token = payload?.session?.token;
        if (!token) return;
        localStorage.setItem('emira.telegram.session', token);
        setTelegramSessionToken(token);
        setCurrentPlayer(payload.player ?? null);
        setTelegramMessage(`Telegram oturumu aktif: ${payload.player?.username ?? '@guest'}`);
        void reloadLeaderboard();
      })
      .catch((error) => {
        setTelegramMessage(error instanceof Error ? error.message : 'Telegram oturumu acilamadi.');
      });
  }, [telegramContext, telegramSessionToken]);

  useEffect(() => {
    if (!wallet || !telegramSessionToken) return;

    linkWallet({
      sessionToken: telegramSessionToken,
      address: wallet.address,
      provider: wallet.provider,
    })
      .then((payload) => {
        if (!payload?.player) return;
        setCurrentPlayer(payload.player);
      })
      .catch(() => {});
  }, [telegramSessionToken, wallet]);

  const handleConnectWallet = async () => {
    setWalletMenuOpen(false);
    setWalletState('connecting');
    setWalletMessage('Stellar cuzdan izni bekleniyor.');
    try {
      const connection = await connectPrimaryWallet();
      setWallet(connection);
      setWalletState('connected');
      setWalletMessage(`${connection.provider === 'freighter' ? 'Freighter' : 'WalletConnect'} ile giris yapildi.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stellar cuzdan baglantisi basarisiz oldu.';
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

  const handleTelegramLogin = async () => {
    try {
      const initData = resolveTelegramInitData(telegramContext);
      if (!initData) {
        throw new Error(
          telegramContext.isTelegram
            ? 'Telegram initData eksik. Mini App ayarlari veya bot token dogrulanmali.'
            : telegramEnabled
              ? 'Telegram baglantisi sadece Mini App icinde acilir. Once Mini App ac.'
              : 'Telegram Mini App backend tarafinda henuz tam etkin degil. TELEGRAM_BOT_TOKEN, bot username ve public WebApp URL gerekli.',
        );
      }
      const payload = await authenticateTelegram(initData);
      const token = payload?.session?.token;
      if (!token) throw new Error('Telegram oturumu baslatilamadi.');
      localStorage.setItem('emira.telegram.session', token);
      setTelegramSessionToken(token);
      setCurrentPlayer(payload.player ?? null);
      setTelegramMessage(`Telegram oturumu aktif: ${payload.player?.username ?? '@guest'}`);
      void reloadLeaderboard();
    } catch (error) {
      setTelegramMessage(error instanceof Error ? error.message : 'Telegram oturumu acilamadi.');
    }
  };

  const handleCopyAddress = async () => {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 1400);
  };

  const tapCoin = () => {
    const gain = tapPower * combo;
    setTapCount((current) => current + 1);
    setBalance((current) => current + gain);
    setCombo((current) => (current >= comboCycleLength ? 1 : current + 1));

    if (walletState === 'connected' && wallet) {
      const drop = dropMissesRef.current >= 49 ? forceCatDrop() : rollCatDrop(nftDropChance);
      if (drop) {
        dropMissesRef.current = 0;
        setOwned((current) => addOwnedCat(current, drop.nft.name));
        setLastDrop(drop);
        setDropToast(drop);
      } else {
        dropMissesRef.current += 1;
      }
    }

    const playerId = currentPlayer?.id ?? 'emira_player';
    void recordTap(playerId)
      .then((payload) => {
        if (!payload?.progress) return;
        setRemoteLeaderboard((current) =>
          current.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  taps: player.taps + 1,
                  balanceNeaf: payload.progress.balanceNeaf,
                }
              : player,
          ),
        );
      })
      .catch(() => {});
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

  const handleToggleListing = async (name: string, priceXlm?: number) => {
    const nft = nftCollection.find((item) => item.name === name);
    if (!nft || (owned[name] ?? 0) <= 0) return { ok: false };
    if (!wallet) {
      throw new Error('Ilan vermek icin Freighter cuzdanini bagla.');
    }

    if (listedNftNames.includes(name)) {
      const payload = await prepareMarketCancel(nft.tokenId).catch(() => ({ ok: true, offline: true }));
      setListedNftNames((current) => current.filter((item) => item !== name));
      setMarketListings((current) => current.filter((item) => item.tokenId !== nft.tokenId));
      return payload;
    }

    const ownerAddress = wallet.address;
    const listingPrice = Math.max(0.01, priceXlm ?? nft.price);
    const payload = await prepareMarketListing({
      tokenId: nft.tokenId,
      ownerAddress,
      priceXlm: listingPrice,
      name: nft.name,
      rarity: nft.rarity,
      provider: wallet.provider,
    }).catch(() => ({
      ok: true,
      offline: true,
      listing: {
        tokenId: nft.tokenId,
        name: nft.name,
        rarity: nft.rarity,
        owner: ownerAddress,
        priceXlm: listingPrice,
        settlement: 'XLM',
        network: wallet.network,
        requiresFreighter: true,
      } satisfies MarketListing,
    }));
    setListedNftNames((current) => [...new Set([...current, name])]);
    if (payload?.listing) {
      setMarketListings((current) => {
        const next = current.filter((item) => item.tokenId !== payload.listing.tokenId);
        return [...next, payload.listing];
      });
    }
    return payload;
  };

  const handlePurchaseNft = async (nft: NftItem) => {
    if (!wallet) {
      throw new Error('XLM ile satin alma icin Stellar cuzdan baglantisi gerekli.');
    }

    const listing = marketListings.find((item) => item.name === nft.name || item.tokenId === nft.tokenId);
    const listingOwnerAddress = listing?.owner?.startsWith('G') ? listing.owner : undefined;
    const market = await import('./lib/stellarMarket');
    const receipt = await market.signAndSubmitMarketPayment({
      wallet,
      amountXlm: nft.price,
      memoText: `EMIRA-${nft.tokenId}`,
      destinationAddress: listingOwnerAddress ?? market.resolveMarketplaceAddress(wallet),
    });

    setOwned((current) => addOwnedCat(current, nft.name));
    setListedNftNames((current) => current.filter((item) => item !== nft.name));
    setMarketListings((current) => current.filter((item) => item.name !== nft.name));
    return receipt;
  };

  const marketItems = useMemo(() => {
    const listedByName = new Map(marketListings.map((item) => [item.name, item]));

    const listedItems = nftCollection
      .filter((item) => listedByName.has(item.name))
      .map((item) => {
        const listing = listedByName.get(item.name);
        return listing
          ? {
              ...item,
              price: listing.priceXlm,
              owner: listing.owner,
              rarity: listing.rarity,
            }
          : item;
      });

    return listedItems;
  }, [marketListings]);

  const leaderboardPlayers = useMemo(
    () => {
      const selfId = currentPlayer?.id ?? 'emira_player';
      const selfUsername = currentPlayer?.username ?? '@emira_player';
      const selfName = profileDisplayName || currentPlayer?.displayName || 'Emira Dreamer';
      const seedPlayers: ProfileRecord[] = [
        { id: 'luna_farmer', username: '@luna_farmer', displayName: 'Luna Farmer', badge: 'Ova Ustasi', taps: 820, balanceNeaf: 92000, ownedCount: 11, walletAddress: null },
        { id: 'stellar_mia', username: '@stellar_mia', displayName: 'Stellar Mia', badge: 'Pazar Gezgini', taps: 540, balanceNeaf: 146000, ownedCount: 8, walletAddress: null },
        { id: 'mint_whisker', username: '@mint_whisker', displayName: 'Mint Whisker', badge: 'Ay Cizgisi', taps: 310, balanceNeaf: 761040, ownedCount: 9, walletAddress: null },
        { id: 'cloud_paws', username: '@cloud_paws', displayName: 'Cloud Paws', badge: 'Sabah Yildizi', taps: 180, balanceNeaf: 884200, ownedCount: 12, walletAddress: null },
        { id: 'quiet_neaf', username: '@quiet_neaf', displayName: 'Quiet Neaf', badge: 'Yeni Yolcu', taps: 44, balanceNeaf: 38000, ownedCount: 4, walletAddress: null },
      ];
      const merged = [...seedPlayers, ...remoteLeaderboard.filter((player) => player.id !== selfId && !seedPlayers.some((seed) => seed.id === player.id))];
      const self: ProfileRecord = {
        id: selfId,
        username: selfUsername,
        displayName: selfName,
        badge: currentPlayer?.badge ?? 'Oyuncu',
        taps: tapCount,
        balanceNeaf: balance,
        ownedCount: totalOwnedCats(owned),
        walletAddress: wallet?.address ?? currentPlayer?.walletAddress ?? null,
      };

      return [self, ...merged].map((player, index) => {
        const isSelf = player.id === self.id;
        return {
          id: player.id,
          username: player.username,
          name: player.displayName,
          badge: player.badge,
          taps: isSelf ? tapCount : player.taps,
          balance: isSelf ? balance : player.balanceNeaf,
          ownedCount: isSelf ? totalOwnedCats(owned) : player.ownedCount,
          isSelf,
          avatar: isSelf ? profileAvatar : null,
          accent: [
            'from-sky-200 to-cyan-300',
            'from-violet-200 to-fuchsia-300',
            'from-emerald-200 to-lime-300',
            'from-amber-200 to-orange-300',
            'from-rose-200 to-pink-300',
          ][index % 5],
        };
      });
    },
    [balance, currentPlayer, owned, profileAvatar, profileDisplayName, remoteLeaderboard, tapCount, wallet?.address],
  );

  const walletInstallLabel = useMemo(() => {
    if (telegramContext.isTelegram) {
      return walletSupport?.telegram?.includes('walletconnect') ? 'WalletConnect hazir' : 'Telegram cüzdani hazirlaniyor';
    }
    return 'Freighter kur';
  }, [telegramContext.isTelegram, walletSupport]);

  useEffect(() => {
    if (!dropToast) return;
    const timeout = window.setTimeout(() => setDropToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [dropToast]);

  return (
    <div className={`relative overflow-x-hidden bg-void text-text-primary ${isHomePage ? 'h-screen overflow-y-hidden' : 'min-h-screen'}`}>
      <GridBackground />
      <ScrollToTop />
      <CatDropToast drop={dropToast} />

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
            <div className="flex items-center gap-3">
              <a
                className="rounded-full border border-surface bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                href={promoSiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Neaf Web
              </a>
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
              {!telegramContext.isTelegram && telegramLaunchUrl ? (
                <a
                  className="rounded-full border border-surface bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                  href={telegramLaunchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram Ac
                </a>
              ) : null}
            </div>
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
              <a
                className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary hover:text-text-primary"
                href={promoSiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Neaf Web
              </a>
              {!telegramContext.isTelegram && telegramLaunchUrl ? (
                <a
                  className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary hover:text-text-primary"
                  href={telegramLaunchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram Ac
                </a>
              ) : null}
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
                lastDrop={lastDrop}
                onTap={tapCoin}
                onSelectTree={setSelectedTreeId}
                onBuyTree={buyTree}
                onBuyUpgrade={buyUpgrade}
              />
            }
          />
          <Route path="/museum" element={<MuseumPage ownedInventory={owned} listedNftNames={listedNftNames} />} />
          <Route
            path="/market"
            element={
              <MarketPage
                marketItems={marketItems}
                wallet={wallet}
                walletState={walletState}
                ownedInventory={owned}
                listedNftNames={listedNftNames}
                onToggleListing={handleToggleListing}
                onPurchaseNft={handlePurchaseNft}
                walletInstallLabel={walletInstallLabel}
                isMarketplaceReady={Boolean(configuredMarketplaceAddress || wallet?.address)}
                telegramLaunchUrl={telegramLaunchUrl}
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
                ownedInventory={owned}
                listedNftNames={listedNftNames}
                selectedCatNames={selectedProfileCatNames}
                onSelectedCatNamesChange={setSelectedProfileCatNames}
                profileDisplayName={profileDisplayName}
                onProfileDisplayNameChange={setProfileDisplayName}
                telegramSessionToken={telegramSessionToken}
                currentPlayer={currentPlayer}
                onTelegramLogin={handleTelegramLogin}
                telegramLaunchUrl={telegramLaunchUrl}
              />
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage players={leaderboardPlayers} activeUsername={currentPlayer?.username ?? '@emira_player'} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function CatDropToast({ drop }: { drop: CatDropResult | null }) {
  return (
    <AnimatePresence>
      {drop ? (
        <motion.div
          key={drop.nft.name}
          initial={{ opacity: 0, x: 120, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 140, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed right-5 top-28 z-[70] flex w-[min(22rem,calc(100vw-2rem))] items-center gap-4 rounded-[1.35rem] border border-emerald-200 bg-white/96 p-4 text-emerald-900 shadow-2xl backdrop-blur"
        >
          <NftArtwork nft={drop.nft} className="h-20 w-20 shrink-0 rounded-2xl" imageClassName="p-2" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-600">
              {drop.forced ? 'Garanti yakalama' : 'Kedi yakalandi'}
            </p>
            <p className={`${safeFontClass(drop.nft.name)} truncate text-2xl text-text-primary`}>{drop.nft.name}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {drop.nft.rarity} / sans %{formatPercent(drop.chance)}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
  lastDrop,
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
  lastDrop: CatDropResult | null;
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
    <div className="mx-auto grid h-full max-w-7xl items-center gap-4 lg:grid-cols-[1fr_410px] lg:overflow-hidden">
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
        className="max-h-[calc(100svh-9rem)] overflow-y-auto rounded-[1.6rem] border border-surface bg-white/92 p-4 shadow-lg backdrop-blur"
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Yukseltmeler</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <HomeStat label="Tap gucu" value={`+${tapPower}`} />
          <HomeStat label="Pasif/saat" value={formatNumber(passiveIncome)} />
          <HomeStat label="NFT sansi" value={`%${formatPercent(nftDropChance)}`} />
          <HomeStat label="Bakiye" value={`${formatNumber(balance)} NEAF`} />
        </div>
        <div className="mt-3 rounded-2xl border border-surface bg-deep/70 p-3">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
            {(['Common', 'Rare', 'Epic', 'Legendary'] as Rarity[]).map((rarity) => (
              <div key={rarity} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                <span>{rarity}</span>
                <span className="font-mono">%{formatPercent(nftDropChance * dropChanceMultiplier[rarity])}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Drop sadece cuzdan bagliyken roll alir.
          </p>
        </div>
        {lastDrop ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <img className="h-12 w-12 rounded-xl bg-white object-contain p-1" src={lastDrop.nft.image} alt="" aria-hidden="true" />
            <div>
              <p className="font-display text-base font-extrabold">{lastDrop.nft.name} acildi</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em]">Roll sansi %{formatPercent(lastDrop.chance)} / {lastDrop.nft.rarity}</p>
            </div>
          </div>
        ) : null}
        <div className="mt-3 space-y-2.5">
          {upgrades.map(({ id, name, description, price, boost, bonus, kind, icon: Icon }) => {
            const level = upgradeLevels[id];
            const currentPrice = calculateUpgradePrice(price, level);
            return (
              <button
                key={name}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  balance < currentPrice || walletState === 'checking' || walletState === 'connecting'
                    ? 'border-surface bg-deep/60 text-text-muted'
                    : 'border-surface bg-white hover:-translate-y-0.5 hover:border-aurora-mid'
                }`}
                type="button"
                disabled={balance < currentPrice || walletState === 'checking' || walletState === 'connecting'}
                onClick={() => onBuyUpgrade(id, currentPrice, boost, kind)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-deep p-2.5 text-aurora-start">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">{name}</p>
                    <p className="text-xs leading-4 text-text-secondary">{description}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Seviye {level}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
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

function MuseumPage({ ownedInventory, listedNftNames }: { ownedInventory: OwnedInventory; listedNftNames: string[] }) {
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);

  return (
    <div>
      <SectionHeader title="Muze" />
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {nftCollection.map((nft, index) => {
          const inventoryCount = ownedInventory[nft.name] ?? 0;
          const shownCount = visibleOwnedCount(ownedInventory, listedNftNames, nft.name);
          const isUnlocked = inventoryCount > 0;
          return (
            <motion.article
              key={nft.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`group rounded-[1.75rem] border border-surface bg-white p-5 shadow-sm transition ${
                isUnlocked ? 'cursor-pointer hover:-translate-y-1 hover:border-aurora-mid/30 hover:shadow-lg' : 'cursor-default opacity-90'
              }`}
              onClick={() => {
                if (isUnlocked) setSelectedNft(nft);
              }}
            >
              <NftArtwork nft={nft} locked={!isUnlocked} className="aspect-square rounded-[1.25rem]" imageClassName="p-4 group-hover:scale-[1.03]" />
              <div className="mt-5 flex items-center justify-between gap-3">
                <h3 className={`${safeFontClass(nft.name)} text-2xl text-text-primary`}>{isUnlocked ? nft.name : 'Kilitli Kedi'}</h3>
                <span className="rounded-full border border-surface bg-deep px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {isUnlocked ? `x${shownCount}` : 'Locked'}
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
  marketItems,
  wallet,
  walletState,
  ownedInventory,
  listedNftNames,
  onToggleListing,
  onPurchaseNft,
  walletInstallLabel,
  isMarketplaceReady,
  telegramLaunchUrl,
}: {
  marketItems: NftItem[];
  wallet: WalletConnection | null;
  walletState: WalletUiState;
  ownedInventory: OwnedInventory;
  listedNftNames: string[];
  onToggleListing: (name: string, priceXlm?: number) => Promise<unknown>;
  onPurchaseNft: (nft: NftItem) => Promise<{ hash: string; recipient: string; amount: string }>;
  walletInstallLabel: string;
  isMarketplaceReady: boolean;
  telegramLaunchUrl: string | null;
}) {
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [sortMode, setSortMode] = useState<'low' | 'high'>('low');
  const [isCompactGrid, setIsCompactGrid] = useState(false);
  const [listingModalOpen, setListingModalOpen] = useState(false);

  const filteredItems = marketItems
    .filter((nft) => (rarityFilter === 'all' ? true : nft.rarity === rarityFilter))
    .filter((nft) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return [nft.name, nft.owner, nft.backgroundTrait, nft.accessoryTrait].some((value) => value.toLowerCase().includes(term));
    })
    .sort((left, right) => (sortMode === 'low' ? left.price - right.price : right.price - left.price));
  const listableItems = nftCollection.filter((nft) => visibleOwnedCount(ownedInventory, listedNftNames, nft.name) > 0 && !listedNftNames.includes(nft.name));

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
                <span className="text-xs text-text-muted">{rarity === 'all' ? marketItems.length : marketItems.filter((nft) => nft.rarity === rarity).length}</span>
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
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-aurora-mid/20 bg-aurora-mid px-4 py-3 text-sm font-semibold text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!listableItems.length || walletState !== 'connected'}
                title={walletState !== 'connected' ? 'Ilan vermek icin Freighter cuzdanini bagla.' : undefined}
                onClick={() => setListingModalOpen(true)}
              >
                <Gem size={16} />
                Ilan ver
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
              isOwned={(ownedInventory[selectedNft.name] ?? 0) > 0}
              isListed={listedNftNames.includes(selectedNft.name)}
              onToggleListing={onToggleListing}
              onPurchase={onPurchaseNft}
              onClose={() => setSelectedNft(null)}
              walletInstallLabel={walletInstallLabel}
              isMarketplaceReady={isMarketplaceReady}
              telegramLaunchUrl={telegramLaunchUrl}
            />
          ) : null}
          {listingModalOpen ? (
            <CreateListingModal
              items={listableItems}
              onClose={() => setListingModalOpen(false)}
              onCreate={async (name, priceXlm) => {
                await onToggleListing(name, priceXlm);
                setListingModalOpen(false);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({
  items,
  onClose,
  onCreate,
}: {
  items: NftItem[];
  onClose: () => void;
  onCreate: (name: string, priceXlm: number) => Promise<void>;
}) {
  const [selectedName, setSelectedName] = useState(items[0]?.name ?? '');
  const selected = items.find((item) => item.name === selectedName) ?? items[0];
  const [price, setPrice] = useState(selected ? String(Math.max(1, Math.round(selected.price / 100))) : '1');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const priceValue = Number(price);
  const canSubmit = Boolean(selected) && Number.isFinite(priceValue) && priceValue > 0;

  const handleSelectedNameChange = (name: string) => {
    setSelectedName(name);
    const nextSelected = items.find((item) => item.name === name);
    if (nextSelected) {
      setPrice(String(Math.max(1, Math.round(nextSelected.price / 100))));
    }
  };

  const content = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/25 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl rounded-[2rem] border border-surface bg-white p-6 shadow-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Pazar ilani</p>
            <h3 className="mt-2 font-display text-4xl font-extrabold text-text-primary">Ilan ver</h3>
          </div>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {selected ? (
          <div className="mt-6 grid gap-5 md:grid-cols-[240px_1fr]">
            <NftArtwork nft={selected} className="aspect-square rounded-[1.5rem]" imageClassName="p-5" />
            <div className="grid content-start gap-4">
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Kedi</span>
                <select
                  className="rounded-2xl border border-surface bg-deep/70 px-4 py-3 text-sm text-text-primary outline-none"
                  value={selectedName}
                  onChange={(event) => handleSelectedNameChange(event.target.value)}
                >
                  {items.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} / {item.rarity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Fiyat XLM</span>
                <input
                  className="rounded-2xl border border-surface bg-deep/70 px-4 py-3 text-sm text-text-primary outline-none"
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </label>
              {message ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p> : null}
              <button
                className="w-fit rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={!canSubmit || submitState === 'submitting'}
                onClick={async () => {
                  if (!selected || !canSubmit) return;
                  try {
                    setSubmitState('submitting');
                    setMessage('');
                    await onCreate(selected.name, priceValue);
                  } catch (error) {
                    setSubmitState('error');
                    setMessage(error instanceof Error ? error.message : 'Ilan olusturulamadi.');
                  }
                }}
              >
                {submitState === 'submitting' ? 'Kaydediliyor' : 'Ilani olustur'}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-surface bg-deep p-4 text-sm text-text-secondary">Listelenebilir kedin yok.</p>
        )}
      </motion.div>
    </div>
  );

  return modalRoot ? createPortal(content, modalRoot) : content;
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
  walletInstallLabel,
  isMarketplaceReady,
  telegramLaunchUrl,
}: {
  nft: NftItem;
  wallet: WalletConnection | null;
  walletState: WalletUiState;
  isOwned: boolean;
  isListed: boolean;
  onToggleListing: (name: string, priceXlm?: number) => Promise<unknown>;
  onPurchase: (nft: NftItem) => Promise<{ hash: string; recipient: string; amount: string }>;
  onClose: () => void;
  walletInstallLabel: string;
  isMarketplaceReady: boolean;
  telegramLaunchUrl: string | null;
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
                  disabled={submitState === 'submitting'}
                  onClick={async () => {
                    try {
                      setSubmitState('submitting');
                      setSubmitMessage(isListed ? 'Stellar liste kaydi kaldiriliyor.' : 'Stellar liste kaydi hazirlaniyor.');
                      await onToggleListing(nft.name);
                      setSubmitState('success');
                      setSubmitMessage(isListed ? 'Liste kaydi kaldirildi.' : 'NFT XLM pazarina eklendi.');
                    } catch (error) {
                      setSubmitState('error');
                      setSubmitMessage(error instanceof Error ? error.message : 'Pazar islemi basarisiz oldu.');
                    }
                  }}
                >
                  {isListed ? 'Listeden kaldir' : 'XLM ile listele'}
                </button>
              ) : walletState === 'connected' && isMarketplaceReady ? (
                <button
                  className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={submitState === 'submitting'}
                  onClick={async () => {
                    try {
                      setSubmitState('submitting');
                      setSubmitMessage(`${wallet?.provider === 'walletconnect' ? 'WalletConnect' : 'Freighter'} uzerinde XLM islemi imzalaniyor.`);
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
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Satin alma icin {walletInstallLabel.toLowerCase()}.</p>
                  {telegramLaunchUrl ? (
                    <a
                      className="inline-flex rounded-full border border-surface bg-deep px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                      href={telegramLaunchUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Telegram Mini App ac
                    </a>
                  ) : null}
                </div>
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

function ProfileCatStage({ cats }: { cats: NftItem[] }) {
  return (
    <div className="pointer-events-auto absolute inset-x-[8%] bottom-[6%] h-[34%] overflow-hidden">
      {cats.map((cat, index) => (
        <WalkingProfileCat key={`${cat.name}-${index}`} cat={cat} index={index} />
      ))}
    </div>
  );
}

function randomProfileTarget(index: number) {
  return {
    x: 8 + Math.random() * 76,
    y: 44 + Math.random() * 38,
    rotate: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8),
    delay: 4000 + Math.random() * 4000 + index * 260,
  };
}

function WalkingProfileCat({ cat, index }: { cat: NftItem; index: number }) {
  const [target, setTarget] = useState(() => randomProfileTarget(index));
  const [bubble, setBubble] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    let moveTimer = window.setTimeout(function move() {
      if (!draggingRef.current) {
        setTarget(randomProfileTarget(index));
      }
      moveTimer = window.setTimeout(move, 4000 + Math.random() * 4000);
    }, target.delay);
    return () => window.clearTimeout(moveTimer);
  }, [index, target.delay]);

  useEffect(() => {
    let hideTimer = 0;
    let bubbleTimer = window.setTimeout(function showBubble() {
      setBubble(bubbleImages[Math.floor(Math.random() * bubbleImages.length)]);
      hideTimer = window.setTimeout(() => setBubble(null), 3000);
      bubbleTimer = window.setTimeout(showBubble, 6000 + Math.random() * 6000);
    }, 1200 + Math.random() * 3000 + index * 700);
    return () => {
      window.clearTimeout(bubbleTimer);
      window.clearTimeout(hideTimer);
    };
  }, [index]);

  const updateDraggedPosition = (clientX: number, clientY: number, stage: HTMLElement | null) => {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(82, Math.max(18, ((clientY - rect.top) / rect.height) * 100));
    setTarget((current) => ({
      ...current,
      x,
      y,
      rotate: current.rotate,
    }));
  };

  return (
    <div
      className={`pointer-events-auto absolute grid cursor-grab place-items-center touch-none ${
        isDragging ? 'z-30 cursor-grabbing transition-none' : 'transition-[left,top,transform] duration-[2600ms] ease-in-out'
      }`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
        transform: `translate(-50%, -50%) rotate(${target.rotate}deg)`,
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        const stage = event.currentTarget.parentElement;
        draggingRef.current = true;
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateDraggedPosition(event.clientX, event.clientY, stage);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        updateDraggedPosition(event.clientX, event.clientY, event.currentTarget.parentElement);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        setIsDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        draggingRef.current = false;
        setIsDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    >
      {bubble ? (
        <img
          className="pointer-events-none absolute -top-14 left-1/2 h-20 w-20 -translate-x-1/2 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.16)] md:-top-16 md:h-24 md:w-24"
          src={bubble}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <motion.img
        className="pointer-events-none h-[6.9rem] w-[6.9rem] object-contain drop-shadow-[0_14px_18px_rgba(73,42,16,0.26)] md:h-[9.2rem] md:w-[9.2rem]"
        src={cat.image}
        alt=""
        aria-hidden="true"
        animate={{ rotate: [-4, 5, -3] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
    </div>
  );
}

function ProfileCatPickerModal({
  options,
  selectedNames,
  onClose,
  onChange,
}: {
  options: NftItem[];
  selectedNames: string[];
  onClose: () => void;
  onChange: (names: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selectedNames.slice(0, 3));
  const toggle = (name: string) => {
    setDraft((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= 3) return [...current.slice(1), name];
      return [...current, name];
    });
  };

  const content = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/25 px-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-5xl rounded-[2rem] border border-surface bg-white p-6 shadow-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Profil kedileri</p>
            <h3 className="mt-2 font-display text-4xl font-extrabold text-text-primary">En fazla 3 kedi sec</h3>
          </div>
          <button className="rounded-full border border-surface bg-deep p-3 text-text-secondary transition hover:text-text-primary" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid max-h-[26rem] gap-4 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((nft) => {
            const selected = draft.includes(nft.name);
            return (
              <button
                key={nft.name}
                className={`rounded-[1.25rem] border p-3 text-left transition ${
                  selected ? 'border-aurora-mid bg-aurora-mid/8' : 'border-surface bg-white hover:border-aurora-mid/30'
                }`}
                type="button"
                onClick={() => toggle(nft.name)}
              >
                <NftArtwork nft={nft} className="aspect-square rounded-2xl" imageClassName="p-3" />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`${safeFontClass(nft.name)} text-xl text-text-primary`}>{nft.name}</span>
                  {selected ? <Check size={18} className="text-aurora-start" /> : null}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{draft.length}/3 secili</span>
          <button
            className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-aurora-start"
            type="button"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            Kaydet
          </button>
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
  ownedInventory,
  listedNftNames,
  selectedCatNames,
  onSelectedCatNamesChange,
  profileDisplayName,
  onProfileDisplayNameChange,
  telegramSessionToken,
  currentPlayer,
  onTelegramLogin,
  telegramLaunchUrl,
}: {
  selectedBackground?: { id: string; name: string; image: string };
  backgroundOptions: PickerOption[];
  balance: number;
  ownedBackgroundIds: string[];
  onSelectBackground: (id: string) => void;
  onBuyBackground: (id: string, price: number) => void;
  profileAvatar: string | null;
  onAvatarChange: (url: string | null) => void;
  ownedInventory: OwnedInventory;
  listedNftNames: string[];
  selectedCatNames: string[];
  onSelectedCatNamesChange: (names: string[]) => void;
  profileDisplayName: string;
  onProfileDisplayNameChange: (name: string) => void;
  telegramSessionToken: string | null;
  currentPlayer: ProfileRecord | null;
  onTelegramLogin: () => Promise<void>;
  telegramLaunchUrl: string | null;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profileDisplayName);
  const [remoteProfile, setRemoteProfile] = useState<ProfileRecord | null>(currentPlayer);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const activeUsername = currentPlayer?.username ?? '@emira_player';
  const viewedPlayer = new URLSearchParams(location.search).get('player') ?? activeUsername;
  const isOwnProfile = viewedPlayer === activeUsername;

  useEffect(() => {
    fetchProfile(viewedPlayer.replace(/^@/, ''))
      .then((payload) => {
        setRemoteProfile(payload.player ?? null);
      })
      .catch(() => {
        setRemoteProfile(isOwnProfile ? currentPlayer : null);
      });
  }, [currentPlayer, isOwnProfile, viewedPlayer]);

  const ownedProfileNfts = nftCollection.filter((nft) => visibleOwnedCount(ownedInventory, listedNftNames, nft.name) > 0);
  const fallbackGuestNames = guestProfileCats[Math.abs(viewedPlayer.length) % guestProfileCats.length];
  const selectedProfileNfts = (isOwnProfile ? selectedCatNames : fallbackGuestNames)
    .map((name) => nftCollection.find((nft) => nft.name === name))
    .filter(Boolean)
    .slice(0, 3) as NftItem[];
  const displayName = isOwnProfile ? profileDisplayName : (remoteProfile?.displayName ?? viewedPlayer);

  useEffect(() => {
    if (!isOwnProfile) return;
    const available = new Set(ownedProfileNfts.map((nft) => nft.name));
    const next = selectedCatNames.filter((name) => available.has(name)).slice(0, 3);
    if (next.length !== selectedCatNames.length) {
      onSelectedCatNamesChange(next);
    }
  }, [isOwnProfile, ownedProfileNfts, onSelectedCatNamesChange, selectedCatNames]);

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
            <button
              className="rounded-full border border-surface bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
              type="button"
              onClick={() => setCatPickerOpen(true)}
            >
              Kedileri sec
            </button>
            {isEditingName ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = draftName.trim();
                  if (next) onProfileDisplayNameChange(next.slice(0, 28));
                  setIsEditingName(false);
                }}
              >
                <input
                  className="rounded-full border border-surface bg-white px-4 py-3 text-sm text-text-primary outline-none"
                  value={draftName}
                  maxLength={28}
                  onChange={(event) => setDraftName(event.target.value)}
                  autoFocus
                />
                <button className="rounded-full border border-aurora-mid/20 bg-aurora-mid px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white" type="submit">
                  Kaydet
                </button>
              </form>
            ) : (
              <button
                className="rounded-full border border-surface bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                type="button"
                onClick={() => {
                  setDraftName(profileDisplayName);
                  setIsEditingName(true);
                }}
              >
                Ismi degistir
              </button>
            )}
            {!telegramSessionToken ? (
              <>
                <button
                  className="rounded-full border border-surface bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                  type="button"
                  onClick={() => {
                    void onTelegramLogin();
                  }}
                >
                  Telegram bagla
                </button>
                {telegramLaunchUrl ? (
                  <a
                    className="rounded-full border border-surface bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:border-aurora-mid hover:text-text-primary"
                    href={telegramLaunchUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mini App ac
                  </a>
                ) : null}
              </>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-700">
                Telegram aktif
              </span>
            )}
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
            <ProfileCatStage cats={selectedProfileNfts} />
            <div className="absolute inset-0 bg-gradient-to-t from-white/42 via-white/4 to-transparent" />
            <div className="absolute left-8 top-8 rounded-full border border-surface bg-white/90 px-5 py-3 shadow-sm backdrop-blur">
              <h3 className="font-display text-3xl font-extrabold text-text-primary">{displayName}</h3>
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
      {catPickerOpen && isOwnProfile ? (
        <ProfileCatPickerModal
          options={ownedProfileNfts}
          selectedNames={selectedCatNames}
          onClose={() => setCatPickerOpen(false)}
          onChange={onSelectedCatNamesChange}
        />
      ) : null}
    </div>
  );
}

function LeaderboardPage({
  players,
  activeUsername,
}: {
  players: LeaderboardPlayer[];
  activeUsername: string;
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
                onClick={() => navigate(`/profile?player=${encodeURIComponent(player.isSelf ? activeUsername : player.username)}`)}
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
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
              {wallet.provider === 'freighter' ? 'Freighter' : 'WalletConnect'} · {wallet.network}
            </p>
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
  return 'Cuzdan bagla';
}

function HomeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-surface bg-deep px-3 py-2.5">
      <p className="font-display text-base font-extrabold text-text-primary">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
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
