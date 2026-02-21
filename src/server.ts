import path from "path";
import { GameServer, type GameServerOptions } from "react-game-ui/server";
import { fileURLToPath } from "url";

import {
  assertCards,
  createBoardLayout,
  createTokenStore,
  createUniqueCards,
  loadJson,
} from "./server/utils.js";

import { deepAbyssConfig } from "./server/deepAbyssConfig.js";
import { fireworksConfig } from "./server/fireworksConfig.js";

import type { GameId } from "react-game-ui";
import { cardEffects } from "../public/data/cardEffects.js";
import { cellEffects } from "../public/data/cellEffects.js";
import { customEvents } from "../public/data/customEvents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupTools = {
  assertCards,
  createUniqueCards,
  createTokenStore,
  createBoardLayout,
};

async function startServer(): Promise<void> {
  const gamePresets: Record<string, any> = {};
  const configs = [fireworksConfig, deepAbyssConfig];

  const isProduction = process.env.NODE_ENV === "production";

  for (const config of configs) {
    const loadedData: Record<GameId, any> = {};
    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      let finalPath: string;

      if (isProduction) {
        // loadJsonの内部処理に邪魔されないよう、ここですべてを完結させる
        const fileName = path.basename(relPath as string);
        finalPath = path.join(process.cwd(), "dist", "data", fileName);

        // Render環境では絶対パスをそのまま渡すため、第2引数を空にする戦略
        loadedData[key] = await loadJson(finalPath, "");
      } else {
        // 開発環境（tsx）
        loadedData[key] = await loadJson(relPath as string, __dirname);
      }
    }

    gamePresets[config.id] = config.setup(loadedData, setupTools);
  }

  const options: GameServerOptions = {
    port: Number(process.env.PORT) || 4000,
    clientDistPath: path.join(process.cwd(), "dist"),
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