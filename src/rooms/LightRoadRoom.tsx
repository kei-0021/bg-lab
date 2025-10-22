// src/rooms/LightRoadRoom.tsx
import { useState } from "react"; // 💡 useStateをインポート
import { useNavigate, useParams } from "react-router-dom";
import Draggable from "../components/Draggable";
import "./LightRoadRoom.css";

export default function LightRoadRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // 💡 リセット用の状態を追加。この値が変わるとピースが再描画される
  const [resetCount, setResetCount] = useState(0);

  // 💡 リセット処理
  const handleReset = () => {
    setResetCount(prev => prev + 1);
  };

  const totalPieces = 20;
  const pieces = Array.from({ length: totalPieces }).map((_, i) => {
    let color: string;
    let isTransparent = false;

    if (i < 5) color = "yellow";
    else if (i < 10) color = "black";
    else {
      color = "yellow";
      isTransparent = true;
    }

    const column = i % 4; 
    const row = Math.floor(i / 4);
    const spacing = 110; 
    const baseInitialX = 50;  
    const baseInitialY = 200; 
    
    const initialX = baseInitialX + column * spacing;
    const initialY = baseInitialY + row * spacing;

    return (
      <Draggable
        // 💡 keyにresetCountを含めることで、resetCountが更新されたときにDraggableが再マウントされ、初期位置に戻る
        key={`piece-${i}-${resetCount}`} 
        initialX={initialX}
        initialY={initialY}
        color={color}
        isTransparent={isTransparent}
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

  const playerPiece = (
    <Draggable
      // 💡 プレイヤー駒のkeyにもresetCountを含める
      key={`player-${resetCount}`} 
      initialX={window.innerWidth / 2} 
      initialY={window.innerHeight * 0.85} 
      color="white" 
      isTransparent={false}
      size={80} 
      style={{
        borderRadius: "50%", 
        boxShadow: "0 0 10px 4px rgba(255, 255, 255, 0.8), 0 0 20px 8px #1e90ff", 
        border: "2px solid #1e90ff", 
        zIndex: 100, 
        marginLeft: -40,
        marginTop: -40,
      }}
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

  return (
    <div className="light-road-room">
      {/* 1. タイトル/説明 セクション (ヘッダー化) */}
      <div className="title-section">
        {/* h1とpを横並びにするためのグループ化 */}
        <div className="header-info">
          <h1>🌟 Light Road</h1>
          <p>ルームID: {roomId}</p>
          <p>星空の上でタイルを動かしてみよう！ 絵柄が消えたり現れたり...?</p>
        </div>
        
        {/* 💡 アクションボタンのグループ化とリセットボタンの追加 */}
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
      <div className="game-board-container" />
      
      {/* 3. ピース/駒 セクション (絶対配置) */}
      {playerPiece}
      {pieces}
    </div>
  );
}