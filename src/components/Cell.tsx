// src/components/Cell.tsx
export type CellState = "light" | "shadow";

export class Cell {
  r: number;
  s: number;
  radiusInner: number;
  radiusOuter: number;
  angleStart: number;
  angleEnd: number;
  state: CellState;

  constructor(
    r: number,
    s: number,
    innerR: number,
    outerR: number,
    angleStart: number,
    angleEnd: number,
    state: CellState,
  ) {
    this.r = r;
    this.s = s;
    this.radiusInner = innerR;
    this.radiusOuter = outerR;
    this.angleStart = angleStart;
    this.angleEnd = angleEnd;
    this.state = state;
  }

  /**
   * --- 盤面セル描画 ---
   * themeColorを追加で受け取ることで、BoardCanvas 側から色を渡せるように。
   * デフォルトは白とグレーのままにして、互換性を保つ。
   */
  draw(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    color?: string,
  ) {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(
      center.x,
      center.y,
      this.radiusOuter,
      this.angleStart,
      this.angleEnd,
    );
    ctx.arc(
      center.x,
      center.y,
      this.radiusInner,
      this.angleEnd,
      this.angleStart,
      true,
    );
    ctx.closePath();

    // --- 塗りつぶし ---
    if (color) {
      // BoardCanvasから渡されたテーマカラーを使う
      const gradient = ctx.createRadialGradient(
        center.x,
        center.y,
        this.radiusInner,
        center.x,
        center.y,
        this.radiusOuter,
      );
      gradient.addColorStop(0, this.state === "light" ? color : "#00000040");
      gradient.addColorStop(
        1,
        this.state === "light" ? "#ffffff20" : "#00000080",
      );
      ctx.fillStyle = gradient;
    } else {
      // 旧スタイル（後方互換）
      ctx.fillStyle = this.state === "light" ? "white" : "gray";
    }
    ctx.fill();

    // --- 枠線 ---
    ctx.strokeStyle = color ? "#ffffff30" : "white";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * 状態トグル（light ↔ shadow）
   */
  toggleState() {
    this.state = this.state === "light" ? "shadow" : "light";
  }

  /**
   * --- 当たり判定 ---
   * マウス位置がこのセル内かどうかを判定する。
   */
  containsPoint(
    x: number,
    y: number,
    center: { x: number; y: number },
  ): boolean {
    const dx = x - center.x;
    const dy = y - center.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r < this.radiusInner || r > this.radiusOuter) return false;

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    return angle >= this.angleStart && angle <= this.angleEnd;
  }
}
