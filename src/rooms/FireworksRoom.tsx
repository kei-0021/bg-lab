import { useCallback, useEffect, useRef, useState } from "react";
import type { GameTurnUpdateData, Player, RoomJoinData } from "react-game-ui";
import {
  Deck,
  Dice,
  Draggable,
  PlayField,
  RemoteCursor,
  ScoreBoard,
} from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import { useNavigate, useParams } from "react-router-dom";
import { LaunchArea } from "../components/LaunchArea";
import { RoundProgressTracker } from "../components/RoundProgressTracker";
import { useSocket } from "../hooks/useSocket.js";
import styles from "./FireworksRoom.module.css";
import fieldStyles from "./FireworksRoomField.module.css";
import { FireWorksRule } from "./FireworksRule";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

const Z_INDEX_SMOKE = 1000;
const Z_INDEX_CARD = 2000;
const Z_INDEX_PLAYER = 3000;

export default function FireworksRoom() {
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
  const [fieldClassName, setFieldClassName] = useState<string>(
    "fireworksRequtangleField",
  );

  const toggleFieldLayout = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("playfield:switch", { roomId });
  }, [socket, roomId]);

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
      gameId: "fireworks",
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

    const handlePlayersUpdate = (updatedPlayers: Player[]) =>
      setPlayers(updatedPlayers);

    const handleGameTurn = (data: GameTurnUpdateData) => {
      setCurrentPlayerId(data.currentPlayerId);
      setCurrentRound(data.currentRoundIndex + 1);
    };

    const handleGameEnd = (result: any) => setGameResult(result);

    const handleFieldSwitch = () => {
      setFieldClassName((prev) =>
        prev === "fireworksRequtangleField"
          ? "fireworksCircleField"
          : "fireworksRequtangleField",
      );
    };

    socket.on("player:assign-id", handleAssignId);
    socket.on("client:ready-to-sync", onClientReady);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:turn", handleGameTurn);
    socket.on("game:end", handleGameEnd);
    socket.on("playfield:switch", handleFieldSwitch);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:turn", handleGameTurn);
      socket.off("game:end", handleGameEnd);
      socket.off("playfield:switch", handleFieldSwitch);
    };
  }, [socket]);

  if (!roomId) return null;

  if (!hasJoined) {
    return (
      <div className={styles.fireworksContainer}>
        <div className={styles.fireworksEntranceWrapper}>
          <h2 className={styles.fireworksTitle}>XX花火大会</h2>
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
            <h1 className={styles.logoText}>🎆 FIREWORKS</h1>
          </div>
          <div className={styles.headerTracker}>
            <RoundProgressTracker currentRound={currentRound} maxRound={10} />
          </div>
          <div className={styles.headerNav}>
            <button
              onClick={() => setShowRules(true)}
              className={styles.navBtnRules}
            >
              📖 遊び方
            </button>
            <button onClick={toggleFieldLayout} className={styles.navBtnLobby}>
              レイアウト切替
            </button>
            <button
              onClick={() => navigate("/")}
              className={styles.navBtnLobby}
            >
              ロビーへ
            </button>
          </div>
        </header>

        <FireWorksRule isOpen={showRules} onClose={() => setShowRules(false)} />

        {/* 煙Draggable 10個 - 右下にスタック配置 */}
        {[...Array(10)].map((_, i) => (
          <Draggable
            draggableId={`smoke-${i}`}
            socket={socket}
            roomId={roomId}
            initialXY={{ x: 1350 + i * 5, y: 700 + i * 5 }}
            size={{ width: 360, height: 120 }}
            zIndex={Z_INDEX_SMOKE}
            containerRef={containerRef}
            scale={scale}
            isTransparent={true}
            style={{
              // 枠線を白の 50% 透明にする
              border: "1px solid rgba(255, 255, 255, 0.5)",

              // もし背景も半透明にするなら（例：黒の 30%）
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(1px)",
            }}
          ></Draggable>
        ))}

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
          {players.map((player, i) => (
            <div key={player.id}>
              <Draggable
                image="/images/fireworks/hanabishi.svg"
                mask={true}
                draggableId={player.id}
                socket={socket}
                roomId={roomId}
                initialXY={{ x: 100 + i * 110, y: 750 }}
                color={player.color}
                zIndex={Z_INDEX_PLAYER}
                size={80}
                containerRef={containerRef}
              />
            </div>
          ))}

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
            <div className={styles.diceSection}>
              <div className={styles.diceWrapper}>
                <Dice
                  sides={3}
                  socket={socket}
                  diceId="move"
                  roomId={roomId}
                  title="3面ダイス"
                />
              </div>

              <div className={styles.diceWrapper}>
                <Dice
                  sides={4}
                  socket={socket}
                  diceId="move2"
                  roomId={roomId}
                  title="4面ダイス"
                />
              </div>

              <div className={styles.diceWrapper}>
                <Dice
                  sides={4}
                  socket={socket}
                  diceId="weather"
                  roomId={roomId}
                  title="天候ダイス"
                  tooltipText="快晴・曇り・風・雨"
                  customFaces={[
                    <img
                      key="f1"
                      src="/images/fireworks/weather/sunny.png"
                      className={styles.diceCustomFace}
                    />,
                    <img
                      key="f2"
                      src="/images/fireworks/weather/cloud.png"
                      className={styles.diceCustomFace}
                    />,
                    <img
                      key="f3"
                      src="/images/fireworks/weather/wind.png"
                      className={styles.diceCustomFace}
                    />,
                    <img
                      key="f4"
                      src="/images/fireworks/weather/rain.png"
                      className={styles.diceCustomFace}
                    />,
                  ]}
                />
              </div>
            </div>
          </aside>

          <div
            className={`${fieldStyles.baseField} ${fieldStyles[fieldClassName]}`}
          >
            <PlayField
              socket={socket}
              roomId={roomId}
              deckId="firework"
              title=""
              players={players}
              myPlayerId={myPlayerId}
              layoutMode="free"
              baseZIndex={Z_INDEX_CARD}
            />
            {fieldClassName !== "fireworksCircleField" && <LaunchArea />}
          </div>

          <div className={styles.sidebarRight}>
            <ScoreBoard
              socket={socket!}
              roomId={roomId}
              players={players}
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
              isDebug={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
