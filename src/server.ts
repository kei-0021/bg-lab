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

  const isProduction = process.env.NODE_ENV === "production";

  for (const config of configs) {
    const loadedData: Record<string, any> = {};
    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      let finalPath = relPath as string;

      if (isProduction) {
        // Renderの本番環境パス /opt/render/project/src/dist/data/ を絶対パスで解決
        const fileName = path.basename(finalPath);
        finalPath = path.join(process.cwd(), "dist", "data", fileName);
      }

      loadedData[key] = await loadJson(finalPath, __dirname);
    }

    gamePresets[config.id] = config.setup(loadedData, setupTools);
  }

  const options: GameServerOptions = {
    port: Number(process.env.PORT) || 4000,
    // clientDistPathも絶対パスで安全に指定
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