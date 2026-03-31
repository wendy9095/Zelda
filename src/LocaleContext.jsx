import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STRINGS } from './localeStrings';

const STORAGE_KEY = 'renderflow_locale';

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((l) => (l === 'zh' ? 'en' : 'zh'));
  }, []);

  const t = useCallback(
    (key) => STRINGS[locale]?.[key] ?? STRINGS.zh[key] ?? key,
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      isZh: locale === 'zh',
    }),
    [locale, toggleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
