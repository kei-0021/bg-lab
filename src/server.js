import path from "path";
import { GameServer } from "react-game-ui/server";
import { fileURLToPath } from "url";

// 必要な関数だけを明示的にインポート
// ビルド後は dist/server/ に配置されるため、このパスで正解
import {
  assertCards,
  createBoardLayout,
  createTokenStore,
  createUniqueCards,
  loadJson,
} from "./server/utils.js";

// 各ゲームの設定ファイルをインポート
import { deepAbyssConfig } from "./server/deepAbyssConfig.js";
import { fireworksConfig } from "./server/fireworksConfig.js";

// 共有データのインポート（publicはビルド時にルートに維持される前提）
import { cardEffects } from "../public/data/cardEffects.js";
import { cellEffects } from "../public/data/cellEffects.js";
import { customEvents } from "../public/data/customEvents.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 設定ファイルに渡すツール群
const setupTools = {
  assertCards,
  createUniqueCards,
  createTokenStore,
  createBoardLayout,
};

async function startServer() {
  const gamePresets = {};
  const configs = [fireworksConfig, deepAbyssConfig];

  for (const config of configs) {
    const loadedData = {};
    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      // relPath は "../public/data/xxx.json" である必要があります
      loadedData[key] = await loadJson(relPath, __dirname);
    }

    // 各ゲームのプリセットを生成
    gamePresets[config.id] = config.setup(loadedData, setupTools);
  }

  const demoServer = new GameServer({
    port: 4000,
    // server.jsがdist直下にあるため、パスは__dirname（dist）そのものを指定
    clientDistPath: __dirname,
    libDistPath: __dirname,
    corsOrigins: [
      "http://localhost:5173",
      "http://localhost:4000",
      "https://bg-lab.onrender.com",
    ],
    gamePresets,
    cardEffects,
    cellEffects,
    customEvents,
    initialLogCategories: {
      connection: false,
      deck: true,
      cell: false,
      custom_event: false,
    },
    onServerStart: (url) => console.log(`🎮 Server running at: ${url}`),
  });

  demoServer.start();
}

startServer().catch((err) => {
  console.error("致命的なエラー: サーバー起動に失敗しました。", err);
  // Render等の環境で異常終了を検知させるため
  process.exit(1);
});
