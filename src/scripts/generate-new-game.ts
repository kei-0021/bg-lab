// src/scripts/generate-new-game.ts
import fs from 'fs';
import path from 'path';

const gameName = process.argv[2];

if (!gameName) {
  console.error('ゲーム名を指定してください（例: npx tsx scripts/generate-game.ts Poker）');
  process.exit(1);
}

const configTemplate = `import type { GameParam } from "react-game-ui";
import { type RoomConfig } from "react-game-ui/server-io-utils";

export const ${gameName.toLowerCase()}Config: RoomConfig = {
  gameId: "${gameName.toLowerCase()}",
  dataFiles: [],
  setup: async (): Promise<GameParam> => {
    return {
      gameId: "${gameName.toLowerCase()}",
      initialDecks: [],
      initialBoard: {},
      draggable: {},
      checkGameEnd: () => false,
      onGameEnd: () => ({ message: "終了" }),
    };
  },
};
`;

const roomTemplate = `import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";

export default function ${gameName}Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket("http://localhost:4000");
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      <h1>${gameName} Room: {roomId}</h1>
    </div>
  );
}
`;

const paths = {
  config: path.join(process.cwd(), 'src/server', `${gameName}Config.ts`),
  room: path.join(process.cwd(), 'src/rooms', `${gameName}Room.tsx`),
};

fs.writeFileSync(paths.config, configTemplate);
fs.writeFileSync(paths.room, roomTemplate);

console.log(`✅ 生成完了:\n  - ${paths.config}\n  - ${paths.room}`);
