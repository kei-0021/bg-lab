// src/components/BoardCanvas.tsx
import React, { useEffect, useRef } from "react";
import { Cell } from "./Cell";
import { Piece } from "./Piece";

interface RadialBoardCanvasProps {
  pieces: Piece[];
  setPieces: React.Dispatch<React.SetStateAction<Piece[]>>;
  theme?: "forest" | "moon" | "lake"; // ← テーマ追加
}

export function RadialBoardCanvas({
  pieces,
  setPieces,
  theme = "forest",
}: RadialBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingPieceRef = useRef<Piece | null>(null);

  // --- 盤面用 ---
  const center = { x: 300, y: 300 };
  const radii = [100, 200, 300];
  const sectors = 12;
  const offset = (15 * Math.PI) / 180;

  // --- テーマ別スタイル ---
  const boardStyle = React.useMemo(() => {
    switch (theme) {
      case "forest":
        return {
          background: "#0b3d0b",
          lightColor: "#3fa34d",
          shadowColor: "#1e4620",
          lineColor: "#a4d68e",
        };
      case "moon":
        return {
          background: "#1a183f",
          lightColor: "#d1d1f2",
          shadowColor: "#4c4b6f",
          lineColor: "#f8f6e7",
        };
      case "lake":
        return {
          background: "#082b4c",
          lightColor: "#4fc3f7",
          shadowColor: "#1565c0",
          lineColor: "#bbdefb",
        };
      default:
        return {
          background: "#000",
          lightColor: "#999",
          shadowColor: "#555",
          lineColor: "#fff",
        };
    }
  }, [theme]);

  // マス生成（固定でOK）
  const cells: Cell[] = React.useMemo(() => {
    const arr: Cell[] = [];
    for (let r = 0; r < radii.length; r++) {
      for (let s = 0; s < sectors; s++) {
        const angleStart =
          (s / sectors) * 2 * Math.PI + offset - Math.PI / sectors;
        const angleEnd =
          (s / sectors) * 2 * Math.PI + offset + Math.PI / sectors;
        const state = (s + r) % 2 === 0 ? "light" : "shadow";
        arr.push(
          new Cell(
            r,
            s,
            r === 0 ? 0 : radii[r - 1],
            radii[r],
            angleStart,
            angleEnd,
            state,
          ),
        );
      }
    }
    return arr;
  }, []);

  // --- 盤面描画 ---
  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = boardStyle.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // マス描画（テーマ色を渡す）
    cells.forEach((cell) => {
      const color =
        cell.state === "light" ? boardStyle.lightColor : boardStyle.shadowColor;
      cell.draw(ctx, center, color);
    });

    // 駒描画
    pieces.forEach((p) => p.draw(ctx, center, cells, radii));

    // セクター線
    ctx.strokeStyle = boardStyle.lineColor;
    ctx.lineWidth = 1.2;
    for (let s = 0; s < sectors; s++) {
      const angle = (s / sectors) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(
        center.x + Math.cos(angle) * radii[radii.length - 1],
        center.y + Math.sin(angle) * radii[radii.length - 1],
      );
      ctx.stroke();
    }

    // 同心円
    radii.forEach((r) => {
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, 2 * Math.PI);
      ctx.stroke();
    });
  };

  useEffect(() => drawBoard(), [pieces, cells, theme]);

  // --- ドラッグ処理 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      for (const p of pieces) {
        if (p.isHit(pos.x, pos.y, center, radii, cells)) {
          p.startDrag(pos.x, pos.y, center, radii, cells);
          draggingPieceRef.current = p;
          return;
        }
      }
      for (const cell of cells) {
        if (cell.containsPoint(pos.x, pos.y, center)) {
          cell.toggleState();
          drawBoard();
          return;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const draggingPiece = draggingPieceRef.current;
      if (draggingPiece) {
        const pos = getMousePos(e);
        draggingPiece.drag(pos.x, pos.y);
        drawBoard();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const draggingPiece = draggingPieceRef.current;
      if (draggingPiece) {
        const pos = getMousePos(e);

        // 近いセルに吸着
        let closestCell: Cell | null = null;
        let minDist = Infinity;
        cells.forEach((c) => {
          const cx =
            center.x +
            Math.cos((c.angleStart + c.angleEnd) / 2) * (radii[c.r] - 50);
          const cy =
            center.y +
            Math.sin((c.angleStart + c.angleEnd) / 2) * (radii[c.r] - 50);
          const dx = pos.x - cx;
          const dy = pos.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closestCell = c;
          }
        });

        // nullチェックを先に行う
        if (!closestCell) {
          draggingPiece.endDrag();
          draggingPieceRef.current = null;
          drawBoard();
          return;
        }

        setPieces((prev) =>
          prev.map((p) =>
            p === draggingPiece
              ? new Piece(p.type, p.id, closestCell!.r, closestCell!.s, p.color)
              : p,
          ),
        );

        draggingPiece.endDrag();
        draggingPieceRef.current = null;
        drawBoard();
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, [pieces, cells, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      style={{
        background: boardStyle.background,
        display: "block",
        margin: "0 auto",
        borderRadius: "10px",
        boxShadow: "0 0 12px rgba(0,0,0,0.4)",
      }}
    />
  );
}
