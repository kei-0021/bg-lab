import React from "react";

interface RoundProgressTrackerProps {
  currentRound: number;
  maxRound?: number;
}

export const RoundProgressTracker: React.FC<RoundProgressTrackerProps> = ({
  currentRound,
  maxRound = 5,
}) => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "500px",
        padding: "12px 25px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "40px",
        border: "1px solid rgba(255, 195, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          color: "#ffc300",
          fontSize: "11px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          letterSpacing: "1px",
        }}
      >
        ROUND TRACK
      </div>

      <div
        style={{
          flex: 1,
          height: "4px",
          background: "#222",
          borderRadius: "2px",
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* 進捗ゲージ */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${((currentRound - 1) / (maxRound - 1)) * 100}%`,
            background: "linear-gradient(90deg, #ff5733, #ffc300)",
            borderRadius: "2px",
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 15px #ffc300",
          }}
        />

        {/* 各ラウンドのポイント */}
        {[...Array(maxRound)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: i + 1 <= currentRound ? "#ffc300" : "#444",
              marginTop: "-3px",
              zIndex: 2,
              position: "relative",
              transition: "background 0.5s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10px",
                fontWeight: i + 1 === currentRound ? "bold" : "normal",
                color: i + 1 <= currentRound ? "#ffc300" : "#666",
              }}
            >
              R{i + 1}
            </span>

            {i + 1 === currentRound && (
              <div
                style={{
                  position: "absolute",
                  top: "-28px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "20px",
                  animation: "pulse 1.5s infinite",
                }}
              >
                🎇
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          color: "#ffc300",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        FINISH
      </div>
    </div>
  );
};
