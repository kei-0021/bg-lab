// src/components/Piece.tsx
export class Piece {
  type: string;
  id: string;
  r: number;
  s: number;
  color: string;
  tempX: number | null;
  tempY: number | null;
  offsetX?: number;
  offsetY?: number;

  constructor(type: string, id: string, r: number, s: number, color: string) {
    this.type = type;
    this.id = id;
    this.r = r;
    this.s = s;
    this.color = color;
    this.tempX = null;
    this.tempY = null;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    cells: any[],
    radii: number[],
  ) {
    const cell = cells.find((c) => c.r === this.r && c.s === this.s);
    if (!cell) return;

    const x =
      this.tempX ??
      center.x +
        Math.cos((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50);
    const y =
      this.tempY ??
      center.y +
        Math.sin((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50);

    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${this.id}`, x, y);
  }

  drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${this.id}`, x, y);
  }

  isHit(
    mx: number,
    my: number,
    center: { x: number; y: number },
    radii: number[],
    cells: any[],
  ): boolean {
    const cell = cells.find((c) => c.r === this.r && c.s === this.s);
    if (!cell) return false;

    const x =
      center.x +
      Math.cos((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50);
    const y =
      center.y +
      Math.sin((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50);
    return Math.hypot(mx - x, my - y) < 15;
  }

  startDrag(
    mx: number,
    my: number,
    center: { x: number; y: number },
    radii: number[],
    cells: any[],
  ) {
    const cell = cells.find((c) => c.r === this.r && c.s === this.s);
    if (!cell) return;
    this.offsetX =
      mx -
      (center.x +
        Math.cos((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50));
    this.offsetY =
      my -
      (center.y +
        Math.sin((cell.angleStart + cell.angleEnd) / 2) * (radii[this.r] - 50));
  }

  drag(mx: number, my: number) {
    this.tempX = mx - (this.offsetX ?? 0);
    this.tempY = my - (this.offsetY ?? 0);
  }

  endDrag() {
    this.tempX = null;
    this.tempY = null;
  }

  // Grid 用クリック判定
  isHitGrid(mx: number, my: number, x: number, y: number, radius = 15) {
    return Math.hypot(mx - x, my - y) < radius;
  }

  // Grid 用ドラッグ開始
  startDragGrid(mx: number, my: number, x: number, y: number) {
    this.offsetX = mx - x;
    this.offsetY = my - y;
  }

  // Grid 用ドラッグ中
  dragGrid(mx: number, my: number) {
    this.tempX = mx - (this.offsetX ?? 0);
    this.tempY = my - (this.offsetY ?? 0);
  }

  // Grid 用ドラッグ終了
  endDragGrid() {
    this.tempX = null;
    this.tempY = null;
  }
}
