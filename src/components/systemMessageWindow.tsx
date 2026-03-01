// src/components/systemMessageWindow.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./systemMessageWindow.module.css";

interface SystemMessageWindowProps {
  messages: string[];
  displayDuration?: number;
}

export const SystemMessageWindow: React.FC<SystemMessageWindowProps> = ({
  messages,
  displayDuration = 1000,
}) => {
  const [displayMessage, setDisplayMessage] = useState<string>("");
  const [queue, setQueue] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const processedCountRef = useRef(0);

  // 親の配列が増えたら、未処理分をキューに入れる
  useEffect(() => {
    if (messages.length > processedCountRef.current) {
      const newMessages = messages.slice(processedCountRef.current);
      setQueue((prev) => [...prev, ...newMessages]);
      processedCountRef.current = messages.length;
    }
  }, [messages]);

  // キューを一つずつ消化
  useEffect(() => {
    if (!isProcessing && queue.length > 0) {
      setIsProcessing(true);
      const nextMsg = queue[0];

      setDisplayMessage(nextMsg);
      setQueue((prev) => prev.slice(1));

      setTimeout(() => {
        setIsProcessing(false);
      }, displayDuration);
    }
  }, [queue, isProcessing, displayDuration]);

  return (
    <section className={styles.messageContainer}>
      <div className={styles.messageList}>
        <div
          key={displayMessage}
          className={
            displayMessage
              ? styles.messageItemActive
              : styles.messagePlaceholder
          }
        >
          {displayMessage || "待機中..."}
        </div>
      </div>
    </section>
  );
};
