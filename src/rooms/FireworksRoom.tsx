import { useCallback, useEffect, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
import { Deck, PlayField, ScoreBoard, TokenStore } from "react-game-ui";
import "react-game-ui/dist/react-game-ui.css";
import { useNavigate, useParams } from "react-router-dom";
import { RoundProgressTracker } from "../components/RoundProgressTracker";
import { useSocket } from "../hooks/useSocket.js";
import "./FireworksRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

interface TurnUpdatePayload {
  playerId: string;
  currentRound: number;
  currentTurnIndex: number;
}

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
  const [currentRound, setCurrentRound] = useState<number>(1);
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
    const handlePlayersUpdate = (updatedPlayers: PlayerWithResources[]) =>
      setPlayers(updatedPlayers);
    const handleGameTurn = (data: TurnUpdatePayload | string) => {
      if (typeof data === "string") {
        setCurrentPlayerId(data);
      } else {
        setCurrentPlayerId(data.playerId);
        setCurrentRound(data.currentRound);
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
      <header className="fireworks-header">
        <div className="header-logo">
          <h1 className="logo-text">🎆 FIREWORKS</h1>
        </div>
        <div className="header-tracker">
          <RoundProgressTracker currentRound={currentRound} maxRound={5} />
        </div>

        {/* 右上のコントロール群 */}
        <div className="header-nav">
          <button onClick={() => setShowRules(true)} className="nav-btn-rules">
            📖 遊び方
          </button>
          <button onClick={() => navigate("/")} className="nav-btn-lobby">
            ロビーへ
          </button>
        </div>
      </header>

      {/* ルール説明オーバーレイ */}
      {showRules && (
        <div className="rules-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-content" onClick={(e) => e.stopPropagation()}>
            <button className="rules-close" onClick={() => setShowRules(false)}>
              ×
            </button>
            <h2 className="rules-title">🎆 花火大会 遊び方</h2>
            <hr className="rules-hr" />
            <div className="rules-body">
              <section>
                <h3>1. 勝利条件</h3>
                <p>
                  「演目カード」の条件に合わせて「花火カード」を場に並べ、最も高いスコアを獲得した職人が勝者となります。
                </p>
              </section>
              <section className="section-mt">
                <h3>2. 手番のアクション</h3>
                <p>自分の番では以下のことができます：</p>
                <ul>
                  <li>
                    <strong>ドロー：</strong> 山札（花火カード）を引く。
                  </li>
                  <li>
                    <strong>プレイ：</strong>{" "}
                    手札からカードを出し、演目を完成させる。
                  </li>
                  <li>
                    <strong>リセット：</strong>{" "}
                    場のカードを戻し、新たな演目を目指す。
                  </li>
                </ul>
              </section>
              <section className="section-mt">
                <h3>3. 秘伝玉（トークン）</h3>
                <p>
                  左下の「秘伝玉」は職人の魂です。特別な演目の達成や、得点のブーストに使用できます。
                </p>
              </section>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="rules-ok-btn"
            >
              了解
            </button>
          </div>
        </div>
      )}

      <main className="fireworks-main">
        <div className="sidebar-left">
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
        <div className="fireworks-main-field">
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
        <div className="sidebar-right">
          <ScoreBoard
            socket={socket!}
            roomId={roomId}
            players={players}
            currentPlayerId={currentPlayerId}
            myPlayerId={myPlayerId}
            autoNextTurnOnCardPlay={true}
          />
        </div>

        {/* トインストア */}
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
  );
}
