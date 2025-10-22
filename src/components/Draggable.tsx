// src/components/Draggable.tsx
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

interface DraggableProps {
  initialX?: number;
  initialY?: number;
  size?: number;
  color?: string;
  isTransparent?: boolean;
  children?: ReactNode;
  style?: CSSProperties; // OK: style プロパティは定義されている
}

export default function Draggable({
  initialX = 100,
  initialY = 100,
  size = 100,
  color = "yellow",
  isTransparent = false,
  children,
  style = {}, // 💡 1. style プロパティを受け取る (デフォルトは空オブジェクト)
}: DraggableProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [rotation, setRotation] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const offsetX = e.clientX - pos.x;
    const offsetY = e.clientY - pos.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.onmouseup = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.onmouseup = null;
    };
  };

  const handleDoubleClick = () => setRotation((prev) => prev + 90);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: size,
        height: size,
        borderRadius: "8px",
        background: isTransparent ? "transparent" : color,
        cursor: "grab",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        transform: `rotate(${rotation}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        // 💡 2. 渡されたカスタムスタイルをここで展開する
        ...style,
      }}
    >
      {children}
    </div>
  );
}