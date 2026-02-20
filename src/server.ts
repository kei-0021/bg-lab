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

  // 本番環境フラグ
  const isProduction = process.env.NODE_ENV === "production";

  for (const config of configs) {
    const loadedData: Record<string, any> = {};
    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      let finalPath = relPath as string;

      // Render(本番)では ../public/data/... ではなく ./data/... を見るように補正
      if (isProduction) {
        finalPath = finalPath.replace("../public/", "./");
      }

      loadedData[key] = await loadJson(finalPath, __dirname);
    }

    gamePresets[config.id] = config.setup(loadedData, setupTools);
  }

  const options: GameServerOptions = {
    // Renderでは環境変数PORTが優先される
    port: Number(process.env.PORT) || 4000,
    clientDistPath: path.resolve(__dirname, "../dist"), // クライアント資産の場所を明示
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