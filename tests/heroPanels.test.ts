import assert from 'node:assert/strict';
import { test } from 'node:test';
import { layoutHeroPanels, type PanelBox } from '../src/lib/heroPanels.ts';

const box = (left: number, top: number, width: number, height: number): PanelBox => ({ left, top, right: left + width, bottom: top + height });
const overlaps = (a: PanelBox, b: PanelBox, gap = 0) => a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;

test('hero panels leave the action row clear in the reported short desktop layout', () => {
  const panels = [box(1127, 108, 224, 155), box(775, 314, 240, 178), box(1117, 330, 256, 158)];
  const bounds = { left: 16, right: 1414, top: 16, bottom: 422 };
  const placements = layoutHeroPanels(panels, bounds);
  const positioned = panels.map((panel, i) => ({ left: panel.left + placements[i].x, right: panel.right + placements[i].x, top: panel.top + placements[i].y, bottom: panel.bottom + placements[i].y }));
  assert.ok(placements.every(p => p.visible), 'all three panels fit without obscuring a button');
  positioned.forEach((panel, i) => {
    assert.ok(panel.left >= bounds.left && panel.right <= bounds.right);
    assert.ok(panel.top >= bounds.top && panel.bottom <= bounds.bottom);
    positioned.slice(i + 1).forEach(other => assert.equal(overlaps(panel, other, 19.99), false));
  });
  assert.ok(placements[0].y < 0, 'the upper cloud panel makes room for the lower panel');
});

test('hero panels preserve their original position when it is already safe', () => {
  const panels = [box(900, 90, 224, 155), box(620, 420, 240, 178), box(900, 410, 256, 158)];
  assert.deepEqual(layoutHeroPanels(panels, { left: 16, right: 1300, top: 16, bottom: 680 }), panels.map(() => ({ x: 0, y: 0, visible: true })));
});

test('pointer offsets are clamped on both sides without pushing a panel off screen', () => {
  for (const left of [-80, 15, 1100, 1400]) {
    const panel = box(left, 240, 256, 158);
    const [placement] = layoutHeroPanels([panel], { left: 16, right: 1264, top: 16, bottom: 540 });
    assert.equal(placement.visible, true);
    assert.ok(panel.left + placement.x >= 16);
    assert.ok(panel.right + placement.x <= 1264);
  }
});

test('an impossible decorative panel yields instead of covering an action or overflowing', () => {
  const [placement] = layoutHeroPanels([box(900, 80, 256, 158)], { left: 16, right: 1264, top: 16, bottom: 140 });
  assert.equal(placement.visible, false);
});
