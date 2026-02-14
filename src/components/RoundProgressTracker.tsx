import React from "react";
import styles from "./RoundProgressTracker.module.css";

interface RoundProgressTrackerProps {
  currentRound: number;
  maxRound?: number;
}

export const RoundProgressTracker: React.FC<RoundProgressTrackerProps> = ({
  currentRound,
  maxRound = 5,
}) => {
  const progressWidth = `${((currentRound - 1) / (maxRound - 1)) * 100}%`;

  return (
    <div className={styles.container}>
      <div className={styles.label}>ROUND TRACK</div>

      <div className={styles.barBase}>
        <div className={styles.gauge} style={{ width: progressWidth }} />

        {[...Array(maxRound)].map((_, i) => {
          const roundNum = i + 1;
          const isActive = roundNum <= currentRound;
          const isCurrent = roundNum === currentRound;

          return (
            <div
              key={i}
              className={styles.point}
              style={{ background: isActive ? "#ffc300" : "#444" }}
            >
              <span
                className={styles.number}
                style={{
                  fontWeight: isCurrent ? "bold" : "normal",
                  color: isActive ? "#ffc300" : "#666",
                }}
              >
                R{roundNum}
              </span>

              {isCurrent && <div className={styles.emoji}>🎇</div>}
            </div>
          );
        })}
      </div>

      <div className={styles.label}>FINISH</div>
    </div>
  );
};
