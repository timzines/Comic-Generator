/**
 * Canvas-based manga page compositor.
 * Composites panel images into a page layout template,
 * draws manga-style speech bubbles with dialog text.
 * Runs entirely client-side.
 */
import { getLayout, type PanelSlot } from './manga-layouts';

export interface CompositePanel {
  imageUrl: string | null;
  dialog: string | null;
  position: number;
}

export interface CompositePage {
  pageNumber: number;
  panels: CompositePanel[];
}

// Page dimensions (manga tankoubon size at 300dpi equivalent)
const PAGE_W = 1600;
const PAGE_H = 2400;

function pct(value: number, total: number): number {
  return (value / 100) * total;
}

/**
 * Load an image as HTMLImageElement. Returns null on failure.
 */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draw a manga speech bubble with tail and text.
 */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
) {
  ctx.save();

  // Measure text to size bubble
  const fontSize = Math.max(16, Math.min(28, maxWidth / 14));
  ctx.font = `bold ${fontSize}px "Comic Sans MS", "Syne", sans-serif`;

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const bubbleMaxW = maxWidth * 0.8;

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(test);
    if (metrics.width > bubbleMaxW && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.3;
  const textHeight = lines.length * lineHeight;
  const textWidth = Math.min(
    bubbleMaxW,
    Math.max(...lines.map((l) => ctx.measureText(l).width)),
  );

  const padX = fontSize * 0.8;
  const padY = fontSize * 0.6;
  const bubbleW = textWidth + padX * 2;
  const bubbleH = textHeight + padY * 2;
  const bubbleX = cx - bubbleW / 2;
  const bubbleY = cy - bubbleH / 2;

  // Bubble shape — rounded rect with tail
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;

  const radius = Math.min(20, bubbleH / 3);
  ctx.beginPath();
  ctx.moveTo(bubbleX + radius, bubbleY);
  ctx.lineTo(bubbleX + bubbleW - radius, bubbleY);
  ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + radius);
  ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - radius);
  ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - radius, bubbleY + bubbleH);
  // Tail
  const tailX = cx;
  const tailY = bubbleY + bubbleH;
  ctx.lineTo(tailX + 10, tailY);
  ctx.lineTo(tailX, tailY + 20);
  ctx.lineTo(tailX - 10, tailY);
  ctx.lineTo(bubbleX + radius, bubbleY + bubbleH);
  ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - radius);
  ctx.lineTo(bubbleX, bubbleY + radius);
  ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + radius, bubbleY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const textStartY = bubbleY + padY;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, textStartY + i * lineHeight);
  }

  ctx.restore();
}

/**
 * Draw a panel image into a slot, cropping to fill.
 */
function drawPanelImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: PanelSlot,
) {
  const dx = pct(slot.x, PAGE_W);
  const dy = pct(slot.y, PAGE_H);
  const dw = pct(slot.w, PAGE_W);
  const dh = pct(slot.h, PAGE_H);

  // Cover-fit crop
  const imgRatio = img.width / img.height;
  const slotRatio = dw / dh;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > slotRatio) {
    sw = img.height * slotRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / slotRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  // Panel border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(dx, dy, dw, dh);
}

/**
 * Draw placeholder for panels without images.
 */
function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  slot: PanelSlot,
  index: number,
) {
  const dx = pct(slot.x, PAGE_W);
  const dy = pct(slot.y, PAGE_H);
  const dw = pct(slot.w, PAGE_W);
  const dh = pct(slot.h, PAGE_H);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(dx, dy, dw, dh);

  ctx.strokeStyle = '#333355';
  ctx.lineWidth = 2;
  ctx.strokeRect(dx, dy, dw, dh);

  // Panel number
  ctx.fillStyle = '#555577';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${index + 1}`, dx + dw / 2, dy + dh / 2);
}

/**
 * Composite a full manga page: layout + images + speech bubbles.
 * Returns a canvas element ready for export.
 */
export async function compositePage(
  page: CompositePage,
  pageIndex: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d')!;

  // White page background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const layout = getLayout(page.panels.length, pageIndex);
  const slots = layout.slots;

  // Load all images in parallel
  const images = await Promise.all(
    page.panels.map((p) => (p.imageUrl ? loadImage(p.imageUrl) : Promise.resolve(null))),
  );

  // Draw panels
  for (let i = 0; i < page.panels.length && i < slots.length; i++) {
    const slot = slots[i];
    const img = images[i];

    if (img) {
      drawPanelImage(ctx, img, slot);
    } else {
      drawPlaceholder(ctx, slot, i);
    }
  }

  // Draw speech bubbles
  for (let i = 0; i < page.panels.length && i < slots.length; i++) {
    const panel = page.panels[i];
    const slot = slots[i];

    if (panel.dialog) {
      const slotX = pct(slot.x, PAGE_W);
      const slotY = pct(slot.y, PAGE_H);
      const slotW = pct(slot.w, PAGE_W);
      const slotH = pct(slot.h, PAGE_H);

      // Position bubble in upper portion of panel
      const bubbleCx = slotX + slotW * 0.5;
      const bubbleCy = slotY + slotH * 0.2;

      drawSpeechBubble(ctx, panel.dialog, bubbleCx, bubbleCy, slotW);
    }
  }

  // Page border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, PAGE_W, PAGE_H);

  return canvas;
}

/**
 * Export a canvas as a PNG data URL.
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.95): string {
  return canvas.toDataURL('image/png', quality);
}

/**
 * Export a canvas as a Blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas_to_blob_failed'))),
      'image/png',
    );
  });
}

export { PAGE_W, PAGE_H };
