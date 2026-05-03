export type TelegramWebAppContext = {
  isTelegram: boolean;
  userId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  initData?: string;
  startParam?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        initDataUnsafe?: {
          user?: {
            id?: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
          start_param?: string;
        };
      };
    };
  }
}

export function readTelegramWebAppContext(): TelegramWebAppContext {
  const webApp = window.Telegram?.WebApp;
  const user = webApp?.initDataUnsafe?.user;
  const initData = webApp?.initData?.trim();
  const hasTelegramSession = Boolean(initData || user?.id);

  return {
    isTelegram: hasTelegramSession,
    initData: webApp?.initData,
    startParam: webApp?.initDataUnsafe?.start_param,
    userId: user?.id ? String(user.id) : undefined,
    username: user?.username,
    firstName: user?.first_name,
    lastName: user?.last_name,
  };
}

export function isTelegramSurface() {
  return readTelegramWebAppContext().isTelegram;
}

export function prepareTelegramWebApp() {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

export function buildTelegramMiniAppUrl() {
  const username = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const startParam = import.meta.env.VITE_TELEGRAM_STARTAPP ?? 'emira-core';
  if (!username) return null;
  return `https://t.me/${username}?startapp=${encodeURIComponent(startParam)}`;
}

export function resolveTelegramInitData(context: TelegramWebAppContext) {
  if (!context.isTelegram) return null;
  return context.initData?.trim() ? context.initData : null;
}
