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

  // --- ルール説明タブ用のステート ---
  const [showRules, setShowRules] = useState<boolean>(false);

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

  // --- 入場前の画面 ---
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

          {isJoining && (
            <p className="fireworks-loading-text">門を潜っています...</p>
          )}
        </div>
      </div>
    );
  }

  // --- ゲーム本編画面 ---
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

      {/* 右上のコントロール群 */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 40,
          zIndex: 10,
          display: "flex",
          gap: "12px",
        }}
      >
        <button
          onClick={() => setShowRules(true)}
          style={{
            background: "#ffc300",
            color: "#000",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 0 10px rgba(255,195,0,0.4)",
          }}
        >
          📖 遊び方
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#000",
            color: "#ffc300",
            border: "1px solid #ffc300",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          ロビーへ
        </button>
      </div>

      {/* ルール説明オーバーレイ */}
      {showRules && (
        <div
          className="rules-overlay"
          onClick={() => setShowRules(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
          }}
        >
          <div
            className="rules-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#1a1a1a",
              border: "2px solid #ffc300",
              padding: "40px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "#fff",
              borderRadius: "12px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowRules(false)}
              style={{
                position: "absolute",
                top: 15,
                right: 20,
                background: "none",
                border: "none",
                color: "#ffc300",
                fontSize: "28px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2 style={{ color: "#ffc300", marginTop: 0, fontSize: "24px" }}>
              🎆 花火大会 遊び方
            </h2>
            <hr style={{ borderColor: "#333", margin: "20px 0" }} />

            <div style={{ lineHeight: "1.8", fontSize: "16px" }}>
              <section>
                <h3 style={{ color: "#ffc300" }}>1. 勝利条件</h3>
                <p>
                  「演目カード」の条件に合わせて「花火カード」を場に並べ、
                  最も高いスコアを獲得した職人が勝者となります。
                </p>
              </section>

              <section style={{ marginTop: "20px" }}>
                <h3 style={{ color: "#ffc300" }}>2. 手番のアクション</h3>
                <p>自分の番では以下のことができます：</p>
                <ul>
                  <li>
                    <strong>ドロー：</strong> 山札（花火カード）を引く。
                  </li>
                  <li>
                    <strong>プレイ：</strong>
                    手札からカードを出し、演目を完成させる。
                  </li>
                  <li>
                    <strong>リセット：</strong>
                    場のカードを戻し、新たな演目を目指す。
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "20px" }}>
                <h3 style={{ color: "#ffc300" }}>3. 秘伝玉（トークン）</h3>
                <p>
                  左下の「秘伝玉」は職人の魂です。
                  特別な演目の達成や、得点のブーストに使用できます。
                </p>
              </section>
            </div>

            <button
              onClick={() => setShowRules(false)}
              style={{
                width: "100%",
                marginTop: "30px",
                padding: "12px",
                background: "#ffc300",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              了解
            </button>
          </div>
        </div>
      )}

      <main
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          padding: "100px 40px 40px 40px",
          boxSizing: "border-box",
          gap: "20px",
        }}
      >
        {/* 左側：山札・演目フィールド */}
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

        {/* 中央：メイン打ち上げフィールド */}
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

        {/* 右側：スコアボード */}
        <div style={{ width: "480px", flexShrink: 0 }}>
          <ScoreBoard
            socket={socket!}
            roomId={roomId}
            players={players}
            currentPlayerId={currentPlayerId}
            myPlayerId={myPlayerId}
          />
        </div>

        {/* トインストア */}
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
