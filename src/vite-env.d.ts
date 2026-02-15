// /src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // ここに vite.config.js や環境ファイルで定義した他の環境変数を追記できます
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
