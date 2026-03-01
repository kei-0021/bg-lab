// src/components/systemMessageWindow.tsx

import React from "react";
import styles from "./systemMessageWindow.module.css";

interface SystemMessageWindowProps {
  messages: string[];
  title?: string;
}

export const SystemMessageWindow: React.FC<SystemMessageWindowProps> = ({
  messages,
  title = "大会の記録",
}) => {
  return (
    <section className={styles.messageContainer}>
      <div className={styles.messageHeader}>{title}</div>
      <div className={styles.messageList}>
        {messages.map((message, index) => (
          <div key={index} className={styles.messageItem}>
            {message}
          </div>
        ))}
        {messages.length === 0 && (
          <div className={styles.messagePlaceholder}>準備中...</div>
        )}
      </div>
    </section>
  );
};
