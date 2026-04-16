/**
 * Manga page layout templates.
 * Each template defines panel slots as { x, y, w, h } in percentage coordinates (0-100).
 * The page is drawn on a canvas with a black background and white gutters between panels.
 */

export interface PanelSlot {
  x: number; // % from left
  y: number; // % from top
  w: number; // % width
  h: number; // % height
}

export interface PageLayout {
  name: string;
  panelCount: number;
  slots: PanelSlot[];
}

const GUTTER = 1.5; // % gutter between panels
const MARGIN = 2; // % page margin

// 3-panel layouts
const layout3A: PageLayout = {
  name: '3-panel-top-split',
  panelCount: 3,
  slots: [
    { x: MARGIN, y: MARGIN, w: 100 - 2 * MARGIN, h: 40 - MARGIN },
    { x: MARGIN, y: 40 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 60 - MARGIN - GUTTER / 2 },
    { x: 50 + GUTTER / 2, y: 40 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 60 - MARGIN - GUTTER / 2 },
  ],
};

const layout3B: PageLayout = {
  name: '3-panel-stacked',
  panelCount: 3,
  slots: [
    { x: MARGIN, y: MARGIN, w: 100 - 2 * MARGIN, h: 30 - GUTTER / 2 },
    { x: MARGIN, y: 30 + GUTTER / 2, w: 100 - 2 * MARGIN, h: 35 - GUTTER },
    { x: MARGIN, y: 65 + GUTTER / 2, w: 100 - 2 * MARGIN, h: 35 - MARGIN - GUTTER / 2 },
  ],
};

// 4-panel layouts
const layout4A: PageLayout = {
  name: '4-panel-grid',
  panelCount: 4,
  slots: [
    { x: MARGIN, y: MARGIN, w: 50 - MARGIN - GUTTER / 2, h: 50 - MARGIN - GUTTER / 2 },
    { x: 50 + GUTTER / 2, y: MARGIN, w: 50 - MARGIN - GUTTER / 2, h: 50 - MARGIN - GUTTER / 2 },
    { x: MARGIN, y: 50 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 50 - MARGIN - GUTTER / 2 },
    { x: 50 + GUTTER / 2, y: 50 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 50 - MARGIN - GUTTER / 2 },
  ],
};

const layout4B: PageLayout = {
  name: '4-panel-manga',
  panelCount: 4,
  slots: [
    { x: MARGIN, y: MARGIN, w: 60 - MARGIN - GUTTER / 2, h: 45 - GUTTER / 2 },
    { x: 60 + GUTTER / 2, y: MARGIN, w: 40 - MARGIN - GUTTER / 2, h: 45 - GUTTER / 2 },
    { x: MARGIN, y: 45 + GUTTER / 2, w: 40 - MARGIN - GUTTER / 2, h: 55 - MARGIN - GUTTER / 2 },
    { x: 40 + GUTTER / 2, y: 45 + GUTTER / 2, w: 60 - MARGIN - GUTTER / 2, h: 55 - MARGIN - GUTTER / 2 },
  ],
};

// 5-panel layouts
const layout5A: PageLayout = {
  name: '5-panel-dynamic',
  panelCount: 5,
  slots: [
    { x: MARGIN, y: MARGIN, w: 100 - 2 * MARGIN, h: 30 - GUTTER / 2 },
    { x: MARGIN, y: 30 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 35 - GUTTER },
    { x: 50 + GUTTER / 2, y: 30 + GUTTER / 2, w: 50 - MARGIN - GUTTER / 2, h: 35 - GUTTER },
    { x: MARGIN, y: 65 + GUTTER / 2, w: 35 - MARGIN - GUTTER / 2, h: 35 - MARGIN - GUTTER / 2 },
    { x: 35 + GUTTER / 2, y: 65 + GUTTER / 2, w: 65 - MARGIN - GUTTER / 2, h: 35 - MARGIN - GUTTER / 2 },
  ],
};

const layout5B: PageLayout = {
  name: '5-panel-vertical',
  panelCount: 5,
  slots: [
    { x: MARGIN, y: MARGIN, w: 55 - MARGIN - GUTTER / 2, h: 40 - GUTTER / 2 },
    { x: 55 + GUTTER / 2, y: MARGIN, w: 45 - MARGIN - GUTTER / 2, h: 25 - GUTTER / 2 },
    { x: 55 + GUTTER / 2, y: 25 + GUTTER / 2, w: 45 - MARGIN - GUTTER / 2, h: 15 - GUTTER / 2 },
    { x: MARGIN, y: 40 + GUTTER / 2, w: 100 - 2 * MARGIN, h: 30 - GUTTER },
    { x: MARGIN, y: 70 + GUTTER / 2, w: 100 - 2 * MARGIN, h: 30 - MARGIN - GUTTER / 2 },
  ],
};

const LAYOUTS_BY_COUNT: Record<number, PageLayout[]> = {
  3: [layout3A, layout3B],
  4: [layout4A, layout4B],
  5: [layout5A, layout5B],
};

/**
 * Pick a layout for a given panel count. Alternates between variants
 * based on pageIndex so consecutive pages look different.
 */
export function getLayout(panelCount: number, pageIndex: number): PageLayout {
  const clamped = Math.max(3, Math.min(5, panelCount));
  const variants = LAYOUTS_BY_COUNT[clamped];
  return variants[pageIndex % variants.length];
}

export function getAllLayouts(): Record<number, PageLayout[]> {
  return LAYOUTS_BY_COUNT;
}
