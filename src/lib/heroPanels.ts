export interface PanelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PanelPlacement {
  x: number;
  y: number;
  visible: boolean;
}

/** Keep the decorative panels inside the hero and above its action buttons. */
export function layoutHeroPanels(panels: PanelBox[], bounds: PanelBox, gap = 20): PanelPlacement[] {
  const placed: PanelBox[] = [];
  const result: PanelPlacement[] = panels.map(() => ({ x: 0, y: 0, visible: false }));
  // Place the lower panels first so an upper panel can move up to make room.
  const order = panels.map((box, index) => ({ box, index })).sort((a, b) => b.box.bottom - a.box.bottom);

  for (const { box, index } of order) {
    const width = box.right - box.left;
    const height = box.bottom - box.top;
    if (width <= 0 || height <= 0 || width > bounds.right - bounds.left || height > bounds.bottom - bounds.top) continue;
    const left = Math.max(bounds.left, Math.min(box.left, bounds.right - width));
    const right = left + width;
    const preferredTop = Math.max(bounds.top, Math.min(box.top, bounds.bottom - height));
    const neighbours = placed.filter(other => left < other.right + gap && right > other.left - gap);
    const candidates = [preferredTop, bounds.top, bounds.bottom - height];
    for (const other of neighbours) candidates.push(other.top - gap - height, other.bottom + gap);
    const top = candidates
      .filter(candidate => candidate >= bounds.top && candidate + height <= bounds.bottom)
      .filter(candidate => neighbours.every(other => candidate + height <= other.top - gap || candidate >= other.bottom + gap))
      .sort((a, b) => Math.abs(a - box.top) - Math.abs(b - box.top) || a - b)[0];
    // A decorative panel must yield if the available space genuinely cannot fit it.
    if (top === undefined) continue;
    result[index] = { x: left - box.left, y: top - box.top, visible: true };
    placed.push({ left, top, right, bottom: top + height });
  }
  return result;
}
