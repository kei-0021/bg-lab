// src/rooms/GameRoom.tsx
import { useEffect, useState } from "react";
import type { RoomState } from "react-game-ui";
import { useParams } from "react-router-dom";
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
  const { roomState, componentInfo, socket } = useRoomData();
  const { gameId, roomId } = useParams<{ gameId: string; roomId: string }>();
  const [userName, setUserName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // 参加ボタンのハンドラ
  const handleJoinRoom = () => {
    if (!socket || !roomId || !userName.trim() || isJoining) return;
    setIsJoining(true);

    // どのゲームでも、この共通形式でサーバーに投げる
    socket.emit("room:join", {
      roomId,
      gameId,
      playerName: userName.trim(),
    });
  };

  // まだ参加していない（サーバーから state が届いていない）場合はフォームを出す
  if (!roomState) {
    return (
      <div className="join-container full-screen-background">
        <div className="join-form">
          <h2>ルーム参加</h2>
          <input
            className="join-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="名前を入力"
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            autoFocus
          />
          <button
            className="join-button"
            onClick={handleJoinRoom}
            disabled={isJoining}
          >
            {isJoining ? "参加中..." : "入室する"}
          </button>
        </div>
      </div>
    );
  }

  // 参加後
  return (
    <div className="game-room-root">
      {componentInfo.map((info) => (
        <DynamicComponent key={info.id} type={info.type} props={info.props} />
      ))}
      <div className="absolute top-4 right-4 p-2 bg-black/50 text-xs text-green-400 rounded pointer-events-none">
        Room: {roomState.roomId} | Game: {roomState.gameId}
      </div>
    </div>
  );
};
