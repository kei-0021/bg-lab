import { useNavigate, useParams } from "react-router-dom";

export default function SkyRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #aee1f9, #ffffff)",
        height: "100vh",
        textAlign: "center",
        paddingTop: "20vh",
        color: "#004477",
      }}
    >
      <h1>☁️ Sky Battle Room</h1>
      <p>ルームID: {roomId}</p>
      <p>青空の上でバトルを開始します！</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "2rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#1e90ff",
          color: "white",
          cursor: "pointer",
        }}
      >
        🏠 ロビーへ戻る
      </button>
    </div>
  );
}
