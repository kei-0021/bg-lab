// src/scripts/generate-new-game.ts
import fs from 'fs';
import path from 'path';

const gameName = process.argv[2];
const gameIcon = process.argv[3] || "🎲";

if (!gameName) {
  console.error('ゲーム名を指定してください（例: npx tsx scripts/generate-game.ts Poker）');
  process.exit(1);
}

const lowerName = gameName.toLowerCase();
const pascalName = gameName.charAt(0).toUpperCase() + gameName.slice(1);

// --- CSS Module Template ---
const cssModuleTemplate = `/* src/rooms/${gameName}Room.module.css */
.gameContainer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #222;
}

.gameCanvas {
  width: 1600px;
  height: 900px;
  position: relative;
  background: #333;
  transform-origin: top left;
}

.gameHeader {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  color: white;
  border-bottom: 1px solid #444;
}

.gameMain {
  display: flex;
  height: calc(100% - 60px);
}

.sidebarLeft {
  width: 250px;
  padding: 10px;
  border-right: 1px solid #444;
}

.sidebarRight {
  width: 300px;
  padding: 10px;
  border-left: 1px solid #444;
}

.playFieldContainer {
  flex: 1;
  position: relative;
}

.joinScreen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #1a1a1a;
  color: white;
}
`;

// --- Server Config Template ---
const configTemplate = `import type { GameParam } from "react-game-ui";
import { type RoomConfig } from "react-game-ui/server-io-utils";

export const ${pascalName}Config: RoomConfig = {
  gameId: "${lowerName}",
  dataFiles: [],
  setup: async (): Promise<GameParam> => {
    const initialDraggables = {
      "piece": {
        id: "piece",
        coordinate: { x: 500, y: 500 },
        zIndex: 100,
        rotation: 0
      }
    };

    return {
      gameId: "${lowerName}",
      initialDecks: [],
      initialBoard: {},
      draggable: initialDraggables,
      checkGameEnd: () => false,
      onGameEnd: () => ({ message: "終了" }),
    };
  },
};
`;

// --- Room Component Template ---
const roomTemplate = `import { useCallback, useEffect, useRef, useState } from "react";
import type { GameTurnUpdateData, Player, RoomJoinData } from "react-game-ui";
import {
  Deck,
  Dice,
  Draggable,
  PlayField,
  RemoteCursor,
  ScoreBoard,
  TokenStore,
} from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import styles from "./${gameName}Room.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

export default function ${lowerName}Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentDiceValue, setCurrentDiceValue] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleJoinRoom = useCallback(() => {
    if (!socket || userName.trim() === "" || isJoining) return;
    setIsJoining(true);
    socket.emit("room:join", {
      roomId,
      gameId: "${lowerName}",
      playerName: userName.trim(),
    } as RoomJoinData);
  }, [socket, roomId, userName, isJoining]);

  useEffect(() => {
    if (!socket) return;
    const handleAssignId = (id: Player["id"]) => {
      setMyPlayerId(id);
      setHasJoined(true);
      setIsJoining(false);
    };
    const onClientReady = () => {
      socket.emit("client:ready", roomId);
    };
    const handlePlayersUpdate = (updatedPlayers: Player[]) => setPlayers(updatedPlayers);
    const handleGameTurn = (data: GameTurnUpdateData) => {
      setCurrentPlayerId(data.currentPlayerId);
      setCurrentRound(data.currentRoundIndex + 1);
    };

    socket.on("player:assign-id", handleAssignId);
    socket.on("client:ready-to-sync", onClientReady);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:turn", handleGameTurn);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:turn", handleGameTurn);
    };
  }, [socket, roomId]);

  if (!roomId) return null;

  if (!hasJoined) {
    return (
      <div className={styles.joinScreen}>
        <div style={{ textAlign: 'center' }}>
          <h2>${gameName} 入場</h2>
          <input
            type="text"
            autoFocus
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="お名前"
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            style={{ padding: '8px', borderRadius: '4px', border: 'none', color: '#000' }}
          />
          <button onClick={handleJoinRoom} disabled={isJoining} style={{ marginLeft: '8px', padding: '8px 16px', cursor: 'pointer' }}>
            {isJoining ? "入場中" : "入場"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div
        ref={containerRef}
        className={styles.gameCanvas}
        style={{
          transform: \`scale(\${scale})\`
        }}
      >
        <header className={styles.gameHeader}>
          <h1>${gameIcon} ${gameName}</h1>
          <div>Round: {currentRound}</div>
          <button onClick={() => navigate("/")}>ロビーへ</button>
        </header>

        <main className={styles.gameMain}>
          <aside className={styles.sidebarLeft}>
            <Deck socket={socket!} roomId={roomId} deckId="main" title="山札" currentPlayerId={currentPlayerId} myPlayerId={myPlayerId} />
            <Dice sides={6} socket={socket} diceId="move" roomId={roomId} onRoll={setCurrentDiceValue} />
          </aside>

          <div className={styles.playFieldContainer}>
             <RemoteCursor socket={socket!} roomId={roomId} myPlayerId={myPlayerId} players={players.map(p => ({ name: p.name, socketId: String(p.id), color: p.color }))} scale={scale} fixedContainerRef={containerRef} visible={true} isRelative={false} />
             <PlayField socket={socket} roomId={roomId} deckId="main" players={players} myPlayerId={myPlayerId} layoutMode="free" />
             <Draggable socket={socket} roomId={roomId} draggableId="piece" containerRef={containerRef}/>
          </div>

          <aside className={styles.sidebarRight}>
            <ScoreBoard socket={socket!} roomId={roomId} players={players} currentPlayerId={currentPlayerId} myPlayerId={myPlayerId} />
          </aside>
        </main>
        
        <TokenStore socket={socket} roomId={roomId} tokenStoreId="chips" title="所持チップ" />
      </div>
    </div>
  );
}
`;

const paths = {
  config: path.join(process.cwd(), 'src/server', `${pascalName}Config.ts`),
  room: path.join(process.cwd(), 'src/rooms', `${gameName}Room.tsx`),
  css: path.join(process.cwd(), 'src/rooms', `${gameName}Room.module.css`), // 拡張子変更
  registry: path.join(process.cwd(), 'src/constants/games.config.ts'),
};

// ディレクトリ作成
[path.dirname(paths.config), path.dirname(paths.room), path.dirname(paths.registry)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 各ファイル書き出し
fs.writeFileSync(paths.config, configTemplate);
fs.writeFileSync(paths.room, roomTemplate);
fs.writeFileSync(paths.css, cssModuleTemplate);

// games.ts の更新
const registryPath = path.join(process.cwd(), 'src/constants/games.ts');
if (fs.existsSync(registryPath)) {
  let content = fs.readFileSync(registryPath, 'utf-8');
  if (!content.includes(`id: "${lowerName}"`)) {
    const newEntry = `  { id: "${lowerName}", name: "${gameName}", icon: "${gameIcon}" }, \n]; `;
    content = content.replace(/];\s*$/, newEntry);
    fs.writeFileSync(registryPath, content);
  }
}

console.log(`✅ 生成完了: ${gameName} (CSS Modules)`);