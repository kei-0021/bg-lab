// src/rooms/LightRoadRoom.tsx (最終修正版: 指アイコンON/OFF機能追加)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Draggable from "../components/Draggable";
import { useSocket } from "../hooks/useSocket";
import "./LightRoadRoom.css";

// 💡 サーバーURLを定義
const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

type PlayerWithResources = {
  id: string;
  name: string;
  socketId: string;
};

// --- カーソル同期のための型定義 ---
type RemoteCursor = {
  x: number;
  y: number;
  name: string;
  color: string;
};
// ---------------------------------

// 💡 グリッド定数
const GRID_SIZE = 500; // px
const CELL_SIZE = 100; // px
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1200;

// 💡 プレイヤーIDに応じて色を決定するヘルパー関数
const getPlayerColor = (playerId: string, index: number): string => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9d423", "#a8dadc"];
  return colors[index % colors.length] || "#999999";
};

// 💡 リモートカーソルを描画するコンポーネント
const RemoteCursorRenderer = React.memo(
  ({
    playerId,
    cursor,
    scale,
    fixedContainer,
  }: {
    playerId: string;
    cursor: RemoteCursor;
    scale: number;
    fixedContainer: HTMLDivElement | null;
  }) => {
    if (!scale) return null;

    const x_px = cursor.x;
    const y_px = cursor.y;

    return (
      <div
        key={playerId}
        style={{
          position: "absolute",
          left: x_px,
          top: y_px,
          pointerEvents: "none",
          zIndex: 900,
        }}
      >
        {/* カーソルアイコン (ポインター) */}
        <div
          style={{
            color: cursor.color,
            fontSize: "2em",
            position: "absolute",
            transform: "translate(-100%, -100%)",
          }}
        >
          👆
        </div>
        {/* プレイヤー名 */}
        <div
          style={{
            backgroundColor: cursor.color,
            color: "white",
            padding: "2px 5px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            position: "absolute",
            transform: "translate(5px, 0px)",
            fontWeight: "bold",
            lineHeight: 1,
          }}
        >
          {cursor.name}
        </div>
      </div>
    );
  },
);

