import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./LobbyRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

interface Room {
  id: string;
  gameName: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
}

const GAME_DISPLAY_NAMES: Record<string, string> = {
  fireworks: "FireWorks",
  deepabyss: "DeepAbyss",
  amanogawa: "Amanogawa",
};

// アイコン用のマッピング
const GAME_ICONS: Record<string, string> = {
  fireworks: "🎆",
  deepabyss: "🌊",
  amanogawa: "🌟",
};

export default function RoomLobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const lobbySocket = io(SERVER_URL);
    setSocket(lobbySocket);

    lobbySocket.on("connect", () => {
      lobbySocket.emit("lobby:get-rooms");
    });

    lobbySocket.on("lobby:rooms-list", (fetchedRooms: Room[]) => {
      fetchedRooms.sort((a, b) => b.createdAt - a.createdAt);
      setRooms(fetchedRooms);
      setIsLoading(false);
    });

    lobbySocket.on("lobby:room-update", () => {
      lobbySocket.emit("lobby:get-rooms");
    });

    lobbySocket.on("connect_error", (err) => {
      console.error("Lobby connection error:", err);
      setIsLoading(false);
    });

    return () => {
      lobbySocket.disconnect();
    };
  }, []);

  const handleJoinRoom = (room: Room) => {
    if (!room.id.trim()) return;
    navigate(`/${room.gameName}/${room.id.trim()}`);
  };

  const handleCreateRoom = (gameId: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/${gameId}/${newRoomId}`);
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">ボードゲーム・ラボ</h1>

      {/* ルーム作成セクション */}
      <div className="section create-room-section">
        <h2 className="section-title">新しいゲームを始める</h2>
        <div className="button-group">
          {Object.entries(GAME_DISPLAY_NAMES).map(([id, name]) => (
            <button
              key={id}
              onClick={() => handleCreateRoom(id)}
              className="button primary-button"
              disabled={!socket?.connected}
            >
              <span style={{ fontSize: "24px", marginBottom: "8px" }}>
                {GAME_ICONS[id]}
              </span>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 公開ルーム一覧セクション */}
      <div className="section room-list-section">
        <h2 className="section-title">公開ルーム一覧</h2>
        {isLoading ? (
          <p className="status-message">ルームリストを読み込み中...</p>
        ) : rooms.length === 0 ? (
          <p className="status-message">
            現在、公開されているルームはありません。
          </p>
        ) : (
          <ul className="room-list">
            {rooms.map((room) => (
              <li
                key={room.id}
                className={`room-item ${
                  room.playerCount >= room.maxPlayers
                    ? "room-item-full"
                    : "room-item-available"
                }`}
                onClick={() =>
                  room.playerCount < room.maxPlayers && handleJoinRoom(room)
                }
              >
                {/* 左側：背表紙ラベル */}
                <div className="room-game-label">
                  {GAME_ICONS[room.gameName] || "🎲"}{" "}
                  {GAME_DISPLAY_NAMES[room.gameName] || room.gameName}
                </div>

                {/* 右側：メインコンテンツ */}
                <div className="room-info-content">
                  <div className="room-main-details">
                    <span className="room-name">
                      {room.gameName.toUpperCase()} ROOM
                    </span>
                    <span className="room-id">ID: {room.id}</span>
                  </div>

                  <div className="room-meta-details">
                    <span className="player-count">
                      {room.playerCount} / {room.maxPlayers} Players
                    </span>
                    <span className="room-created-at">
                      Created at:{" "}
                      {new Date(room.createdAt).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
