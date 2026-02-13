// src/components/Draggable.tsx
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import styles from "./Draggable.module.css";

interface GridBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cellSize: number;
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
  scale?: number;
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
  scale = 1,
}: DraggableProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [rotation, setRotation] = useState(0);
  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // 1. リモートからの移動を受信し、位置を更新する
  useEffect(() => {
    if (!socket || !pieceId) return;

    const eventName = "draggable:update";
    const handleRemoteMove = (move: {
      pieceId: string;
      x: number;
      y: number;
    }) => {
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

    const fixedContainer = document.querySelector(
      ".light-road-room-fixed-container",
    ) as HTMLElement | null;
    const fixedContainerRect = fixedContainer?.getBoundingClientRect();
    if (!fixedContainerRect) return;

    // マウス座標をコンテナ内の相対座標に変換
    const clientX_relative = (e.clientX - fixedContainerRect.left) / scale;
    const clientY_relative = (e.clientY - fixedContainerRect.top) / scale;

    const offsetX = clientX_relative - pos.x;
    const offsetY = clientY_relative - pos.y;

    let lastTime = 0;
    const targetFPS = 50;
    const interval = 1000 / targetFPS;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTime < interval) return;
      lastTime = now;

      const currentX_relative = (e.clientX - fixedContainerRect.left) / scale;
      const currentY_relative = (e.clientY - fixedContainerRect.top) / scale;

      const newPos = {
        x: currentX_relative - offsetX,
        y: currentY_relative - offsetY,
      };

      setPos(newPos);
      posRef.current = newPos;

      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", { roomId, pieceId, ...newPos });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      const { x, y } = posRef.current;
      if (socket && roomId && pieceId) {
        socket.emit("draggable:moved", { roomId, pieceId, x, y });
      }
      onDragEnd?.(x, y);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDoubleClick = () => setRotation((prev) => prev + 90);

  // 動的に変化するスタイルのみをここに集約
  const dynamicStyle: CSSProperties = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${size}px`,
    height: `${size}px`,
    background: isTransparent ? "transparent" : color,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    ...style,
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={styles.draggable}
      style={dynamicStyle}
    >
      {children}
    </div>
  );
}
