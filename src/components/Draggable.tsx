// src/components/Draggable.tsx
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

interface DraggableProps {
  // initialX/Y は 0.0 から 1.0 のパーセンテージで渡されることを想定
  initialX?: number; 
  initialY?: number;
  size?: number; // size はピクセル値として扱う
  color?: string;
  isTransparent?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  socket?: Socket;        
  roomId?: string;        
  pieceId?: string;       
  onDragEnd?: (x: number, y: number) => void; 
  // ★ 親オフセットは不要になるため削除
  // ★ 代わりに、現在のビューポートサイズを渡す（リサイズ対応のため）
  viewPortW?: number;
  viewPortH?: number;
}

export default function Draggable({
  initialX = 0.5, // 50%
  initialY = 0.5, // 50%
  size = 100,
  color = "yellow",
  isTransparent = false,
  children,
  style = {},
  socket,
  roomId,
  pieceId,
  onDragEnd,
  viewPortW = window.innerWidth, // デフォルト値は現在のウィンドウサイズ
  viewPortH = window.innerHeight,
}: DraggableProps) {
  // 駒の位置 State をパーセンテージ (0.0 〜 1.0) で管理
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [rotation, setRotation] = useState(0);

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

  // 2. ローカルでのドラッグ処理
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // 現在の駒の位置 (ピクセル)
    const currentX_px = pos.x * viewPortW;
    const currentY_px = pos.y * viewPortH;

    // マウスの絶対位置 (ピクセル) と駒の左上隅の差 (オフセット)
    const offsetX = e.clientX - currentX_px;
    const offsetY = e.clientY - currentY_px;

    const handleMouseMove = (e: MouseEvent) => {
      // 新しいピクセル位置 = マウス絶対位置 - オフセット
      const newX_px = e.clientX - offsetX;
      const newY_px = e.clientY - offsetY;
      
      // ★ 修正: ピクセル値をパーセンテージ (0.0〜1.0) に変換
      const newX_perc = newX_px / viewPortW;
      const newY_perc = newY_px / viewPortH;
      
      setPos({ x: newX_perc, y: newY_perc });

      // 駒移動をサーバーに通知 (パーセンテージで送信)
      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", {
          roomId,
          pieceId,
          x: newX_perc, // ★ パーセンテージを送信
          y: newY_perc, // ★ パーセンテージを送信
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.onmouseup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.onmouseup = null;
      // onDragEnd にはパーセンテージを渡す
      onDragEnd?.(pos.x, pos.y);
    };
  };

  const handleDoubleClick = () => setRotation((prev) => prev + 90);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "absolute",
        // ★ 修正: パーセンテージをビューポート単位 (vw/vh) に変換して適用
        left: `${pos.x * 100}vw`, 
        top: `${pos.y * 100}vh`,  
        width: size,
        height: size,
        borderRadius: "8px",
        background: isTransparent ? "transparent" : color,
        cursor: "grab",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`, // ★ 駒の中心が pos.x/y に来るように調整
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