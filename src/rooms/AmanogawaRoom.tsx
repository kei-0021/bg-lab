import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Draggable, RemoteCursor } from "react-game-ui";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import "./AmanogawaRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const GRID_SIZE = 500;
const CELL_SIZE = 100;
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1200;

export function AmanogawaRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [resetCount, setResetCount] = useState(0);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [showRemoteCursors, setShowRemoteCursors] = useState(true);
  const fixedContainerRef = useRef<HTMLDivElement>(null);

  // スケール計算
  const [scale, setScale] = useState(1);
  const calculateScale = useCallback(() => {
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    setScale(Math.min(1.0, Math.min(scaleX, scaleY)));
  }, []);

  useEffect(() => {
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [calculateScale]);

  // ソケット通信管理
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.on("player:assign-id", (id: string) => {
      setMyPlayerId(id);
      setHasJoined(true);
      setIsJoining(false);
    });
    socket.on("players:update", (updatedPlayers: any[]) =>
      setPlayers(updatedPlayers),
    );
    socket.on("reset:draggable", () => setResetCount((prev) => prev + 1));

    return () => {
      socket.off("player:assign-id");
      socket.off("players:update");
      socket.off("reset:draggable");
    };
  }, [socket, roomId, resetCount]);

  const handleJoinRoom = () => {
    if (!socket || !roomId || userName.trim() === "" || isJoining) return;
    setIsJoining(true);
    socket.emit("room:join", {
      roomId,
      gamePresetId: "amanogawa",
      playerName: userName.trim(),
    });
  };

  const gridBounds = useMemo(
    () => ({
      left: GAME_WIDTH / 2 - GRID_SIZE / 2,
      top: GAME_HEIGHT / 2 - GRID_SIZE / 2,
      right: GAME_WIDTH / 2 + GRID_SIZE / 2,
      bottom: GAME_HEIGHT / 2 + GRID_SIZE / 2,
      cellSize: CELL_SIZE,
    }),
    [],
  );

  const { pieces, playerPiece } = useMemo(() => {
    const tilePieces = Array.from({ length: 25 }).map((_, i) => {
      const isTransparent = i >= 16;
      const initialX = (0.05 + (i % 4) * 0.04) * GAME_WIDTH;
      const initialY = (0.4 + Math.floor(i / 4) * 0.04) * GAME_HEIGHT;

      return (
        <Draggable
          key={`piece-${i}-${resetCount}`}
          pieceId={`piece-${i}`}
          socket={socket}
          roomId={roomId}
          initialX={initialX}
          initialY={initialY}
          color={i < 8 ? "#0a192f" : " #94ceee"}
          isTransparent={isTransparent}
          gridBounds={gridBounds}
          scale={scale}
          containerRef={fixedContainerRef}
        >
          {isTransparent && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 4,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "white",
                  border: "1px solid black",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#94ceee",
                  pointerEvents: "none",
                }}
              >
                止
              </div>
            </>
          )}
        </Draggable>
      );
    });

    const player = (
      <Draggable
        key={`player-${resetCount}`}
        pieceId={`player`}
        socket={socket}
        roomId={roomId}
        initialX={0.5 * GAME_WIDTH}
        initialY={0.8 * GAME_HEIGHT}
        color="white"
        size={80}
        style={{
          backgroundColor: myPlayerId ? "#fde68a" : "#ccc",
          color: "#111827",
          border: "5px solid white",
          borderRadius: "50%",
          boxShadow:
            "0 0 10px 4px rgba(255, 255, 255, 0.8), 0 0 20px 8px #1e90ff",
          zIndex: 100,
        }}
        gridBounds={gridBounds}
        scale={scale}
        containerRef={fixedContainerRef}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: "bold",
            color: "#ffffff",
            textShadow: "0 0 10px #fff9c4",
          }}
        >
          ⭐️
        </div>
      </Draggable>
    );

    return { pieces: tilePieces, playerPiece: player };
  }, [resetCount, socket, roomId, myPlayerId, gridBounds, scale]);

  if (!hasJoined) {
    return (
      <div className="light-road-room full-screen-background">
        <div className="join-form">
          <h2
            style={{
              color: "#94ceee",
              marginBottom: "5px",
              textShadow: "0 0 10px rgba(148,206,238,0.5)",
            }}
          >
            天の川・ルーム参加
          </h2>
          <input
            className="join-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="名前を入力"
            maxLength={12}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            autoFocus
          />
          <button
            className="join-button"
            onClick={handleJoinRoom}
            disabled={!userName.trim() || isJoining}
          >
            {isJoining ? "参加中..." : "ルームに参加"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="light-road-room">
      <div className="title-section" style={{ zIndex: 1000 }}>
        <div className="header-info">
          <h1>🌟 天の川</h1>
          <p>ルームID: {roomId}</p>
          <p>プレイヤー: {players.map((p) => p.name).join(", ")}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowRemoteCursors(!showRemoteCursors)}
            className="lobby-button"
            style={{
              backgroundColor: showRemoteCursors ? "#4ecdc4" : "#ff6b6b",
            }}
          >
            {showRemoteCursors ? "カーソル表示 ON" : "カーソル表示 OFF"}
          </button>
          <button
            onClick={() => {
              socket?.emit("reset:draggable", { roomId });
            }}
            className="lobby-button"
          >
            🔄 タイル位置を全てリセット
          </button>
          <button onClick={() => navigate("/")} className="lobby-button">
            🏠 ロビーへ戻る
          </button>
        </div>
      </div>

      <div
        ref={fixedContainerRef}
        className="light-road-room-fixed-container"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="goal-area" style={{ zIndex: 10 }}>
          <h2>GOAL!</h2>
        </div>
        <div className="game-board-container" style={{ zIndex: 5 }} />
        <div className="pieces-layer" style={{ zIndex: 20 }}>
          {playerPiece}
          {pieces}
        </div>
        <RemoteCursor
          socket={socket}
          roomId={roomId}
          myPlayerId={myPlayerId}
          players={players}
          scale={scale}
          fixedContainerRef={fixedContainerRef}
          visible={showRemoteCursors}
        />
      </div>
    </div>
  );
}
