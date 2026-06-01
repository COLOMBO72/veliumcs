import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Lang } from './types';
import { TRANSLATIONS, detectLang } from './i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof TRANSLATIONS.en;
}

const Ctx = createContext<LangCtx>({} as LangCtx);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('cs2scope_lang', lang); } catch {}
  }, [lang]);
  const setLang = (l: Lang) => setLangState(l);
  const t = TRANSLATIONS[lang] as typeof TRANSLATIONS.en;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
