// src/components/GridDeliverRoad.tsx
import React from "react";
import styles from "./GridDeliverRoad.module.css";

/**
 * UberNinja用 グリッド配達ボード
 */
export default function GridDeliverRoad({
  rows = 10,
  cols = 10,
  children,
}: {
  rows?: number;
  cols?: number;
  children?: React.ReactNode;
}) {
  // グリッドのマス目を生成
  const cells = React.useMemo(() => {
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({ r, c });
      }
    }
    return arr;
  }, [rows, cols]);

  return (
    <div
      className={styles.boardContainer}
      style={
        {
          "--grid-rows": rows,
          "--grid-cols": cols,
        } as React.CSSProperties
      }
    >
      {/* 背景のグリッド線 */}
      <div className={styles.gridOverlay}>
        {cells.map((cell) => (
          <div
            key={`${cell.r}-${cell.c}`}
            className={styles.cell}
            data-row={cell.r}
            data-col={cell.c}
          />
        ))}
      </div>

      {/* 忍者や荷物、エフェクトを配置するレイヤー */}
      <div className={styles.contentLayer}>{children}</div>
    </div>
  );
}
