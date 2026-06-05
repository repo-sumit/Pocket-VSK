import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/types";
import { DEFAULT_FRAMEWORK_ID } from "@/config";
import { dataProvider } from "@/data/provider";

export type Lang = "en" | "gu";
export type PmShriMode = "all" | "pmshri" | "non";

interface SessionState {
  user: AppUser | null;
  /** entity currently in view (starts at the user's own scope; can drill down). */
  scopeId: string | null;
  frameworkId: string;
  lang: Lang;
  /** global PM SHRI institutional filter (aspirational tracker). */
  pmShri: PmShriMode;
  login: (user: AppUser) => void;
  logout: () => void;
  setScope: (entityId: string) => void;
  resetScope: () => void;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setFramework: (id: string) => void;
  setPmShri: (m: PmShriMode) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      scopeId: null,
      frameworkId: DEFAULT_FRAMEWORK_ID,
      lang: "en",
      pmShri: "all",
      login: (user) => set({ user, scopeId: user.entity_id }),
      logout: () => set({ user: null, scopeId: null }),
      // ACCESS CONTROL: scope can only move within the user's own subtree. A target
      // outside it (ancestor, peer, or any out-of-scope entity) is clamped back to
      // home — never honoured. This is the single write-side chokepoint; useScope
      // clamps again on read (covers tampered/persisted localStorage values).
      // NOTE: client-side enforcement only; production also needs server-side authz.
      setScope: (entityId) => {
        const home = get().user?.entity_id;
        if (!home) return;
        set({ scopeId: dataProvider.isInScope(home, entityId) ? entityId : home });
      },
      resetScope: () => set({ scopeId: get().user?.entity_id ?? null }),
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === "en" ? "gu" : "en" }),
      setFramework: (id) => set({ frameworkId: id }),
      setPmShri: (pmShri) => set({ pmShri }),
    }),
    {
      name: "unified-portal-session",
      partialize: (s) => ({ user: s.user, scopeId: s.scopeId, frameworkId: s.frameworkId, lang: s.lang, pmShri: s.pmShri }),
    },
  ),
);
