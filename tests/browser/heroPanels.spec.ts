import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

async function inspectPanels(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('#inicio')!;
    const bounds = hero.getBoundingClientRect();
    const actionTop = Math.min(...Array.from(hero.querySelectorAll('.hero-actions button'), button => button.getBoundingClientRect().top));
    const panels = Array.from(hero.querySelectorAll<HTMLElement>('.hero-card-inner'))
      .filter(panel => getComputedStyle(panel).visibility !== 'hidden' && getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().width > 0)
      .map(panel => {
        const r = panel.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
    const issues: string[] = [];
    panels.forEach((panel, index) => {
      if (panel.left < 15 || panel.right > document.documentElement.clientWidth - 15) issues.push(`panel ${index} outside a lateral edge`);
      if (panel.top < bounds.top + 15 || panel.bottom > actionTop - 19) issues.push(`panel ${index} outside the safe area above the buttons`);
      panels.slice(index + 1).forEach(other => {
        if (panel.left < other.right && panel.right > other.left && panel.top < other.bottom && panel.bottom > other.top) issues.push('panels overlap');
      });
    });
    if (document.documentElement.scrollWidth > innerWidth) issues.push('horizontal page overflow');
    return { panels, issues };
  });
}

async function expectClear(page: Page, context: string, count = 3) {
  await expect.poll(async () => (await inspectPanels(page)).issues, { message: context }).toEqual([]);
  await expect.poll(async () => (await inspectPanels(page)).panels.length, { message: context }).toBe(count);
}

test('hero panels avoid the actions and viewport edges during movement, scroll and resizing', async ({ page, browserName }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Cargando SYKR4', { exact: true }).waitFor({ state: 'detached' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle(/SYKR4/);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page.waitForTimeout(1400);
  const output = process.env.SYKR4_HERO_QA_DIR;

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1536, height: 864 }, { width: 1920, height: 1080 }, { width: 1920, height: 800 }, { width: 1440, height: 600 }, { width: 2560, height: 1440 }, { width: 1280, height: 960 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(350);
    for (const [x, y] of [[viewport.width / 2, viewport.height / 2], [1, 1], [viewport.width - 1, viewport.height - 1]]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(100);
      await expectClear(page, `${viewport.width}x${viewport.height} pointer ${x},${y}`);
    }
    const primary = page.getByRole('button', { name: 'Hablemos de tu proyecto', exact: true });
    const button = await primary.boundingBox();
    if (button && button.y + button.height < viewport.height) {
      await page.mouse.move(button.x + button.width - 8, button.y + 8);
      await page.waitForTimeout(350);
      await expectClear(page, 'magnetic CTA movement');
    }
    if (output && [1366, 1440].includes(viewport.width)) await page.screenshot({ path: path.join(output, `hero-after-${browserName}-${viewport.width}x${viewport.height}.png`) });
    for (const top of [100, 240, 0]) {
      await page.evaluate(y => window.scrollTo(0, y), top);
      await page.waitForTimeout(200);
      await expectClear(page, `${viewport.width}x${viewport.height} scroll ${top}`);
    }
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await expectClear(page, 'reduced motion');
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expectClear(page, `hidden decoration at ${width}px`, 0);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await expectClear(page, 'desktop restored after mobile');
  await page.getByRole('button', { name: 'Hablemos de tu proyecto', exact: true }).click();
  await expect.poll(() => page.locator('#contacto').evaluate(section => Math.abs(section.getBoundingClientRect().top))).toBeLessThan(3);
  expect(errors).toEqual([]);
});
