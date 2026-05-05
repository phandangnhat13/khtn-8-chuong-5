/**
 * Canvas 2D `roundRect` is missing on some older browsers / WebViews.
 * Lesson simulations use it heavily; without it, drawing throws and can blank the page.
 */
export function installCanvasRoundRectPolyfill() {
  if (typeof window === "undefined") return;
  const proto = CanvasRenderingContext2D.prototype as CanvasRenderingContext2D & {
    roundRect?: (
      x: number,
      y: number,
      w: number,
      h: number,
      radii?: number | number[],
    ) => void;
  };
  if (typeof proto.roundRect === "function") return;

  proto.roundRect = function (x, y, w, h, radii) {
    const r0 = Array.isArray(radii) ? (radii[0] ?? 0) : (radii ?? 0);
    const r = Math.max(0, Math.min(r0, Math.min(w, h) / 2));
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}
