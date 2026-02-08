// src/components/Draggable.tsx
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

// GridBounds はピクセル座標のみで定義
interface GridBounds {
    left: number; // グリッドの左端 (px)
    top: number;  // グリッドの上端 (px)
    right: number; // グリッドの右端 (px)
    bottom: number; // グリッドの下端 (px)
    cellSize: number; // セルのサイズ (px)
}

interface DraggableProps {
  initialX?: number; 
  initialY?: number;
  size?: number;
  color?: string;
  isTransparent?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  socket?: Socket;        
  roomId?: string;        
  pieceId?: string;       
  onDragEnd?: (x: number, y: number) => void; 
  gridBounds?: GridBounds; 
  scale?: number; // ★ propsに追加
}

export default function Draggable({
  initialX = 500, 
  initialY = 500, 
  size = 100,
  color = "yellow",
  isTransparent = false,
  children,
  style = {},
  socket,
  roomId,
  pieceId,
  onDragEnd,
  gridBounds,
  scale = 1, // ★ propsから受け取る
}: DraggableProps) {
  
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [rotation, setRotation] = useState(0);
  const posRef = useRef(pos); 

  useEffect(() => { posRef.current = pos; }, [pos]);

  // リモートからの移動を受信し、位置を更新するロジック (中略)

  // 1. リモートからの移動を受信し、位置を更新するロジック (同期)
  useEffect(() => {
    if (!socket || !pieceId) return;

    const eventName = 'draggable:update';

    const handleRemoteMove = (move: { pieceId: string, x: number, y: number, socketId: string }) => {
        // x, y はパーセンテージで受信される
        if (move.pieceId === pieceId) {
            setPos({ x: move.x, y: move.y });
        }
    };

    socket.on(eventName, handleRemoteMove);

    return () => {
        socket.off(eventName, handleRemoteMove);
    };
  }, [socket, pieceId]); 

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    // ドラッグ対象の固定コンテナ取得
    const fixedContainer = document.querySelector('.light-road-room-fixed-container') as HTMLElement | null;
    const fixedContainerRect = fixedContainer?.getBoundingClientRect();
    if (!fixedContainerRect) return;

    const currentX_px = pos.x;
    const currentY_px = pos.y;

    // マウス座標を固定コンテナ内の相対座標に変換
    const clientX_relative = (e.clientX - fixedContainerRect.left) / scale;
    const clientY_relative = (e.clientY - fixedContainerRect.top) / scale;

    // ドラッグ開始時のオフセット計算
    const offsetX = clientX_relative - currentX_px;
    const offsetY = clientY_relative - currentY_px;

    // FPS制限用の時間管理
    let lastTime = 0;
    const targetFPS = 50;          // 更新間隔を50fpsに設定
    const interval = 1000 / targetFPS;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();

      // FPS制限: 前回更新から間隔が短ければスキップ
      if (now - lastTime < interval) return;
      lastTime = now;

      // マウス座標を固定コンテナ内の相対座標に変換
      const clientX_relative = (e.clientX - fixedContainerRect.left) / scale;
      const clientY_relative = (e.clientY - fixedContainerRect.top) / scale;

      // 新しい駒の座標計算
      const newX_px = clientX_relative - offsetX;
      const newY_px = clientY_relative - offsetY;

      const newPos = { x: newX_px, y: newY_px };
      setPos(newPos);           // React state更新
      posRef.current = newPos;  // Refに保持してmouseup時にも利用

      // Socket送信（間引きされて負荷軽減）
      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", { roomId, pieceId, x: newX_px, y: newY_px });
      }
    };

    // マウス移動イベント登録
    document.addEventListener("mousemove", handleMouseMove);

    // ドラッグ終了処理
    document.onmouseup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.onmouseup = null;

      const latestPos = posRef.current;
      const finalX_px = latestPos.x;
      const finalY_px = latestPos.y;

      setPos({ x: finalX_px, y: finalY_px }); // 最終座標反映
      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", { roomId, pieceId, x: finalX_px, y: finalY_px });
      }
      onDragEnd?.(finalX_px, finalY_px);      // コールバック呼び出し
    };
  };

  const handleDoubleClick = () => setRotation((prev) => prev + 90);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "absolute",
        left: `${pos.x}px`, 
        top: `${pos.y}px`,  
        width: size,
        height: size,
        borderRadius: "8px",
        background: isTransparent ? "transparent" : color,
        cursor: "grab",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        zIndex: 90, 
        ...style,
      }}
    >
      {children}
    </div>
  );
}