import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
import {
  Deck,
  Dice,
  Draggable,
  RemoteCursor,
  ScoreBoard,
  TokenStore,
} from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import { useNavigate, useParams } from "react-router-dom";
import GridDeliverRoad from "../components/GridDeliverRoad.js";
import { useSocket } from "../hooks/useSocket.js";
import styles from "./UberNinjaRoom.module.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

interface TurnUpdatePayload {
  playerId: string;
  currentRound: number;
  currentTurnIndex: number;
}

export function UberNinjaRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
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
      gamePresetId: "uber-ninja",
      playerName: userName.trim(),
    });
  }, [socket, roomId, userName, isJoining]);

  useEffect(() => {
    if (!socket) return;
    const handleAssignId = (id: Player["id"]) => {
      setMyPlayerId(id);
      setHasJoined(true);
      setIsJoining(false);
    };
    const handlePlayersUpdate = (updatedPlayers: PlayerWithResources[]) =>
      setPlayers(updatedPlayers);
    const handleGameTurn = (data: TurnUpdatePayload | string) => {
      if (typeof data === "string") {
        setCurrentPlayerId(data);
      } else {
        setCurrentPlayerId(data.playerId);
      }
    };
    const handleGameEnd = (result: any) => setGameResult(result);

    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:turn", handleGameTurn);
    socket.on("game:end", handleGameEnd);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:turn", handleGameTurn);
      socket.off("game:end", handleGameEnd);
    };
  }, [socket]);

  if (!roomId) return null;

  if (!hasJoined) {
    return (
      <div className={styles.ninjaContainer}>
        <div className={styles.ninjaEntranceWrapper}>
          <h2 className={styles.ninjaTitle}>忍びの里：極</h2>
          <div className={styles.ninjaFormGroup}>
            <input
              className={styles.ninjaInput}
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="忍名（シノビネーム）"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <button
              className={styles.ninjaJoinButton}
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              {isJoining ? "潜入中..." : "いざ参る"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ninjaViewport}>
      <div
        className={styles.gameScalableWrapper}
        ref={containerRef}
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
      >
        {gameResult && (
          <div className={styles.ninjaResultOverlay}>
            <div className={styles.ninjaResultModal}>
              <div className={styles.ninjaResultHeader}>
                <span className={styles.ninjaIcon}>⚔️</span>
                <h2>任務完了!!</h2>
                <span className={styles.ninjaIcon}>⚔️</span>
              </div>
              <p className={styles.ninjaResultMessage}>{gameResult.message}</p>
              <div className={styles.ninjaRankingList}>
                {gameResult.rankings?.map((res: any) => (
                  <div
                    key={res.rank}
                    className={`${styles.ninjaRankItem} ${styles[`rank${res.rank}`]}`}
                  >
                    <div className={styles.ninjaRankNum}>{res.rank}位</div>
                    <div className={styles.ninjaPlayerInfo}>
                      <span className={styles.ninjaPlayerName}>{res.name}</span>
                      <span className={styles.ninjaPlayerScore}>
                        {res.tokens} <small>貫</small>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.ninjaExitButton}
                onClick={() => navigate("/")}
              >
                里を去る
              </button>
            </div>
          </div>
        )}

        <header className={styles.ninjaHeader}>
          <div className={styles.headerLogo}>
            <h1 className={styles.logoText}>🥷 UBER NINJA</h1>
          </div>
          <div className={styles.headerNav}>
            <button
              onClick={() => navigate("/")}
              className={styles.navBtnLobby}
            >
              撤退
            </button>
          </div>
        </header>

        <main className={styles.ninjaMain}>
          <RemoteCursor
            socket={socket!}
            roomId={roomId}
            myPlayerId={myPlayerId}
            players={players.map((p) => ({
              name: p.name || "Unknown",
              socketId: String(p.id),
              color: p.color,
            }))}
            scale={scale}
            fixedContainerRef={containerRef}
            visible={true}
            isRelative={false}
          />

          {/* 左サイドバー */}
          <aside className={styles.sidebarLeft}>
            <Deck
              socket={socket!}
              roomId={roomId}
              deckId="jutsu-scroll"
              name="[ 忍術の書 ]"
              playerId={currentPlayerId}
            />
            <div className={styles.diceSection}>
              <Dice
                sides={6}
                socket={socket}
                diceId="action-move"
                roomId={roomId}
              />
              <Dice
                sides={4}
                socket={socket}
                diceId="environment"
                roomId={roomId}
                customFaces={[
                  <div key="e1" className={styles.diceCustomFace}>
                    ☀️ 昼
                  </div>,
                  <div key="e2" className={styles.diceCustomFace}>
                    🌙 夜
                  </div>,
                  <div key="e3" className={styles.diceCustomFace}>
                    🌫️ 霧
                  </div>,
                  <div key="e4" className={styles.diceCustomFace}>
                    🏮 警戒
                  </div>,
                ]}
              />
            </div>
            {/* クナイ残数をサイドバー内の最下部に相対配置 */}
            <div className={styles.tokenPos}>
              <TokenStore
                socket={socket!}
                roomId={roomId}
                tokenStoreId="KUNAI_COUNT"
                name="クナイ残数"
              />
            </div>
          </aside>

          {/* 中央：配達グリッドボード */}
          <div className={styles.centerBoard}>
            <GridDeliverRoad rows={8} cols={8} />
          </div>

          {/* 右サイドバー */}
          <aside className={styles.sidebarRight}>
            <ScoreBoard
              socket={socket!}
              roomId={roomId}
              players={players}
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              isDebug={true}
            />
          </aside>

          {/* 駒レイヤー (Absolute) */}
          {players.map((player, i) => (
            <div key={player.id} className={styles.ninjaPieceWrapper}>
              <Draggable
                image="/images/ninja/ninja_icon.svg"
                mask={true}
                pieceId={player.id}
                socket={socket}
                roomId={roomId}
                initialX={150 + i * 120}
                initialY={750}
                color={player.color}
                size={70}
                containerRef={containerRef}
                scale={scale}
              />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
