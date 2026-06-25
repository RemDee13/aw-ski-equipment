// Map a point given as a fraction (0..1) of the video's intrinsic frame onto
// screen pixels, accounting for object-fit: cover cropping at any viewport ratio.
// Mirrors the sibling project's shared media-transform idea.

export const VIDEO_W = 1280
export const VIDEO_H = 720

export interface Pt {
  x: number
  y: number
}

export function coverPoint(
  fx: number,
  fy: number,
  stageW: number,
  stageH: number,
  vidW = VIDEO_W,
  vidH = VIDEO_H,
): Pt {
  const scale = Math.max(stageW / vidW, stageH / vidH)
  const dispW = vidW * scale
  const dispH = vidH * scale
  const offX = (stageW - dispW) / 2
  const offY = (stageH - dispH) / 2
  return { x: offX + fx * dispW, y: offY + fy * dispH }
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
