import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./LobbyRoom.css";

// 仮のSocket.IOサーバーURL
const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

// ルーム型定義に gameType を追加
interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
  gameType: "deepabyss" | "lightroad" | "volcano"; // 追加
}

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
      
      // ✅ room.gameType を使って動的なパスを生成する
      navigate(`/${room.name}/${room.id.trim()}`);
  };

  // 新規ルーム作成
  const handleCreateRoom = (gameType: Room["gameType"]) => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    console.log(`新しい${gameType}ルームを作成: ${newRoomId}`);
    navigate(`/${gameType}/${newRoomId}`);
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">🎮 ロビー 🤝</h1>

      {/* --- 新しいルームを作成 --- */}
      <div className="section create-room-section">
        <h2 className="section-title">新しいルームを作成</h2>
        <div className="button-group">
          <button
            onClick={() => handleCreateRoom("deepabyss")}
            className="button primary-button"
            disabled={!socket || !socket.connected}
          >
            🌊 DeepAbyss
          </button>
          <button
            onClick={() => handleCreateRoom("lightroad")}
            className="button primary-button"
            disabled={!socket || !socket.connected}
          >
            🌟 LightRoad
          </button>
          <button
            onClick={() => handleCreateRoom("volcano")}
            className="button primary-button"
            disabled={!socket || !socket.connected}
          >
            🔥 VolcanoRun
          </button>
        </div>
        {!socket?.connected && (
          <p className="status-message loading">サーバー接続中...</p>
        )}
      </div>

      {/* --- 公開ルーム一覧 --- */}
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
                  <p className="room-name">{room.name}</p>
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
                    {new Date(room.createdAt).toLocaleTimeString("ja-JP")} 作成
                  </p>
                  <p className="game-type">ゲーム: {room.gameType}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
