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

// 表示用のマッピング（これならフロントだけで完結する）
const GAME_DISPLAY_NAMES: Record<string, string> = {
  fireworks: "🎆 FireWorks",
  deepabyss: "🌊 DeepAbyss",
  lightroad: "🌟 LightRoad",
};

export default function RoomLobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  // Socket.IO ロビー接続
  useEffect(() => {
    const lobbySocket = io(SERVER_URL);
    setSocket(lobbySocket);

    lobbySocket.on("connect", () => {
      console.log("Lobby connected. Requesting room list.");
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

  // ルーム参加（ゲームタイプに応じたパスで遷移）
  const handleJoinRoom = (room: Room) => {
    if (!room.id.trim()) return;

    // room.gameType を使って動的なパスを生成する
    navigate(`/${room.gameName}/${room.id.trim()}`);
  };

  // 新規ルーム作成
  const handleCreateRoom = (gameId: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    console.log(`新しい${gameId}ルームを作成: ${newRoomId}`);
    navigate(`/${gameId}/${newRoomId}`);
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">ロビー</h1>

      <div className="section create-room-section">
        <h2 className="section-title">新しいゲームを始める</h2>
        <div
          className="button-group"
          style={{ display: "flex", gap: "15px", justifyContent: "center" }}
        >
          {Object.entries(GAME_DISPLAY_NAMES).map(([id, displayName]) => (
            <button
              key={id}
              onClick={() => handleCreateRoom(id)}
              className="button primary-button"
              disabled={!socket?.connected}
            >
              {displayName}
            </button>
          ))}
        </div>
      </div>

      <div className="section room-list-section">
        <h2 className="section-title list-header">公開ルーム一覧</h2>
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
                <div className="room-info">
                  {/* 💡 room.name から日本語名に変換して表示 */}
                  <p className="room-game-label">
                    {GAME_DISPLAY_NAMES[room.gameName] || `🎲 ${room.gameName}`}
                  </p>
                  <p className="room-id">ID: {room.id}</p>
                </div>
                <div className="room-status">
                  <span
                    className={`player-count ${
                      room.playerCount < room.maxPlayers
                        ? "status-ok"
                        : "status-full"
                    }`}
                  >
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                  <p className="created-at">
                    {new Date(room.createdAt).toLocaleTimeString("ja-JP")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
