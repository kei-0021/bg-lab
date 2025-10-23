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

  // ローカルでのドラッグ処理
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // ★ 修正: fixed-container の画面上の絶対位置を取得
    const fixedContainer = document.querySelector('.light-road-room-fixed-container') as HTMLElement | null;
    const fixedContainerRect = fixedContainer?.getBoundingClientRect();

    if (!fixedContainerRect) return; // コンテナが見つからなければ処理を中断

    // 駒の中心のピクセル座標 (fixed-container内の相対座標)
    const currentX_px = pos.x;
    const currentY_px = pos.y;

    // マウス位置を fixed-container の左上(0,0)基準の固定座標系に変換
    const clientX_relative = (e.clientX - fixedContainerRect.left) / scale;
    const clientY_relative = (e.clientY - fixedContainerRect.top) / scale;
    
    // オフセット計算 (fixed-container 内の固定座標系)
    const offsetX = clientX_relative - currentX_px;
    const offsetY = clientY_relative - currentY_px;

    const handleMouseMove = (e: MouseEvent) => {
      // マウス位置を固定座標系に変換
      const clientX_relative = (e.clientX - fixedContainerRect.left) / scale;
      const clientY_relative = (e.clientY - fixedContainerRect.top) / scale;
      
      // 新しい駒の中心のピクセル座標を直接計算
      const newX_px = clientX_relative - offsetX;
      const newY_px = clientY_relative - offsetY;
      
      const newPos = { x: newX_px, y: newY_px };

      setPos(newPos);
      posRef.current = newPos; 

      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", {
          roomId, pieceId, x: newX_px, y: newY_px,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    
    // ドラッグ終了処理 (スナップロジックは変更なし)
    document.onmouseup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.onmouseup = null;

      const latestPos = posRef.current; 
      let finalX_px = latestPos.x;
      let finalY_px = latestPos.y;
      
      setPos({ x: finalX_px, y: finalY_px });
      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", {
          roomId, pieceId, x: finalX_px, y: finalY_px,
        });
      }
      onDragEnd?.(finalX_px, finalY_px);
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