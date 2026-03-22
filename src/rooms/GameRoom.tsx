// src/rooms/GameRoom.tsx
import { useEffect, useState } from "react";
import type { RoomState } from "react-game-ui";
import { DynamicComponent } from "../components/DynamicConponent";
import { useSocket } from "../hooks/useSocket.js";
import type { ComponentInfo, RoomInitPayload } from "../types/game";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

// --- Logic: データを取り寄せる ---
export const useRoomData = () => {
  const socket = useSocket(SERVER_URL);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [componentInfo, setComponentInfo] = useState<ComponentInfo[]>([]);

  useEffect(() => {
    if (!socket) return;

    // サーバーから「世界の設定」が届いた瞬間
    socket.on("room_init_success", (data: RoomInitPayload) => {
      setRoomState(data.state);
      setComponentInfo(data.components);
    });

    // 誰かが動いたり、状態が変わったりした時
    socket.on("room_state_update", (newState: RoomState) => {
      setRoomState(newState);
    });

    return () => {
      socket.off("room_init_success");
      socket.off("room_state_update");
    };
  }, [socket]);

  return { roomState, componentInfo, socket };
};

// --- 届いたデータを形にする ---
export const GameRoom = () => {
  const { roomState, componentInfo } = useRoomData();

  if (!roomState) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <p className="animate-pulse">Loading Game World...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {componentInfo.map((info) => (
        <DynamicComponent key={info.id} type={info.type} props={info.props} />
      ))}
      <div className="absolute top-4 right-4 p-2 bg-black/50 text-xs text-green-400 rounded pointer-events-none">
        Room: {roomState.roomId} | Game: {roomState.gameId}
      </div>
    </div>
  );
};
