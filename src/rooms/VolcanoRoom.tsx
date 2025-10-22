import { useNavigate, useParams } from "react-router-dom";

export default function VolcanoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #ff6b6b, #2e0b0b)",
        height: "100vh",
        textAlign: "center",
        paddingTop: "20vh",
        color: "#fff0e0",
      }}
    >
      <h1>🔥 Volcano Run</h1>
      <p>ルームID: {roomId}</p>
      <p>マグマから逃げ切れ！</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "2rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#ff3b3b",
          color: "white",
          cursor: "pointer",
        }}
      >
        🏠 ロビーへ戻る
      </button>
    </div>
  );
}
