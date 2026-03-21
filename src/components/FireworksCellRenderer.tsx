// src/components/FireworksCellRenderer.tsx

import type { CellData } from "react-game-ui";

export const FireworksCellRenderer = ({ cellData }: { cellData: CellData }) => {
  const content = cellData.content;
  if (!content) return null;

  // 画像パスかどうかの判定
  const isImage = content.startsWith("/") || content.startsWith("http");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isImage ? (
        <img
          src={content}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover", // マス目一杯に広げるならcover、収めるならcontain
            pointerEvents: "none",
          }}
        />
      ) : (
        <span style={{ fontSize: "12px", color: "#ccc" }}>{content}</span>
      )}
    </div>
  );
};
