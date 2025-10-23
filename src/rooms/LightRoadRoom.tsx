// src/rooms/LightRoadRoom.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Draggable from "../components/Draggable";
import { useSocket } from "../hooks/useSocket";
import "./LightRoadRoom.css";

// 💡 サーバーURLを定義
const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://full-moon-night.onrender.com";

// 💡 プレイヤー型を定義 (必要最低限)
type PlayerWithResources = { 
  id: string; 
  name: string;
  // 他のフィールド... 
};

export default function LightRoadRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation(); 
  const socket = useSocket(SERVER_URL); 
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const roomNameFromURL = queryParams.get('roomName') || 'Light Road Room';

  // ★ 必須: プレイヤー名入力と参加状態の管理
  const [userName, setUserName] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  
  // 💡 駒の初期位置リセット用カウンターを追加
  const [resetCount, setResetCount] = useState(0);

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithResources[]>([]);

  // ★ 追加: 現在のビューポートサイズを管理する State
  const [viewPortSize, setViewPortSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  // ★ 必須: ルーム参加ハンドラ
  const handleJoinRoom = useCallback(() => {
    if (!socket || !roomId || userName.trim() === '' || isJoining) return;

    setIsJoining(true);
    socket.emit("room:join", { 
        roomId, 
        roomName: "lightroad", 
        playerName: userName.trim() 
    });
  }, [socket, roomId, userName, isJoining, roomNameFromURL]);

  // ★ 必須: サーバーからの応答リスナー
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

    const handleDraggableUpdate = (move: any) => { /* ロジックはDraggable内に移動 */ };
    
    socket.on("player:assign-id", handleAssignId);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("draggable:update", handleDraggableUpdate);

    return () => {
      socket.off("player:assign-id", handleAssignId);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("draggable:update", handleDraggableUpdate);
    };
  }, [socket, roomId]);

  // ★ 追加: ウィンドウリサイズハンドラ
  useEffect(() => {
    const handleResize = () => {
      setViewPortSize({ w: window.innerWidth, h: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // マウント時に一度だけ設定

  // 💡 駒リセット処理
  const handleReset = () => {
    setResetCount(prev => prev + 1);
  };

  // 💡 駒のレンダリングロジックをuseMemoで分離
  const { pieces, playerPiece } = useMemo(() => {
    const totalPieces = 20;
    
    // ★ 修正: 初期配置をパーセンテージで定義
    const baseInitialX_perc = 0.15; // 15% (駒の中心のX座標)
    const baseInitialY_perc = 0.25; // 25% (駒の中心のY座標)
    const spacing_perc_x = 0.08; // X軸のスペーシング (8%)
    const spacing_perc_y = 0.09; // Y軸のスペーシング (9%)

    // タイルピース
    const tilePieces = Array.from({ length: totalPieces }).map((_, i) => {
      let color: string;
      let isTransparent = false;
      
      if (i < 5) color = "yellow";
      else if (i < 10) color = "black";
      else { color = "yellow"; isTransparent = true; }

      const column = i % 4; 
      const row = Math.floor(i / 4);
      
      // ★ 初期位置をパーセンテージで計算
      const initialX = baseInitialX_perc + column * spacing_perc_x;
      const initialY = baseInitialY_perc + row * spacing_perc_y;

      return (
        <Draggable
          key={`piece-${i}-${resetCount}`} 
          pieceId={`piece-${i}`} 
          socket={socket}
          roomId={roomId}
          // ★ パーセンテージ座標を渡す
          initialX={initialX}
          initialY={initialY}
          color={color}
          isTransparent={isTransparent}
          // ★ ビューポートサイズを渡す
          viewPortW={viewPortSize.w}
          viewPortH={viewPortSize.h}
        >
          {isTransparent && (
            <>
              {/* 左上マーク */}
              <div
                style={{
                  position: "absolute", left: 4, top: 4, width: 12, height: 12,
                  borderRadius: "50%", background: "white", border: "1px solid black",
                }}
              />
              {/* 中央文字「止」 */}
              <div
                style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)", fontSize: 24, fontWeight: "bold",
                  color: "yellow", pointerEvents: "none",
                }}
              >
                止
              </div>
            </>
          )}
        </Draggable>
      );
    });

    // プレイヤー駒 (スタイルをクリーンアップ)
    const singlePlayerPiece = (
      <Draggable
        key={`player-${resetCount}`} 
        pieceId={`player-${myPlayerId}`} 
        socket={socket}
        roomId={roomId}
        // ★ 修正: 画面中央下のパーセンテージ座標を渡す
        initialX={0.5} 
        initialY={0.85} 
        color="white" 
        isTransparent={false}
        size={80} 
        style={{
          backgroundColor: myPlayerId ? "#fde68a" : "#ccc", 
          color: "#111827",
          border: "5px solid white",
          borderRadius: "50%",
          boxShadow: "0 0 10px 4px rgba(255, 255, 255, 0.8), 0 0 20px 8px #1e90ff", 
          zIndex: 100, 
        }}
        // ★ ビューポートサイズを渡す
        viewPortW={viewPortSize.w}
        viewPortH={viewPortSize.h}
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

    return { pieces: tilePieces, playerPiece: singlePlayerPiece };
  }, [resetCount, socket, roomId, myPlayerId, players, viewPortSize]); 


  // --- 参加フォームのスタイル ---
  const joinFormStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#374151',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 0 20px rgba(253, 230, 138, 0.5)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    textAlign: 'center',
  };

  const joinInputStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #fde68a',
    backgroundColor: '#111827',
    color: 'white',
    fontSize: '1em',
  };

  const joinButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#fde68a',
    color: '#111827',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.3s',
  };
  // ------------------------------------------

  // --- UI表示ロジック ---

  if (!roomId || !socket)
    return (
      <div className="light-road-room">
        <h1>🌟 Light Road</h1>
        <p>⚠️ ルーム情報エラー / サーバー接続中...</p>
      </div>
    );
    
  // ★ 必須: ルーム参加フォームの表示
  if (!hasJoined) {
    return (
      <div className="light-road-room full-screen-background">
        <div style={joinFormStyle}>
          <h2 style={{ color: '#fde68a', marginBottom: '5px' }}>Light Road ルーム参加</h2>
          <p style={{ margin: '0 0 10px 0', color: 'white' }}>ルーム名: **{decodeURIComponent(roomNameFromURL)}**</p>
          
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
          {isJoining && <p style={{ margin: '5px 0 0 0 0', color: '#ffeb3b' }}>サーバーからの応答を待っています...</p>}
        </div>
      </div>
    );
  }

  // --- ゲームUI本体 (ヘッダー構造を復元) ---
  return (
    <div className="light-road-room">
      {/* 1. タイトル/説明 セクション (ヘッダー化) */}
      <div className="title-section">
        <div className="header-info">
          <h1>🌟 Light Road</h1>
          <p>ルームID: {roomId} (My ID: {myPlayerId})</p>
          <p>プレイヤー: {players.map(p => p.name).join(', ')}</p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleReset}
            className="lobby-button reset-button"
          >
            🔄 タイル位置リセット
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="lobby-button"
          >
            🏠 ロビーへ戻る
          </button>
        </div>
      </div>

      {/* 2. ゲームボード セクション (画面中央) */}
      {/* CSSで位置を固定しているため、ここでは空のコンテナのみ */}
      <div className="game-board-container" />
      
      {/* 3. ピース/駒 セクション (絶対配置) */}
      {/* Draggable が vw/vh で絶対位置を持つため、特別なラッパーは不要 */}
      <div className="pieces-layer">
        {playerPiece}
        {pieces}
      </div>

    </div>
  );
}