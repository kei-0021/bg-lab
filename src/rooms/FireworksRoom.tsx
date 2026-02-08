import { useNavigate, useParams } from "react-router-dom";

export default function FireworksRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div
      style={{
        // 夜空をイメージした深い紺色と黒のグラデーション
        background: "linear-gradient(to bottom, #000814 0%, #001d3d 100%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{
        fontSize: "3rem",
        margin: "0 0 1rem 0",
        color: "#ffc300", // 花火の火花をイメージしたゴールド
        textShadow: "0 0 20px #ffc300",
      }}>
        🎆 FIREWORKS
      </h1>

      <div style={{
        padding: "1rem 2rem",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: "4px",
        border: "1px solid #003566",
        marginBottom: "2rem",
      }}>
        <p style={{ margin: 0, fontSize: "1.2rem" }}>
          ROOM ID: <span style={{ color: "#ffd60a" }}>{roomId}</span>
        </p>
      </div>

      <p style={{ fontSize: "1rem", color: "#669bbc" }}>
        静かな夜空に大輪を。
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "3rem",
          padding: "0.8rem 2rem",
          borderRadius: "4px",
          border: "1px solid #d00000",
          backgroundColor: "#d00000",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        🏠 ロビーへ戻る
      </button>
    </div>
  );
}