import "react-game-ui/dist/react-game-ui.css";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Player, PlayerWithResources } from "react-game-ui";
import { Deck, PlayField, ScoreBoard, TokenStore } from "react-game-ui";
import { useNavigate, useParams } from "react-router-dom";
import DebugControlPanel from "../components/DebugControlPanel.js";
import MyBoard from "../components/MyBoard.js";
import { useSocket } from "../hooks/useSocket.js";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://full-moon-night.onrender.com"; // ← Render URL

const RESOURCE_IDS = {
  OXYGEN: "OXYGEN",
  BATTERY: "BATTERY",
  HULL: "HULL", // 船体耐久度
};

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(SERVER_URL);
  const navigate = useNavigate();

  // ★ 追加: プレイヤー名入力と参加状態
  const [userName, setUserName] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // --- デバッグ用 ---
  const [debugTargetId, setDebugTargetId] = useState<string | null>(null);
  const [debugScoreAmount, setDebugScoreAmount] = useState<number>(10);
  const [debugResourceAmount, setDebugResourceAmount] = useState<number>(1);
  // ------------------

  // ★ 新しい参加ハンドラ
  const handleJoinRoom = useCallback(() => {
    if (!socket || !roomId || userName.trim() === '' || isJoining) return;

    setIsJoining(true);

    // サーバーの `room:join` イベントのペイロードをオブジェクトに変更
    socket.emit("room:join", { roomId, playerName: userName.trim() });
    console.log(`[CLIENT] Attempting to join room: ${roomId} as ${userName.trim()}`);
  }, [socket, roomId, userName, isJoining]);

  // ★ useEffectのロジックを変更
  useEffect(() => {
    if (!socket || !roomId) return; // hasJoinedがtrueになってからリスナーを設定

    const handleAssignId = (id: Player["id"]) => {
      console.log("[CLIENT] Assigned player ID:", id);
      setMyPlayerId(id);
      setDebugTargetId(id);
      setHasJoined(true); // サーバーからIDを受け取った時点で「参加完了」とする
      setIsJoining(false); // 参加処理完了
    };

    const handlePlayersUpdate = (updatedPlayers: PlayerWithResources[]) => {
      console.log("[CLIENT] players:update", updatedPlayers);
      setPlayers(updatedPlayers);
    };

    const handleGameTurn = (id: string) => {
      console.log("[CLIENT] game:turn:", id);
      setCurrentPlayerId(id);
    };
    
    // イベントリスナーの設定
    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:turn", handleGameTurn);

    return () => {
      // 離脱処理（ここはユーザーが手動でページ遷移した場合に実行される）
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:turn", handleGameTurn);
      // socket.emit("room:leave", roomId); // 現在、サーバー側でdisconnect時に処理しているため不要だが、明示的に追加しても良い
    };
  }, [socket, roomId]);


  // --- デバッグ用操作 (変更なし) ---
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
      console.log("ここを通った")
      socket.emit("room:player:update-resource", {
          roomId,
          playerId: debugTargetId,
          resourceId,
          amount,
      });
  };

  // --- UIスタイル (変更なし) ---
  const fullScreenBackgroundStyle: React.CSSProperties = useMemo(() => ({
    minHeight: "100vh",
    backgroundColor: "#0a192f",
    backgroundImage: `
      linear-gradient(135deg, #0a192f 0%, #1e3a5f 70%, #0a192f 100%),
      linear-gradient(to right, rgba(139, 233, 253, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(139, 233, 253, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: `
      auto,
      30px 30px,
      30px 30px
    `,
    backgroundPosition: "center",
    padding: "20px",
    fontFamily: "Roboto, sans-serif",
    color: "black" // 色を white に修正して背景に合うように
  }), []);


  const titleStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#8be9fd",
    textShadow: "0 0 10px rgba(139, 233, 253, 0.5)",
    marginBottom: "10px",
  };

  const subtitleStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#ffffffff",
    fontSize: "1em",
    marginBottom: "20px",
  };

  const boardWrapperStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  };

  const debugPanelStyle: React.CSSProperties = {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px dashed rgba(139, 233, 253, 0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "4px",
    padding: "4px",
    width: "50px",
    textAlign: "center",
    marginRight: "10px",
  };
  
  // ★ ルーム参加フォームのスタイル
  const joinFormStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1e3a5f',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 0 20px rgba(139, 233, 253, 0.5)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    textAlign: 'center',
  };

  const joinInputStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #8be9fd',
    backgroundColor: '#0a192f',
    color: 'white',
    fontSize: '1em',
  };

  const joinButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#8be9fd',
    color: '#0a192f',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s',
  };

  // --- 接続前の状態 ---
  if (!roomId)
    return (
      <div style={fullScreenBackgroundStyle}>
        <h1 style={titleStyle}>Game Room Status</h1>
        <p>⚠️ ルームIDがURLから取得できませんでした。</p>
      </div>
    );

  if (!socket)
    return (
      <div style={fullScreenBackgroundStyle}>
        <h1 style={titleStyle}>Game Room Status: {roomId}</h1>
        <p>サーバーに接続中... (URL: {SERVER_URL})</p>
      </div>
    );

  // --- ルーム参加フォームの表示 ---
  if (!hasJoined) {
    return (
      <div style={fullScreenBackgroundStyle}>
        <div style={joinFormStyle}>
          <h2 style={{ color: '#8be9fd', marginBottom: '5px' }}>ルーム参加</h2>
          <p style={{ margin: '0 0 10px 0', color: 'white' }}>Room ID: {roomId}</p>
          
          <input
            style={joinInputStyle}
            type="text"
            placeholder="あなたの名前を入力してください"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isJoining}
            maxLength={12}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
          />

          <button
            style={joinButtonStyle}
            onClick={handleJoinRoom}
            disabled={userName.trim() === '' || isJoining}
          >
            {isJoining ? '参加中...' : 'ルームに参加'}
          </button>
          {isJoining && <p style={{ margin: '5px 0 0 0', color: '#ffeb3b' }}>サーバーからの応答を待っています...</p>}
        </div>
      </div>
    );
  }


  // --- ゲームUI本体 ---
  return (
    <div style={fullScreenBackgroundStyle}>
      {/* ★ 固定ヘッダー追加 */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          backgroundColor: "rgba(10, 25, 47, 0.95)",
          borderBottom: "1px solid rgba(139, 233, 253, 0.3)",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1000,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap:40 }}>
          <h1 style={{ ...titleStyle, margin: 0 }}>
            ディープ・アビス (Deep Abyss)
          </h1>
          <p style={subtitleStyle}>深海を調査して眠れる資源を見つけ出せ！</p>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            backgroundColor: "#8be9fd",
            color: "#0a192f",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🏠 ロビーへ戻る
        </button>
      </header>

      {/* ヘッダー高さ分の余白を確保 */}
      <div style={{ height: "80px" }} />


      <div style={boardWrapperStyle}>
        <MyBoard socket={socket} roomId={roomId} myPlayerId={myPlayerId} />
      </div>

      <TokenStore socket={socket} roomId={roomId} tokenStoreId="ARTIFACT" name="遺物" />

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
        debugPanelStyle={debugPanelStyle}
        inputStyle={inputStyle}
      />

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* デッキ + フィールド */}
        <div style={{ display: "flex", gap: "20px" }}>
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
              name="アクションカード"
              playerId={currentPlayerId}
            />
            <Deck
              socket={socket}
              roomId={roomId}
              deckId="deepSeaSpecies"
              name="深海生物カード"
              playerId={currentPlayerId}
            />
          </div>

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
              name="アクションカード"
              players={players}
              myPlayerId={myPlayerId}
            />
            <PlayField
              socket={socket}
              roomId={roomId}
              deckId="deepSeaSpecies"
              name="深海生物カード"
              players={players}
              myPlayerId={myPlayerId}
            />
          </div>
        </div>

        {/* スコアボード */}
        <div
          style={{
            flex: "1 1 auto",
            minWidth: "250px",
            backgroundColor: "transparent",
          }}
        >
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