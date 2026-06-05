import type { DataProvider } from "./types";
import { MockProvider } from "./mockProvider";
import { SupabaseProvider } from "./supabaseProvider";

export type { DataProvider, RawSeries } from "./types";

/** The single active provider. Swap to live by setting VITE_DATA_PROVIDER. */
export const dataProvider: DataProvider =
  import.meta.env?.VITE_DATA_PROVIDER === "supabase" ? SupabaseProvider : MockProvider;
