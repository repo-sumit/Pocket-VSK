/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: "mock" | "supabase";
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DEFAULT_FRAMEWORK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
