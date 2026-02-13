// src/components/RemoteCursor.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type RemoteCursor = { x: number; y: number; name: string; color: string };

interface Props {
  socket: Socket | null;
  roomId: string | undefined;
  myPlayerId: string | null;
  players: { name: string; socketId: string }[];
  scale: number;
  fixedContainerRef: React.RefObject<HTMLDivElement>;
  visible: boolean;
}

const getPlayerColor = (index: number): string => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9d423", "#a8dadc"];
  return colors[index % colors.length] || "#999999";
};

export const RemoteCursor = React.memo(
  ({
    socket,
    roomId,
    myPlayerId,
    players,
    scale,
    fixedContainerRef,
    visible,
  }: Props) => {
    const [remoteCursors, setRemoteCursors] = useState<
      Record<string, RemoteCursor>
    >({});
    const playersRef = useRef(players);

    useEffect(() => {
      playersRef.current = players;
    }, [players]);

    // リモートカーソルの受信
    useEffect(() => {
      if (!socket) return;

      const handleUpdate = (data: {
        playerId: string;
        x: number;
        y: number;
      }) => {
        if (data.playerId === myPlayerId) return;

        const idx = playersRef.current.findIndex(
          (p) => p.socketId === data.playerId,
        );
        const player = playersRef.current[idx];

        setRemoteCursors((prev) => ({
          ...prev,
          [data.playerId]: {
            x: data.x,
            y: data.y,
            name: player ? player.name : "[待機中]",
            color: player ? getPlayerColor(idx) : "#999999",
          },
        }));
      };

      socket.on("cursor:update", handleUpdate);
      return () => {
        socket.off("cursor:update", handleUpdate);
      };
    }, [socket, myPlayerId]);

    // 自カーソルの送信
    useEffect(() => {
      if (!socket || !roomId || !myPlayerId || !fixedContainerRef.current)
        return;

      const THROTTLE = 100;
      let lastTime = 0;

      const handleMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastTime < THROTTLE) return;
        lastTime = now;

        const rect = fixedContainerRef.current!.getBoundingClientRect();
        socket.emit("cursor:move", {
          roomId,
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
        });
      };

      window.addEventListener("mousemove", handleMove);
      return () => window.removeEventListener("mousemove", handleMove);
    }, [socket, roomId, myPlayerId, scale, fixedContainerRef]);

    if (!visible) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 900,
        }}
      >
        {Object.entries(remoteCursors).map(([id, cursor]) => (
          <div
            key={id}
            style={{ position: "absolute", left: cursor.x, top: cursor.y }}
          >
            <div
              style={{
                color: cursor.color,
                fontSize: "2em",
                position: "absolute",
                transform: "translate(-100%, -100%)",
              }}
            >
              👆
            </div>
            <div
              style={{
                backgroundColor: cursor.color,
                color: "white",
                padding: "2px 5px",
                borderRadius: "5px",
                whiteSpace: "nowrap",
                position: "absolute",
                transform: "translate(5px, 0px)",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {cursor.name}
            </div>
          </div>
        ))}
      </div>
    );
  },
);
