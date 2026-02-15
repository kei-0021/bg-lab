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

          <section className="section-mt">
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
