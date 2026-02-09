import { useCallback, useEffect, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
import { Deck, PlayField, ScoreBoard, TokenStore } from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";
import "./FireworksRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

export default function FireworksRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  if (!roomId) return null;

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
    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", (updatedPlayers: PlayerWithResources[]) =>
      setPlayers(updatedPlayers),
    );
    socket.on("game:turn", (id: string) => setCurrentPlayerId(id));

    return () => {
      socket.off("player:assign-id");
      socket.off("players:update");
      socket.off("game:turn");
    };
  }, [socket]);

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
              autoFocus // 自動フォーカス
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

          {isJoining && (
            <p className="fireworks-loading-text">門を潜っています...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fireworks-container">
      {/* ヘッダー */}
      <header style={{ position: "absolute", top: 20, left: 40, zIndex: 10 }}>
        <h1
          style={{
            color: "#ebebeb",
            margin: 0,
            fontSize: "40px",
            fontWeight: "bold",
            textShadow: "0 0 10px rgba(255,195,0,0.8)",
          }}
        >
          🎆 FIREWORKS
        </h1>
      </header>

      {/* ロビーへ戻る */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 20,
          right: 40,
          background: "#000",
          color: "#ffc300",
          border: "1px solid #ffc300",
          padding: "8px 16px",
          cursor: "pointer",
          zIndex: 10,
          fontWeight: "bold",
          fontSize: "15px",
        }}
      >
        ロビーへ
      </button>

      {/* 修正ポイント：position: relative から Flexレイアウトへ変更 */}
      <main
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          padding: "100px 40px 40px 40px", // 上部にヘッダー分の余白
          boxSizing: "border-box",
          gap: "20px",
        }}
      >
        {/* 左側：山札（固定幅） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flexShrink: 0,
          }}
        >
          <Deck
            socket={socket!}
            roomId={roomId}
            deckId="firework"
            name="[ 花火カード ]"
            playerId={currentPlayerId}
          />
          <Deck
            socket={socket!}
            roomId={roomId}
            deckId="theme"
            name="[ 演目カード ]"
            playerId={currentPlayerId}
          />
          {/* 演目カードのPlayField：ここにはスタイルをかけない（そのまま） */}
          <div className="fireworks-theme-field">
            <PlayField
              socket={socket}
              roomId={roomId}
              deckId="theme"
              name="演目カード"
              players={players}
              myPlayerId={myPlayerId}
            />
          </div>
        </div>

        {/* 中央：花火カードのPlayField：ここだけに特定のクラスを当てる */}
        <div
          className="fireworks-main-field"
          style={{ flex: 1, height: "100%" }}
        >
          <PlayField
            socket={socket}
            roomId={roomId}
            deckId="firework"
            name="花火カード"
            players={players}
            myPlayerId={myPlayerId}
          />
        </div>

        {/* 右側：スコアボード（固定幅） */}
        <div style={{ width: "480px", flexShrink: 0 }}>
          <ScoreBoard
            socket={socket!}
            roomId={roomId}
            players={players}
            currentPlayerId={currentPlayerId}
            myPlayerId={myPlayerId}
          />
        </div>

        {/* トインストア（これだけは左下に浮かせる） */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            zIndex: 5,
          }}
        >
          <TokenStore
            socket={socket!}
            roomId={roomId}
            tokenStoreId="STAR_PARTS"
            name="秘伝玉"
          />
        </div>
      </main>
    </div>
  );
}
