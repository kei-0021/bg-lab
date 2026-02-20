import path from "path";
import { GameServer, type GameServerOptions } from "react-game-ui/server";
import { fileURLToPath } from "url";

// 必要な関数だけを明示的にインポート
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

// 共有データのインポート
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

async function startServer(): Promise<void> {
  const gamePresets: Record<string, any> = {};
  const configs = [fireworksConfig, deepAbyssConfig];

  for (const config of configs) {
    const loadedData: Record<string, any> = {};
    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      loadedData[key] = await loadJson(relPath as string, __dirname);
    }

    // 各ゲームのプリセットを生成
    gamePresets[config.id] = config.setup(loadedData, setupTools);
  }

  const options: GameServerOptions = {
    port: 4000,
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
    onServerStart: (url: string) => console.log(`🎮 Server running at: ${url}`),
  };

  const demoServer = new GameServer(options);

  demoServer.start();
}

startServer().catch((err: unknown) => {
  console.error("致命的なエラー: サーバー起動に失敗しました。", err);
  process.exit(1);
});