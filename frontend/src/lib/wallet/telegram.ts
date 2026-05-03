export type TelegramWebAppContext = {
  isTelegram: boolean;
  userId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  initData?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
      };
    };
  }
}

export function readTelegramWebAppContext(): TelegramWebAppContext {
  const webApp = window.Telegram?.WebApp;
  const user = webApp?.initDataUnsafe?.user;

  return {
    isTelegram: Boolean(webApp),
    initData: webApp?.initData,
    userId: user?.id ? String(user.id) : undefined,
    username: user?.username,
    firstName: user?.first_name,
    lastName: user?.last_name,
  };
}

export function isTelegramSurface() {
  return readTelegramWebAppContext().isTelegram;
}
