/** Pure crop geometry for the original-art export pipeline (unit-tested; no IO). */
export interface CropSpec { x: number; y: number | "center"; w: number }
export interface Rect { left: number; top: number; width: number; height: number }

/** Converts a fractional crop into a pixel rectangle of the target aspect, clamped inside the master. Throws if impossible. */
export function cropRect(masterW: number, masterH: number, spec: CropSpec, targetW: number, targetH: number): Rect {
  if (![masterW, masterH, targetW, targetH].every(n => Number.isInteger(n) && n > 0)) throw new Error("invalid dimensions");
  if (spec.w <= 0 || spec.w > 1 || spec.x < 0 || spec.x >= 1) throw new Error("invalid crop fractions");
  const aspect = targetW / targetH;
  let width = Math.round(masterW * spec.w);
  let height = Math.round(width / aspect);
  if (height > masterH) { height = masterH; width = Math.round(height * aspect); }
  let left = Math.round(masterW * spec.x);
  if (left + width > masterW) left = masterW - width;
  let top = spec.y === "center" ? Math.round((masterH - height) / 2) : Math.round(masterH * spec.y);
  if (top + height > masterH) top = masterH - height;
  if (left < 0 || top < 0) throw new Error("crop does not fit the master");
  return { left, top, width, height };
}

/** Upscaling an original would blur detail; the pipeline refuses it. */
export function wouldUpscale(rect: Rect, targetW: number): boolean {
  return rect.width < targetW;
}
