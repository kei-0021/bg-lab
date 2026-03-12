// src/server.ts
import path from "path";
import { GameServer, type GameServerOptions } from "react-game-ui/server";
import { loadJsonAssert } from "react-game-ui/server-io-utils";
import { fileURLToPath } from "url";

import type { GameParam } from "react-game-ui";
import { customEvents } from "../public/data/customEvents.js";

// 直接インポート
import { fireworksConfig } from "./server/fireworksConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const gameParams: Record<string, GameParam> = {};
  const isProduction = process.env.NODE_ENV === "production";
  const rootDir = process.cwd();

  // フォルダスキャンをやめて、配列で回す（ENOENTを回避）
  const configs = [fireworksConfig];

  for (const config of configs) {
    if (config && config.gameId) {
      console.log(`Config detected: (gameId: ${config.gameId})`);

      const loadedData: Record<string, any> = {};

      for (const [key, relPath] of Object.entries(config.dataFiles)) {
        // パス解決：data/以降の階層を維持
        const dataPath = (relPath as string).split("data/")[1];
        const finalPath = path.join(
          rootDir,
          isProduction ? "dist" : "public",
          "data",
          dataPath
        );

        loadedData[key] = await loadJsonAssert(
          finalPath,
          (_data): _data is any => true,
        );
      }

      // ツール群を渡してプリセットを生成
      gameParams[config.gameId] = await config.setup(loadedData);
    }
  }

  const options: GameServerOptions = {
    port: Number(process.env.PORT) || 4000,
    clientDistPath: path.join(rootDir, "dist"),
    libDistPath: __dirname,
    corsOrigins: [
      "http://localhost:5173",
      "http://localhost:4000",
      "https://bg-lab.onrender.com",
    ],
    gameParams,
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
