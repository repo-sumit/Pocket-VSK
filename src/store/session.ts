import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/types";
import { DEFAULT_FRAMEWORK_ID } from "@/config";

export type Lang = "en" | "gu";

interface SessionState {
  user: AppUser | null;
  /** entity currently in view (starts at the user's own scope; can drill down). */
  scopeId: string | null;
  frameworkId: string;
  lang: Lang;
  login: (user: AppUser) => void;
  logout: () => void;
  setScope: (entityId: string) => void;
  resetScope: () => void;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setFramework: (id: string) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      scopeId: null,
      frameworkId: DEFAULT_FRAMEWORK_ID,
      lang: "en",
      login: (user) => set({ user, scopeId: user.entity_id }),
      logout: () => set({ user: null, scopeId: null }),
      setScope: (entityId) => set({ scopeId: entityId }),
      resetScope: () => set({ scopeId: get().user?.entity_id ?? null }),
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === "en" ? "gu" : "en" }),
      setFramework: (id) => set({ frameworkId: id }),
    }),
    {
      name: "vsk-session",
      partialize: (s) => ({ user: s.user, scopeId: s.scopeId, frameworkId: s.frameworkId, lang: s.lang }),
    },
  ),
);
