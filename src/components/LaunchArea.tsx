import React from "react";
import styles from "./LaunchArea.module.css";

interface Props {
  className?: string;
}

export const LaunchArea: React.FC<Props> = ({ className }) => {
  const slots = [
    { id: "S1", label: "1" },
    { id: "S2", label: "2" },
    { id: "S3", label: "3" },
    { id: "S4", label: "4" },
    { id: "S5", label: "5" },
    { id: "S6", label: "6" },
  ];

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {slots.map((slot) => (
        <div key={slot.id} className={styles.slot}>
          {slot.label}
        </div>
      ))}
    </div>
  );
};
