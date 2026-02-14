import React, { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

type RemoteCursorCoords = { x: number; y: number };

interface Props {
  socket: Socket | null;
  roomId: string | undefined;
  myPlayerId: string | null;
  players: { name: string; socketId: string; color?: string }[];
  scale: number;
  fixedContainerRef: React.RefObject<HTMLDivElement>;
  visible: boolean;
}

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
      Record<string, RemoteCursorCoords>
    >({});

    useEffect(() => {
      if (!socket) return;

      const handleUpdate = (data: {
        playerId: string;
        x: number;
        y: number;
      }) => {
        if (data.playerId === socket.id || data.playerId === myPlayerId) return;

        setRemoteCursors((prev) => ({
          ...prev,
          [data.playerId]: { x: data.x, y: data.y },
        }));
      };

      socket.on("cursor:update", handleUpdate);
      return () => {
        socket.off("cursor:update", handleUpdate);
      };
    }, [socket, myPlayerId]);

    useEffect(() => {
      if (!socket || !roomId || !myPlayerId || !fixedContainerRef.current)
        return;

      const THROTTLE = 50;
      let lastTime = 0;

      const handleMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastTime < THROTTLE) return;
        lastTime = now;

        const rect = fixedContainerRef.current!.getBoundingClientRect();

        socket.emit("cursor:move", {
          roomId,
          playerId: myPlayerId,
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
        {Object.entries(remoteCursors).map(([id, coords]) => {
          let playerIdx = players.findIndex(
            (p) => String(p.socketId) === String(id),
          );

          if (playerIdx === -1 && players.length > 0) {
            const otherIdx = players.findIndex(
              (p) => p.socketId !== myPlayerId,
            );
            if (otherIdx !== -1) playerIdx = otherIdx;
          }

          const player = players[playerIdx];
          const name = player ? player.name : "接続中...";
          const color = player?.color || "#000000";

          return (
            <div
              key={id}
              style={{
                position: "absolute",
                left: coords.x,
                top: coords.y,
                transition: "left 0.1s ease-out, top 0.1s ease-out",
              }}
            >
              <div
                style={{
                  color: color,
                  fontSize: "2em",
                  position: "absolute",
                  transform: "translate(-20%, -20%)",
                  zIndex: 1000,
                }}
              >
                👆
              </div>
              <div
                style={{
                  backgroundColor: color,
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  whiteSpace: "nowrap",
                  position: "absolute",
                  transform: "translate(15px, 15px)",
                  fontWeight: "bold",
                  fontSize: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
