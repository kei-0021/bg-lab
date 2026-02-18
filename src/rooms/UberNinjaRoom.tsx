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
import { useSocket } from "../hooks/useSocket.js";
import "./UberNinjaRoom.css";

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

  // レスポンシブ対応のスケール計算
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
      gamePresetId: "uber-ninja", // プリセットIDを変更
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

  // 入場画面（忍びの里への入り口）
  if (!hasJoined) {
    return (
      <div className="ninja-container">
        <div className="ninja-entrance-wrapper">
          <h2 className="ninja-title">忍びの里：極</h2>
          <div className="ninja-form-group">
            <input
              className="ninja-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="忍名（シノビネーム）"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <button
              className="ninja-join-button"
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
    <div className="ninja-viewport">
      <div
        className="game-scalable-wrapper"
        ref={containerRef}
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
      >
        {/* リザルト画面 */}
        {gameResult && (
          <div className="ninja-result-overlay">
            <div className="ninja-result-modal">
              <div className="ninja-result-header">
                <span className="ninja-icon">⚔️</span>
                <h2>任務完了!!</h2>
                <span className="ninja-icon">⚔️</span>
              </div>
              <p className="ninja-result-message">{gameResult.message}</p>
              <div className="ninja-ranking-list">
                {gameResult.rankings?.map((res: any) => (
                  <div
                    key={res.rank}
                    className={`ninja-rank-item rank-${res.rank}`}
                  >
                    <div className="ninja-rank-num">{res.rank}位</div>
                    <div className="ninja-player-info">
                      <span className="ninja-player-name">{res.name}</span>
                      <span className="ninja-player-score">
                        {res.tokens} <small>貫</small>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="ninja-exit-button"
                onClick={() => navigate("/")}
              >
                里を去る
              </button>
            </div>
          </div>
        )}

        <header className="ninja-header">
          <div className="header-logo">
            <h1 className="logo-text">🥷 UBER NINJA</h1>
          </div>
          <div className="header-nav">
            <button onClick={() => navigate("/")} className="nav-btn-lobby">
              撤退
            </button>
          </div>
        </header>

        <main className="ninja-main">
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

          {/* プレイヤーの駒（忍者） */}
          {players.map((player, i) => (
            <div key={player.id} className="ninja-piece-wrapper">
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
              />
            </div>
          ))}

          <div className="sidebar-left">
            <Deck
              socket={socket!}
              roomId={roomId}
              deckId="jutsu-scroll"
              name="[ 忍術の書 ]"
              playerId={currentPlayerId}
            />
            <div className="dice-section">
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
                  <div key="e1" className="dice-custom-face">
                    🥷 昼
                  </div>,
                  <div key="e2" className="dice-custom-face">
                    🌙 夜
                  </div>,
                  <div key="e3" className="dice-custom-face">
                    🌫️ 霧
                  </div>,
                  <div key="e4" className="dice-custom-face">
                    🏮 警戒
                  </div>,
                ]}
              />
            </div>
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
              tokenStoreId="KUNAI_COUNT"
              name="クナイ残数"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
