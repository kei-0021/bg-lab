// src/server.ts
import path from "path";
import { GameServer, type GameServerOptions } from "react-game-ui/server";
import {
  chunkTo2D,
  generateFromTemplates,
  loadJsonAssert,
  replicateData,
  Validators
} from "react-game-ui/server-io-utils";
import { fileURLToPath } from "url";

import type { RoomParam } from "react-game-ui";

// 各ゲーム固有のコンフィグ
import { customEvents } from "../public/data/customEvents.js";
import { fireworksConfig } from "./server/fireworksConfig.js";
import { uberNinjaConfig } from "./server/uberNinjaConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 各Configのsetupに渡すためのツール群
 * 内部の古い関数から、ライブラリ標準の関数へ差し替え
 */
const setupTools = {
  assertCards: (data: any): any[] => {
    if (Validators.isCardArray(data)) return data;
    throw new Error("Invalid card data");
  },
  createUniqueCards: replicateData,
  createBoardLayout: (base: any[], counts: Record<string, number>, cols: number) =>
    chunkTo2D(generateFromTemplates(base, counts), cols),

  createTokenStore: (_id: string, _name: string, templates: any[], count: number): any[] => {
    return replicateData(templates, count);
  },
};

async function startServer(): Promise<void> {
  const gamePresets: Record<string, RoomParam> = {};
  const configs = [fireworksConfig, uberNinjaConfig];
  const isProduction = process.env.NODE_ENV === "production";

  for (const config of configs) {
    const loadedData: Record<string, any> = {};

    for (const [key, relPath] of Object.entries(config.dataFiles)) {
      let finalPath: string;
      if (isProduction) {
        const fileName = path.basename(relPath as string);
        finalPath = path.join(process.cwd(), "dist", "data", fileName);
      } else {
        finalPath = path.resolve(__dirname, relPath as string);
      }

      loadedData[key] = await loadJsonAssert(finalPath, (data): data is any => true);
    }

    // ツール群を渡してプリセットを生成
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