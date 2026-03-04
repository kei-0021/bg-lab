import { useCallback, useEffect, useRef, useState } from "react";
import type { GameTurnUpdateData, Player, RoomJoinData } from "react-game-ui";
import {
  Deck,
  PlayField,
  RemoteCursor,
  ScoreBoard,
  SystemMessageWindow,
} from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import { useNavigate, useParams } from "react-router-dom";
import { RoundProgressTracker } from "../components/RoundProgressTracker";
import { useSocket } from "../hooks/useSocket.js";
import styles from "./FireworksRoom.module.css";
import fieldStyles from "./FireworksRoomField.module.css";
import { FireWorksRuleⅡ } from "./FireworksRuleⅡ";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;
const Z_INDEX_CARD = 2000;

export default function FireworksRoomⅡ() {
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

  const [showRules, setShowRules] = useState<boolean>(false);
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
      gameId: "fireworksⅡ",
      playerName: userName.trim(),
    } as RoomJoinData);
  }, [socket, roomId, userName, isJoining]);

  const handleAssignId = useCallback((id: Player["id"]) => {
    setMyPlayerId(id);
    setHasJoined(true);
    setIsJoining(false);
  }, []);

  const handlePlayersUpdate = useCallback(
    (updatedPlayers: Player[]) => setPlayers(updatedPlayers),
    [],
  );

  const handleGameTurn = useCallback(
    (data: GameTurnUpdateData) => {
      const nextRound = data.currentRoundIndex + 1;
      if (nextRound !== currentRound) {
      }
      setCurrentPlayerId(data.currentPlayerId);
      setCurrentRound(nextRound);
    },
    [currentRound],
  );

  const handleGameEnd = useCallback((result: any) => {
    setGameResult(result);
  }, []);

  useEffect(() => {
    if (!socket) return;
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
  }, [
    socket,
    handleAssignId,
    handlePlayersUpdate,
    handleGameTurn,
    handleGameEnd,
  ]);

  if (!roomId) return null;

  if (!hasJoined) {
    return (
      <div className={styles.fireworksContainer}>
        <div className={styles.fireworksEntranceWrapper}>
          <h2 className={styles.fireworksTitle}>XX花火大会Ⅱ</h2>
          <div className={styles.fireworksFormGroup}>
            <input
              className={styles.fireworksInput}
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="お名前"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <button
              className={styles.fireworksJoinButton}
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              {isJoining ? "入場中" : "入場"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fireworksViewport}>
      <div
        className={styles.gameScalableWrapper}
        ref={containerRef}
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          willChange: "transform",
        }}
      >
        {gameResult && (
          <div className={styles.fireworksResultOverlay}>
            <div className={styles.fireworksResultModal}>
              <div className={styles.fwResultHeader}>
                <span className={styles.fwIcon}>🎇</span>
                <h2>花火大会終了!!</h2>
                <span className={styles.fwIcon}>🎇</span>
              </div>
              <p className={styles.fwResultMessage}>{gameResult.message}</p>
              <div className={styles.fwRankingList}>
                {gameResult.rankings?.map((res: any) => (
                  <div
                    key={res.rank}
                    className={`${styles.fwRankItem} ${styles[`rank${res.rank}`]}`}
                  >
                    <div className={styles.fwRankNum}>{res.rank}位</div>
                    <div className={styles.fwPlayerInfo}>
                      <span className={styles.fwPlayerName}>{res.name}</span>
                      <span className={styles.fwPlayerScore}>
                        {res.tokens} <small>点</small>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.fwExitButton}
                onClick={() => navigate("/")}
              >
                ロビーへ戻る
              </button>
            </div>
          </div>
        )}

        <header className={styles.fireworksHeader}>
          <div className={styles.headerLogo}>
            <h1 className={styles.logoText}>🎆 FIREWORKSⅡ</h1>
          </div>
          <div className={styles.headerTracker}>
            <RoundProgressTracker currentRound={currentRound} maxRound={8} />
          </div>
          <div className={styles.headerNav}>
            <button
              onClick={() => setShowRules(true)}
              className={styles.navBtnRules}
            >
              📖 遊び方
            </button>
            <button
              onClick={() => navigate("/")}
              className={styles.navBtnLobby}
            >
              ロビーへ
            </button>
          </div>
        </header>

        <FireWorksRuleⅡ
          isOpen={showRules}
          onClose={() => setShowRules(false)}
        />

        {/* メッセージウィンドウ */}
        <SystemMessageWindow
          socket={socket}
          roomId={roomId}
          displayDuration={5000}
        />

        <main className={styles.fireworksMain}>
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
              deckId="firework"
              title="[ 花火カード ]"
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              alwaysDraw={true}
            />
            <Deck
              socket={socket!}
              roomId={roomId}
              deckId="theme"
              title="[ 演目カード ]"
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              alwaysDraw={true}
            />
            <Deck
              socket={socket!}
              roomId={roomId}
              deckId="color"
              title="[ カラーカード ]"
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              alwaysDraw={true}
            />
          </aside>

          <div
            className={`${fieldStyles.baseField} ${fieldStyles["fireworksRequtangleField"]}`}
          >
            <PlayField
              socket={socket!}
              roomId={roomId}
              deckId="firework"
              title=""
              players={players}
              myPlayerId={myPlayerId}
              layoutMode="grid"
              baseZIndex={Z_INDEX_CARD}
            />
          </div>

          <div className={styles.sidebarRight}>
            <ScoreBoard
              socket={socket!}
              roomId={roomId}
              players={players}
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              playCardLimit={3}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
