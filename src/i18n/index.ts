import { useSession } from "@/store/session";
import { en } from "./en";
import { gu } from "./gu";

export type { Lang } from "@/store/session";
export type { Dict } from "./en";

const DICTS = { en, gu } as const;

function resolve(obj: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj) as
    | string
    | undefined;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function useT() {
  const lang = useSession((s) => s.lang);
  const dict = DICTS[lang] ?? DICTS.en;

  /** translate a dot-path key, with {var} interpolation. Falls back to en, then the key. */
  const t = (key: string, vars?: Record<string, string | number>): string => {
    const v = resolve(dict, key) ?? resolve(DICTS.en, key) ?? key;
    return interpolate(v, vars);
  };

  /** pick a config name pair (name / name_gu). */
  const tn = (name: string, name_gu?: string): string => (lang === "gu" && name_gu ? name_gu : name);

  /** pick a literal en/gu pair. */
  const pick = (enStr: string, guStr?: string): string => (lang === "gu" && guStr ? guStr : enStr);

  return { t, tn, pick, lang };
}
