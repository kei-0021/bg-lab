// src/components/FireWorksRule.tsx
import React from "react";
import { createPortal } from "react-dom";
import styles from "./FireworksRoomRule.module.css";

interface FireWorksRuleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FireWorksRule: React.FC<FireWorksRuleProps> = ({
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
        <h2 className={styles.rulesTitle}>🎆 花火大会 遊び方</h2>
        <hr className={styles.rulesHr} />

        <div className={styles.rulesBody}>
          <section>
            <h3>1. 勝利条件</h3>
            <p>
              条件に合う「花火カード」を並べていきます。 花火大会 (10ラウンド)
              が終わるまでに最も高いスコアを獲得した職人が勝者です。
            </p>
          </section>

          <section className={styles.sectionMt}>
            <h3>2. 手番の開始 </h3>
            <p>手番のアクションを行う前に、以下の処理を順に行います：</p>
            <ul>
              <li>
                <strong>装填カードの移動：</strong>
                自分の「装填エリア」にあるすべてのカードを「場」に移動させます。
              </li>
              <li>
                <strong>ドロー：</strong> 山札から花火カードを1枚引く。
              </li>
            </ul>
          </section>

          <section className={styles.sectionMt}>
            <h3>3. 手番のアクション</h3>
            <p>
              自分の番では以下のいずれか<strong>ひとつ</strong>を行います：
            </p>
            <ul>
              <li>
                <strong>ドロー：</strong> 山札からさらに花火カードを1枚引く。
              </li>
              <li>
                <strong>プレイ：</strong>
                手札を場に1枚出します。演目の完成を目指します。
              </li>
              <li>
                <strong>装填：</strong> 手札を1~3枚出し、装填エリアに置きます。
              </li>
            </ul>
          </section>
        </div>

        <button onClick={onClose} className={styles.rulesOkBtn}>
          了解
        </button>
      </div>
    </div>,
    document.body,
  );
};
