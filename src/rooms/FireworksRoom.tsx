import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
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
import { useNavigate, useParams } from "react-router-dom";
import { RoundProgressTracker } from "../components/RoundProgressTracker";
import { useSocket } from "../hooks/useSocket.js";
import "./FireworksRoom.css";
import { FireWorksRule } from "./FireworksRule";

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

export default function FireworksRoom() {
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
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
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
      gamePresetId: "fireworks",
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
        setCurrentRound(data.currentRound + 1);
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
      <div className="fireworks-container">
        <div className="fireworks-entrance-wrapper">
          <h2 className="fireworks-title">XX花火大会</h2>
          <div className="fireworks-form-group">
            <input
              className="fireworks-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="お名前"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <button
              className="fireworks-join-button"
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
    <div className="fireworks-viewport">
      <div
        className="game-scalable-wrapper"
        ref={containerRef}
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
      >
        {gameResult && (
          <div className="fireworks-result-overlay">
            <div className="fireworks-result-modal">
              <div className="fw-result-header">
                <span className="fw-icon">🎇</span>
                <h2>花火大会終了!!</h2>
                <span className="fw-icon">🎇</span>
              </div>
              <p className="fw-result-message">{gameResult.message}</p>
              <div className="fw-ranking-list">
                {gameResult.rankings?.map((res: any) => (
                  <div
                    key={res.rank}
                    className={`fw-rank-item rank-${res.rank}`}
                  >
                    <div className="fw-rank-num">{res.rank}位</div>
                    <div className="fw-player-info">
                      <span className="fw-player-name">{res.name}</span>
                      <span className="fw-player-score">
                        {res.tokens} <small>点</small>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="fw-exit-button" onClick={() => navigate("/")}>
                ロビーへ戻る
              </button>
            </div>
          </div>
        )}

        <header className="fireworks-header">
          <div className="header-logo">
            <h1 className="logo-text">🎆 FIREWORKS</h1>
          </div>
          <div className="header-tracker">
            <RoundProgressTracker currentRound={currentRound} maxRound={5} />
          </div>
          <div className="header-nav">
            <button
              onClick={() => setShowRules(true)}
              className="nav-btn-rules"
            >
              📖 遊び方
            </button>
            <button onClick={() => navigate("/")} className="nav-btn-lobby">
              ロビーへ
            </button>
          </div>
        </header>

        <FireWorksRule isOpen={showRules} onClose={() => setShowRules(false)} />

        <main className="fireworks-main">
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
            <div key={player.id} className="draggable-saturated">
              <Draggable
                image="/images/fireworks/hanabishi.svg"
                mask={true}
                pieceId={player.id}
                socket={socket}
                roomId={roomId}
                initialX={100 + i * 110}
                initialY={750}
                color={player.color}
                size={80}
                containerRef={containerRef}
              />
            </div>
          ))}

          <div className="sidebar-left">
            <Deck
              socket={socket!}
              roomId={roomId}
              deckId="firework"
              name="[ 花火カード ]"
              playerId={currentPlayerId}
            />
            <div className="dice-section">
              <Dice sides={3} socket={socket} diceId="move" roomId={roomId} />
              <Dice
                sides={4}
                socket={socket}
                diceId="weather"
                roomId={roomId}
                customFaces={[
                  <img
                    key="f1"
                    src="/images/fireworks/weather_sunny.png"
                    className="dice-custom-face"
                  />,
                  <img
                    key="f2"
                    src="/images/fireworks/weather_cloud.png"
                    className="dice-custom-face"
                  />,
                  <img
                    key="f3"
                    src="/images/fireworks/weather_wind.png"
                    className="dice-custom-face"
                  />,
                  <img
                    key="f4"
                    src="/images/fireworks/weather_rain.png"
                    className="dice-custom-face"
                  />,
                ]}
              />
            </div>
          </div>

          <div className="fireworks-main-field">
            <PlayField
              socket={socket}
              roomId={roomId}
              deckId="firework"
              name="花火カード"
              players={players}
              myPlayerId={myPlayerId}
              layoutMode="free"
            />
          </div>

          <div className="sidebar-right">
            <ScoreBoard
              socket={socket!}
              roomId={roomId}
              players={players}
              currentPlayerId={currentPlayerId}
              myPlayerId={myPlayerId}
            />
          </div>

          <div className="token-pos">
            <TokenStore
              socket={socket!}
              roomId={roomId}
              tokenStoreId="STAR_PARTS"
              name="秘伝玉"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
