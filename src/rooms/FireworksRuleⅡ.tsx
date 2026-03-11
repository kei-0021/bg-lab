// src/components/FireWorksRuleⅡ.tsx
import React from "react";
import { createPortal } from "react-dom";
import styles from "./FireworksRoomRule.module.css";

interface FireWorksRuleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FireWorksRuleⅡ: React.FC<FireWorksRuleProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.rulesOverlay} onClick={onClose}>
      <div className={styles.rulesContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.rulesClose}
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <h2 className={styles.rulesTitle}>🎆 FireworkⅡ 遊び方</h2>
        <hr className={styles.rulesHr} />

        <div className={styles.rulesBody}>
          <section>
            <h3>1. 勝利条件</h3>
            <p>
              条件に合う「花火カード」を出していきます。 花火大会 (8ラウンド)
              が終わるまでに最も高いスコアを獲得した職人が勝者です。
            </p>
          </section>

          <section className={styles.sectionMt}>
            <h3>2. ゲームの進め方</h3>
            <ul>
              <li>
                <strong>ドロー：</strong>{" "}
                手札が0枚の場合、山札からカードを5枚引きます
                (山札にカードがない場合は捨て札からカードを戻してシャッフルします)
              </li>
              <li>
                <strong>演目 or カラーの決定：</strong>{" "}
                演目カードとカラーカードのどちらかを選び、表にします
              </li>
              <li>
                <strong>プレイ：</strong>
                手札を場に3枚まで同時に出します。演目カード・カラーカードの条件に合うようにプレイしましょう。
              </li>
              <li>
                <strong>判定：</strong>{" "}
                場の判定カードそれぞれにおいて、全員の出したカードの中で最も条件に当てはまる人に+1点します。同率は全員に+1点とします。
              </li>
            </ul>
          </section>
        </div>

        <button onClick={onClose} className={styles.rulesOkBtn}>
          閉じる
        </button>
      </div>
    </div>,
    document.body,
  );
};
