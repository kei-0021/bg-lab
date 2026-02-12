import "react-game-ui/dist/react-game-ui.css";

import { useCallback, useEffect, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
import { Deck, PlayField, ScoreBoard, TokenStore } from "react-game-ui";
import { useNavigate, useParams } from "react-router-dom";
import DebugControlPanel from "../components/DebugControlPanel.js";
import MyBoard from "../components/MyBoard.js";
import { useSocket } from "../hooks/useSocket.js";
import "./DeepAbyssRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

const RESOURCE_IDS = {
  OXYGEN: "OXYGEN",
  BATTERY: "BATTERY",
  HULL: "HULL",
};

// サーバーから送られてくるターン情報の型定義
interface TurnUpdatePayload {
  playerId: string;
  currentRound: number;
  currentTurnIndex: number;
}

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // ラウンドの状態を追加
  const [currentRound, setCurrentRound] = useState<number>(1);

  const [debugTargetId, setDebugTargetId] = useState<string | null>(null);
  const [debugScoreAmount, setDebugScoreAmount] = useState<number>(10);
  const [debugResourceAmount, setDebugResourceAmount] = useState<number>(1);

  const handleJoinRoom = useCallback(() => {
    if (!socket || !roomId || userName.trim() === "" || isJoining) return;

    setIsJoining(true);

    socket.emit("room:join", {
      roomId,
      gamePresetId: "deepabyss",
      playerName: userName.trim(),
    });
    console.log(
      `[CLIENT] Attempting to join room: ${roomId} as ${userName.trim()}`,
    );
  }, [socket, roomId, userName, isJoining]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleAssignId = (id: Player["id"]) => {
      console.log("[CLIENT] Assigned player ID:", id);
      setMyPlayerId(id);
      setDebugTargetId(id);
      setHasJoined(true);
      setIsJoining(false);
    };

    const handlePlayersUpdate = (updatedPlayers: PlayerWithResources[]) => {
      console.log("[CLIENT] players:update", updatedPlayers);
      setPlayers(updatedPlayers);
    };

    // オブジェクト形式と文字列形式の両方に対応
    const handleGameTurn = (data: TurnUpdatePayload | string) => {
      console.log("[CLIENT] game:turn received:", data);

      if (typeof data === "string") {
        setCurrentPlayerId(data);
      } else {
        setCurrentPlayerId(data.playerId);
        setCurrentRound(data.currentRound);
        console.log(`[CLIENT] Round Updated to: ${data.currentRound}`);
      }
    };

    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:turn", handleGameTurn);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:turn", handleGameTurn);
    };
  }, [socket, roomId]);

  // デバッグ用操作
  const handleDebugScore = (amount: number) => {
    if (!socket || !debugTargetId || !roomId) return;
    socket.emit("room:player:add-score", {
      roomId,
      targetPlayerId: debugTargetId,
      points: amount,
    });
  };

  const handleDebugResource = (resourceId: string, amount: number) => {
    if (!socket || !debugTargetId || !roomId) return;
    console.log("ここを通った");
    socket.emit("room:player:update-resource", {
      roomId,
      playerId: debugTargetId,
      resourceId,
      amount,
    });
  };

  if (!roomId)
    return (
      <div className="deepsea-container">
        <h1 className="deepsea-title">Game Room Status</h1>
        <div className="status-message">
          <p>⚠️ ルームIDがURLから取得できませんでした。</p>
        </div>
      </div>
    );

  if (!socket)
    return (
      <div className="deepsea-container">
        <h1 className="deepsea-title">Game Room Status: {roomId}</h1>
        <div className="status-message">
          <p>サーバーに接続中...</p>
        </div>
      </div>
    );

  // --- ルーム参加フォームの表示 ---
  if (!hasJoined) {
    return (
      <div className="deepsea-container">
        <div className="join-form-wrapper">
          <h2 className="deepsea-title">ルーム参加</h2>
          <p style={{ margin: "0 0 10px 0", color: "white" }}>
            Room ID: {roomId}
          </p>

          <input
            className="join-form-input"
            type="text"
            placeholder="あなたの名前を入力してください"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isJoining}
            maxLength={12}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />

          <button
            className="join-form-button"
            onClick={handleJoinRoom}
            disabled={userName.trim() === "" || isJoining}
          >
            {isJoining ? "参加中..." : "ルームに参加"}
          </button>

          {isJoining && (
            <p className="waiting-text">サーバーからの応答を待っています...</p>
          )}
        </div>
      </div>
    );
  }

  // --- ゲームUI本体 ---
  return (
    <div className="deepsea-container">
      <header className="deepsea-header">
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <div>
            <h1 className="deepsea-title">ディープ・アビス</h1>
            <p className="deepsea-subtitle">
              深海を調査して眠れる資源を見つけ出せ！
            </p>
          </div>
          {/* ラウンド表示 */}
          <div
            className="round-badge"
            style={{
              background: "rgba(0, 212, 255, 0.2)",
              border: "1px solid #00d4ff",
              color: "#00d4ff",
              padding: "5px 15px",
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            ROUND: {currentRound}
          </div>
        </div>
        <button className="join-button" onClick={() => navigate("/")}>
          🏠 ロビーへ戻る
        </button>
      </header>

      <div style={{ height: "80px" }} />

      <div className="board-wrapper">
        <MyBoard socket={socket} roomId={roomId} myPlayerId={myPlayerId} />
      </div>

      <TokenStore
        socket={socket}
        roomId={roomId}
        tokenStoreId="ARTIFACT"
        name="遺物"
      />

      <DebugControlPanel
        players={players}
        myPlayerId={myPlayerId}
        debugTargetId={debugTargetId}
        setDebugTargetId={setDebugTargetId}
        debugScoreAmount={debugScoreAmount}
        setDebugScoreAmount={setDebugScoreAmount}
        handleDebugScore={handleDebugScore}
        debugResourceAmount={debugResourceAmount}
        setDebugResourceAmount={setDebugResourceAmount}
        handleDebugResource={handleDebugResource}
        RESOURCE_IDS={RESOURCE_IDS}
        debugPanelClassName="debug-control-panel"
        debugInputClassName="debug-input"
      />

      <div className="game-main-layout">
        {/* デッキカラム */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: "0 0 220px",
          }}
        >
          <Deck
            socket={socket}
            roomId={roomId}
            deckId="deepSeaAction"
            name="アクション"
            playerId={currentPlayerId}
          />
          <Deck
            socket={socket}
            roomId={roomId}
            deckId="deepSeaSpecies"
            name="深海生物"
            playerId={currentPlayerId}
          />
        </div>

        {/* フィールドカラム */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: "0 0 320px",
          }}
        >
          <PlayField
            socket={socket}
            roomId={roomId}
            deckId="deepSeaAction"
            name="アクション"
            players={players}
            myPlayerId={myPlayerId}
          />
          <PlayField
            socket={socket}
            roomId={roomId}
            deckId="deepSeaSpecies"
            name="深海生物"
            players={players}
            myPlayerId={myPlayerId}
          />
        </div>

        {/* スコアボード（右端） */}
        <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
          <ScoreBoard
            socket={socket}
            roomId={roomId}
            players={players}
            currentPlayerId={currentPlayerId}
            myPlayerId={myPlayerId}
          />
        </div>
      </div>
    </div>
  );
}
