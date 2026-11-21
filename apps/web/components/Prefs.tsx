"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Display preferences (theme, look). Never permissions. Persisted per browser, best effort only. */
export type Theme = "dark" | "light";
export type Look = "explorer" | "tech";
interface Prefs { theme: Theme; look: Look; setTheme: (t: Theme) => void; setLook: (l: Look) => void }
const Ctx = createContext<Prefs>({ theme: "dark", look: "explorer", setTheme: () => {}, setLook: () => {} });
const KEY = "familyos.display";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [look, setLook] = useState<Look>("explorer");
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<{ theme: Theme; look: Look }>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of a stored display preference
      if (v.theme === "light" || v.theme === "dark") setTheme(v.theme);
      if (v.look === "tech" || v.look === "explorer") setLook(v.look);
    } catch { /* storage unavailable: keep defaults */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ theme, look })); } catch { /* ignore */ }
    document.documentElement.dataset.foTheme = theme;
  }, [theme, look]);
  return <Ctx.Provider value={{ theme, look, setTheme, setLook }}>{children}</Ctx.Provider>;
}
export const usePrefs = () => useContext(Ctx);
