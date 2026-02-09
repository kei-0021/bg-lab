import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const [userName, setUserName] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  if (!roomId) return null;

  const handleJoinRoom = useCallback(() => {
    if (!socket || userName.trim() === '' || isJoining) return;
    setIsJoining(true);

    socket.emit("room:join", { 
      roomId, 
      gamePresetId: "fireworks",
      playerName: userName.trim() 
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
    socket.on("players:update", (updatedPlayers: PlayerWithResources[]) => setPlayers(updatedPlayers));
    socket.on("game:turn", (id: string) => setCurrentPlayerId(id));

    return () => {
      socket.off("player:assign-id");
      socket.off("players:update");
      socket.off("game:turn");
    };
  }, [socket]);

  const nightSkyStyle: React.CSSProperties = useMemo(() => ({
    minHeight: "100vh",
    // 文字を黒くするため、背景のセンターを少し明るくして視認性を補助
    background: "radial-gradient(circle at center, #1e3a5f 0%, #000814 100%)",
    fontFamily: "'Shippori Mincho', serif",
    color: "#000", // ★ 全体の基本文字色を黒に
    position: "relative",
    overflow: "hidden"
  }), []);

  if (!hasJoined) {
    return (
      <div style={nightSkyStyle}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <h2 style={{ color: "#000", letterSpacing: "0.5em", textShadow: "0 0 10px rgba(255,195,0,0.5)" }}>伝統花火競技会</h2>
          <input 
            style={{ padding: "10px", background: "rgba(255,255,255,0.2)", border: "none", borderBottom: "2px solid #000", color: "#000", textAlign: "center", outline: "none" }}
            type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="名乗る"
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
          />
          <button onClick={handleJoinRoom} style={{ marginLeft: "20px", background: "#000", color: "#ffc300", border: "none", padding: "10px 20px", cursor: "pointer", fontWeight: "bold" }}>入場</button>
        </div>
      </div>
    );
  }

  return (
    <div style={nightSkyStyle}>
      {/* ヘッダー */}
      <header style={{ position: "absolute", top: 20, left: 40, zIndex: 10 }}>
        <h1 style={{ color: "#000", margin: 0, fontSize: "1.8rem", fontWeight: "bold", textShadow: "0 0 8px rgba(255,195,0,0.8)" }}>🎆 FIREWORKS</h1>
      </header>

      {/* ロビーへ戻る */}
      <button 
        onClick={() => navigate("/")} 
        style={{ 
          position: "absolute", top: 20, right: 40, 
          background: "#000", color: "#ffc300", 
          border: "1px solid #ffc300", padding: "8px 16px",
          cursor: "pointer", zIndex: 10, fontWeight: "bold"
        }}
      >
        ロビーへ
      </button>

      {/* 修正ポイント：position: relative から Flexレイアウトへ変更 */}
      <main style={{ 
        width: "100vw", 
        height: "100vh", 
        display: "flex", 
        padding: "100px 40px 40px 40px", // 上部にヘッダー分の余白
        boxSizing: "border-box",
        gap: "20px"
      }}>
        
        {/* 左側：山札（固定幅） */}
        <div style={{ display: "flex", flexDirection: "column", gap: "60px", flexShrink: 0 }}>
          <Deck socket={socket!} roomId={roomId} deckId="blueprint" name="[ 演目 ]" playerId={currentPlayerId} />
          <Deck socket={socket!} roomId={roomId} deckId="firework" name="[ 花火カード ]" playerId={currentPlayerId} />
        </div>

        {/* 中央：プレイフィールド（flex: 1 で残りの幅をすべて使う） */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 0, backgroundColor:"black" }}>
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
        <div style={{ width: "250px", flexShrink: 0 }}>
          <ScoreBoard socket={socket!} roomId={roomId} players={players} currentPlayerId={currentPlayerId} myPlayerId={myPlayerId} />
        </div>

        {/* トインストア（これだけは左下に浮かせる） */}
        <div style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 5 }}>
          <TokenStore socket={socket!} roomId={roomId} tokenStoreId="STAR_PARTS" name="秘伝玉" />
        </div>

      </main>
    </div>
  );
}