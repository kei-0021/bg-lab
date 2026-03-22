// src/rooms/LobbyRoom.tsx
import { useEffect, useState } from "react";
import {
  ControlPanel,
  type GameMeta,
  type LobbyList,
  type RoomMeta,
} from "react-game-ui";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./LobbyRoom.css";

const SERVER_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000"
    : "https://bg-lab.onrender.com";

export default function RoomLobby() {
  const [games, setGames] = useState<GameMeta[]>([]);
  const [rooms, setRooms] = useState<RoomMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [isPanelOpen, _setIsPanelOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const lobbySocket = io(SERVER_URL);
    setSocket(lobbySocket);

    lobbySocket.on("connect", () => {
      lobbySocket.emit("lobby:get-rooms");
    });

    // ロビーリスト受信
    lobbySocket.on("lobby:list", (data: LobbyList) => {
      const roomArray = Array.isArray(data) ? data : data.rooms || [];
      roomArray.sort((a, b) => b.createdAt - a.createdAt);
      setRooms(roomArray);

      if (!Array.isArray(data) && data.games) {
        setGames(data.games);
      }

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

  const handleJoinRoom = (room: RoomMeta) => {
    if (!room.id.trim()) return;
    navigate(`/${room.gameId || "unknown"}/${room.id.trim()}`);
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
          {games.map((gameMeta) => (
            <button
              key={gameMeta.gameId}
              onClick={() => handleCreateRoom(gameMeta.gameId)}
              className="button primary-button"
              disabled={!socket?.connected}
            >
              <span style={{ fontSize: "24px", marginBottom: "8px" }}>
                {gameMeta.gameIcon}
              </span>
              {gameMeta.gameId}
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
            {rooms.map((room) => {
              // maxPlayers が存在し、かつ現在の人数が上限に達しているかを判定
              const isFull =
                room.maxPlayers != null && room.playerCount >= room.maxPlayers;

              return (
                <li
                  key={room.id}
                  className={`room-item ${
                    isFull ? "room-item-full" : "room-item-available"
                  }`}
                  onClick={() => !isFull && handleJoinRoom(room)}
                >
                  {/* 左側：背表紙ラベル */}
                  <div className="room-game-label">{room.gameId || ""} </div>

                  {/* 右側：メインコンテンツ */}
                  <div className="room-info-content">
                    <div className="room-main-details">
                      <span className="room-name">
                        {(room.gameId || "UNKNOWN").toUpperCase()} ROOM
                      </span>
                      <span className="room-id">RoomID: {room.id}</span>
                    </div>

                    <div className="room-meta-details">
                      <span className="player-count">
                        {room.playerCount}{" "}
                        {room.maxPlayers != null ? `/ ${room.maxPlayers}` : ""}{" "}
                        Players
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
              );
            })}
          </ul>
        )}
      </div>

      <div className={`control-panel-wrapper ${isPanelOpen ? "open" : ""}`}>
        {socket && (
          <ControlPanel
            socket={socket}
            gameIds={games.map((game) => game.gameId)}
          />
        )}
      </div>
    </div>
  );
}
