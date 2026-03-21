// src/server.ts
import chokidar from 'chokidar';
import fs from "fs";
import path from "path";
import { GameServer, type GameServerOptions } from "react-game-ui/server";
import { loadJsonAssert, type RoomConfig } from "react-game-ui/server-io-utils";
import { fileURLToPath } from "url";

import type { GameParam } from "react-game-ui";
import { customEvents } from "../public/data/customEvents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const allLoadedData = new Map<string, any>();
  const gameParams: Record<string, GameParam> = {};
  const isProduction = process.env.NODE_ENV === "production";
  const rootDir = process.cwd();

  // 本番環境ではコンパイル済みの js が入っている dist/src/server を見に行く
  const serverDirPath = isProduction
    ? path.join(rootDir, "dist", "src", "server")
    : path.join(rootDir, "src", "server");

  // ディレクトリ存在チェック
  let files: string[] = [];
  if (fs.existsSync(serverDirPath)) {
    files = fs.readdirSync(serverDirPath);
  } else {
    console.error(`Directory not found: ${serverDirPath}`);
  }

  const configFiles = files.filter(
    (f) => f.endsWith("Config.ts") || f.endsWith("Config.js"),
  );

  for (const file of configFiles) {
    // コンパイル後の .js を読み込むための相対パス
    const modulePath = `./server/${file.replace(/\.ts$/, ".js")}`;
    const module = await import(modulePath);

    const configName = file.replace(/\.(ts|js)$/, "");
    const config: RoomConfig = module[configName] || module.default;

    if (config && config.gameId) {
      console.log(`Config detected: ${configName} (gameId: ${config.gameId})`);

      const loadedData: Record<string, any> = {};

      for (const [key, relPath] of Object.entries(config.dataFiles)) {
        // public/data/ または dist/data/ 以降のパスを抽出
        const dataPath = (relPath as string).split("data/")[1];
        const finalPath = path.join(
          rootDir,
          isProduction ? "dist" : "public",
          "data",
          dataPath,
        );

        loadedData[key] = await loadJsonAssert(
          finalPath,
          (_data): _data is any => true,
        );
      }

      // ツール群を渡してプリセットを生成
      gameParams[config.gameId] = await config.setup(loadedData);

      allLoadedData.set(config.gameId, loadedData);
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
      custom_event: false,
    },
  };

  const gameServer = new GameServer(options);
  gameServer.start();

  const configDir = path.resolve(__dirname, 'server');
  chokidar.watch(configDir).on('change', async (filePath) => {
    try {
      const fileUrl = `file://${filePath}?update=${Date.now()}`;
      const module = await import(fileUrl);

      // 設定ファイルから config を取得
      const newConfig = Object.values(module).find(
        (val: any) => val && typeof val.setup === 'function' && val.gameId,
      ) as any;

      if (newConfig && allLoadedData.has(newConfig.gameId)) {
        console.log(`[Watcher] 🍴 ${newConfig.gameId} を再セットアップ中...`);

        // 保存しておいた「正しい材料」を取り出して渡す
        const targetData = allLoadedData.get(newConfig.gameId);
        const updatedParam = await newConfig.setup(targetData);

        gameServer.updateGameParam(newConfig.gameId, updatedParam);
        console.log(`[Watcher] ✅ ${newConfig.gameId} のホットスワップに成功しました`);
      }
    } catch (err) {
      console.error('[Watcher] ❌ 再読み込み失敗:', err);
    }
  });
}

startServer().catch((err: unknown) => {
  console.error("致命的なエラー: サーバー起動に失敗しました。", err);
  process.exit(1);
});
