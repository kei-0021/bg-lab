import React from "react";
import "./FireworksRoom.css";

// Propsの型を定義
interface FireWorksRuleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FireWorksRule: React.FC<FireWorksRuleProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-content" onClick={(e) => e.stopPropagation()}>
        <button className="rules-close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <h2 className="rules-title">🎆 花火大会 遊び方</h2>
        <hr className="rules-hr" />

        <div className="rules-body">
          <section>
            <h3>1. 勝利条件</h3>
            <p>
              共通の場にある<strong>「3枚の演目カード」</strong>
              から1つを選び、条件に合う「花火カード」を並べます。
              花火大会が終わるまでに最も高いスコアを獲得した職人が勝者です。
            </p>
          </section>

          <section className="section-mt">
            <h3>2. 手番のアクション</h3>
            <p>自分の番では以下のいずれかを行います：</p>
            <ul>
              <li>
                <strong>ドロー：</strong> 山札から花火カードを1枚引く。
              </li>
              <li>
                <strong>プレイ：</strong>{" "}
                手札を1枚出し、演目を完成させる（早い者勝ち！）。
              </li>
              <li>
                <strong>装填：</strong> 手札を1枚以上出し、装填エリアに置きます
                (次のターン場に移動します)
              </li>
            </ul>
          </section>

          {/* <section className="section-mt">
            <h3>3. 秘伝玉（トークン）</h3>
            <p>
              職人の魂です。特別な演目の達成や、得点のブーストに使用できます。
            </p>
          </section> */}
        </div>

        <button onClick={onClose} className="rules-ok-btn">
          了解
        </button>
      </div>
    </div>
  );
};