export default function LightRoadRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const roomNameFromURL = queryParams.get("roomName") || "Light Road Room";

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const [resetCount, setResetCount] = useState(0);

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  // ★ カーソル同期用ステート
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, RemoteCursor>
  >({});

  // ★ 追加 1: リモートカーソル表示のON/OFFステート
  const [showRemoteCursors, setShowRemoteCursors] = useState(true);

  // ★ DOM参照用Ref
  const fixedContainerRef = React.useRef<HTMLDivElement>(null);

  // ★ players ステートの最新値を保持するためのRefを追加
  const playersRef = React.useRef(players);
  useEffect(() => {
    // players が更新されるたびに Ref の current 値を更新
    playersRef.current = players;
  }, [players]);

  // 画面サイズに合わせてスケールを計算するロジック
  const [scale, setScale] = useState(1);
  const calculateScale = useCallback(() => {
    // 画面サイズと固定サイズを比較
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const newScale = Math.min(scaleX, scaleY);
    // 最大スケールは1.0 (画面より小さく表示されるのは許容)
    setScale(Math.min(1.0, newScale));
  }, []);

  useEffect(() => {
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => {
      window.removeEventListener("resize", calculateScale);
    };
  }, [calculateScale]);

  const handleJoinRoom = useCallback(() => {
    if (!socket || !roomId || userName.trim() === "" || isJoining) return;

    setIsJoining(true);
    socket.emit("room:join", {
      roomId,
      gamePresetId: "lightroad",
      playerName: userName.trim(),
    });
  }, [socket, roomId, userName, isJoining]);

  const handleReset = useCallback(() => {
    if (!socket || !roomId) return;

    setResetCount((prev) => prev + 1);
    socket.emit("reset:draggable", { roomId });
  }, [socket, roomId]);

  // ★ handleCursorUpdate のロジックを修正
  const handleCursorUpdate = useCallback(
    (data: { playerId: string; x: number; y: number }) => {
      if (data.playerId === myPlayerId) return;

      const currentPlayers = playersRef.current;

      // p.socketId で検索
      const playerIndex = currentPlayers.findIndex(
        (p) => p.socketId === data.playerId,
      );

      const player = currentPlayers[playerIndex];

      // プレイヤー情報が見つからなかった場合の暫定値
      const nameToDisplay = player ? player.name : `[待機中]`;
      const colorToUse = player
        ? getPlayerColor(data.playerId, playerIndex)
        : "#999999";

      setRemoteCursors((prev) => ({
        ...prev,
        [data.playerId]: {
          x: data.x,
          y: data.y,
          name: nameToDisplay,
          color: colorToUse,
        },
      }));
    },
    [myPlayerId],
  );

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleAssignId = (id: string) => {
      setMyPlayerId(id);
      setHasJoined(true);
      setIsJoining(false);
    };

    const handlePlayersUpdate = (updatedPlayers: PlayerWithResources[]) => {
      setPlayers(updatedPlayers);
    };

    const handleRemoteReset = () => {
      setResetCount((prev) => prev + 1);
    };

    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("draggable:update", () => {
      /* ロジックはDraggable内に移動 */
    });
    socket.on("reset:draggable", handleRemoteReset);
    socket.on("cursor:update", handleCursorUpdate);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("draggable:update", () => {
        /* クリーンアップ */
      });
      socket.off("reset:draggable", handleRemoteReset);
      socket.off("cursor:update", handleCursorUpdate);
    };
  }, [socket, roomId, myPlayerId, handleCursorUpdate]);

  // ★ カーソル位置をサーバーに送信するロジック (FPSダウン&相対座標化)
  useEffect(() => {
    if (
      !socket ||
      !roomId ||
      !hasJoined ||
      !myPlayerId ||
      !fixedContainerRef.current
    )
      return;

    const container = fixedContainerRef.current;

    const THROTTLE_INTERVAL = 100; // 100ms (最大 10 FPS)
    let lastEmitTime = 0;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastEmitTime < THROTTLE_INTERVAL) {
        return;
      }
      lastEmitTime = now;

      const { clientX, clientY } = event;
      const rect = container.getBoundingClientRect();

      // 1. 画面座標からコンテナの画面上の位置を引く
      const x_scaled = clientX - rect.left;
      const y_scaled = clientY - rect.top;

      // 2. スケールで割って、ゲーム内のピクセル座標 (GAME_WIDTH/HEIGHT基準) に戻す
      const x_game = x_scaled / scale;
      const y_game = y_scaled / scale;

      // ゲーム内の相対ピクセル座標を送信
      socket.emit("cursor:move", {
        roomId,
        x: x_game,
        y: y_game,
      });
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [socket, roomId, hasJoined, myPlayerId, scale]);
  // ---------------------------------------------------

  // グリッドのピクセル座標 (GAME_WIDTH/HEIGHT基準) を計算
  const gridBounds = useMemo(() => {
    const left = GAME_WIDTH / 2 - GRID_SIZE / 2;
    const top = GAME_HEIGHT / 2 - GRID_SIZE / 2;

    return {
      left,
      top,
      right: left + GRID_SIZE,
      bottom: top + GRID_SIZE,
      cellSize: CELL_SIZE,
    };
  }, []);

  const { pieces, playerPiece } = useMemo(() => {
    const totalPieces = 25;

    // 初期配置の基準位置を fixed-container の比率で定義
    const baseInitialX_perc = 0.05;
    const baseInitialY_perc = 0.4;
    const spacing_perc_x = 0.04;
    const spacing_perc_y = 0.04;

    // タイルピース
    const tilePieces = Array.from({ length: totalPieces }).map((_, i) => {
      let color: string;
      let isTransparent = false;

      if (i < 8) color = "black";
      else if (i < 16) color = "yellow";
      else {
        color = "yellow";
        isTransparent = true;
      }

      const column = i % 4;
      const row = Math.floor(i / 4);

      // 駒の中心のピクセル座標を計算 (GAME_WIDTH/HEIGHT 基準)
      const initialX_px =
        (baseInitialX_perc + column * spacing_perc_x) * GAME_WIDTH;
      const initialY_px =
        (baseInitialY_perc + row * spacing_perc_y) * GAME_HEIGHT;

      return (
        <Draggable
          key={`piece-${i}-${resetCount}`}
          pieceId={`piece-${i}`}
          socket={socket}
          roomId={roomId}
          initialX={initialX_px}
          initialY={initialY_px}
          color={color}
          isTransparent={isTransparent}
          gridBounds={gridBounds}
          scale={scale}
        >
          {isTransparent && (
            <>
              {/* 左上マーク */}
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
              {/* 中央文字「止」 */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "yellow",
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

    // プレイヤー駒
    const playerPiece = (
      <Draggable
        key={`player-${resetCount}`}
        pieceId={`player`}
        socket={socket}
        roomId={roomId}
        // 画面下部中央付近に配置 (fixed-container 基準)
        initialX={0.5 * GAME_WIDTH}
        initialY={0.8 * GAME_HEIGHT}
        color="white"
        isTransparent={false}
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
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: "bold",
            color: "#1e90ff",
            textShadow: "0 0 5px white",
          }}
        >
          ⭐️
        </div>
      </Draggable>
    );

    return { pieces: tilePieces, playerPiece };
  }, [resetCount, socket, roomId, myPlayerId, players, gridBounds, scale]);

  // --- UI表示ロジック (参加フォーム) ---
  const joinFormStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#374151",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 0 20px rgba(253, 230, 138, 0.5)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    textAlign: "center",
  };
  const joinInputStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #fde68a",
    backgroundColor: "#111827",
    color: "white",
    fontSize: "1em",
  };
  const joinButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#fde68a",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1em",
    transition: "background-color 0.3s",
  };

  if (!roomId || !socket)
    return (
      <div className="light-road-room">
        <h1>🌟 Light Road</h1>
        <p>⚠️ ルーム情報エラー / サーバー接続中...</p>
      </div>
    );

  if (!hasJoined) {
    return (
      <div className="light-road-room full-screen-background">
        <div style={joinFormStyle}>
          <h2 style={{ color: "#fde68a", marginBottom: "5px" }}>
            Light Road ルーム参加
          </h2>
          <p style={{ margin: "0 0 10px 0", color: "white" }}>
            ルーム名: **{decodeURIComponent(roomNameFromURL)}**
          </p>
          <input
            style={joinInputStyle}
            type="text"
            placeholder="あなたの名前を入力してください"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isJoining}
            maxLength={12}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          <button
            style={joinButtonStyle}
            onClick={handleJoinRoom}
            disabled={userName.trim() === "" || isJoining}
          >
            {isJoining ? "参加中..." : "ルームに参加"}
          </button>
          {isJoining && (
            <p style={{ margin: "5px 0 0 0 0", color: "#ffeb3b" }}>
              サーバーからの応答を待っています...
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- UI表示ロジック (ゲーム画面) ---
  return (
    <div className="light-road-room">
      {/* ★ 1. ヘッダーを固定コンテナの外へ移動 (レスポンシブ化) */}
      <div className="title-section" style={{ zIndex: 1000 }}>
        <div className="header-info">
          <h1>🌟 Light Road</h1>
          <p>
            ルームID: {roomId} (My ID: {myPlayerId})
          </p>
          <p>プレイヤー: {players.map((p) => p.name).join(", ")}</p>
        </div>

        <div className="header-actions">
          {/* ★ 追加 2: カーソル表示トグルボタン */}
          <button
            onClick={() => setShowRemoteCursors((prev) => !prev)}
            className="lobby-button reset-button"
            style={{
              backgroundColor: showRemoteCursors ? "#4ecdc4" : "#ff6b6b",
            }}
          >
            {showRemoteCursors ? "カーソル表示 ON" : "カーソル表示 OFF"}
          </button>

          <button onClick={handleReset} className="lobby-button reset-button">
            🔄 タイル位置リセット
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
        {/* ゴール地点エリア */}
        <div className="goal-area" style={{ zIndex: 10 }}>
          <h2>GOAL!</h2>
          <p
            style={{ color: "#fde68a", fontSize: "1.2em", margin: "5px 0 0 0" }}
          ></p>
        </div>

        {/* 2. ゲームボード セクション */}
        <div className="game-board-container" style={{ zIndex: 5 }} />

        {/* 3. ピース/駒 セクション */}
        <div className="pieces-layer" style={{ zIndex: 20 }}>
          {playerPiece}
          {pieces}
        </div>

        {/* ★ 4. リモートカーソル描画セクション (showRemoteCursors で条件分岐) */}
        <div className="remote-cursors-layer" style={{ zIndex: 900 }}>
          {showRemoteCursors &&
            Object.entries(remoteCursors).map(([playerId, cursor]) => (
              <RemoteCursorRenderer
                key={playerId}
                playerId={playerId}
                cursor={cursor}
                scale={scale}
                fixedContainer={fixedContainerRef.current}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
