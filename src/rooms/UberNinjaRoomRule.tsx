// src/components/UberNinjaRoomRule.tsx
import styles from "./UberNinjaRoomRule.module.css";

interface UberNinjaRoomRuleProps {
  setShowRules: (show: boolean) => void;
}

export default function UberNinjaRoomRule({
  setShowRules,
}: UberNinjaRoomRuleProps) {
  return (
    <div
      className={styles.ninjaRuleOverlay}
      onClick={() => setShowRules(false)}
    >
      <div
        className={styles.ninjaScrollContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.scrollHeader}>
          <h2>📜 忍法帖：配達の掟</h2>
        </div>
        <div className={styles.scrollBody}>
          <ul>
            <li>
              <strong>其の一：</strong>{" "}
              注文カードを引き、指定の場所へ品を届けるべし。
            </li>
            <li>
              <strong>其の二：</strong> ダイスを振り、出た目の数だけ移動せよ。
            </li>
            <li>
              <strong>其の三：</strong>{" "}
              撒菱（マキビシ）は全スクーターの進路を妨害する罠なり。慎重に置くべし。
            </li>
            <li>
              <strong>其の四：</strong> スクーターは素早い
              (サイコロで出た目*2で進む)が、環境（昼・夜・霧）に左右される。
            </li>
          </ul>
        </div>
        <button
          className={styles.scrollCloseBtn}
          onClick={() => setShowRules(false)}
        >
          承知した
        </button>
      </div>
    </div>
  );
}
