import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

async function openServices(page: Page) {
  await page.goto('/');
  await page.getByLabel('Cargando SYKR4', { exact: true }).waitFor({ state: 'detached' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle(/SYKR4/);
  await expect(page.getByRole('heading', { name: 'Encuentra la solución que necesita tu empresa.' })).toBeAttached();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page.locator('#servicios').evaluate(section => window.scrollTo(0, (section as HTMLElement).offsetTop + 1));
  await page.mouse.move(20, 80);
}

const trackFor = (page: Page) => page.locator('#servicios .svc-card').first().locator('..');
const trackX = (page: Page) => trackFor(page).evaluate(track => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);

async function screenshot(page: Page, name: string) {
  const directory = process.env.SYKR4_CAROUSEL_QA_DIR;
  if (directory) await page.screenshot({ path: path.join(directory, `${name}.png`) });
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  test(`services slide forwards and backwards at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(viewport);
    await openServices(page);
    const section = page.locator('#servicios');
    await expect(trackFor(page)).toHaveCSS('display', 'flex');
    await expect.poll(() => section.evaluate(element => element.clientHeight)).toBeGreaterThan(viewport.height + 500);
    await expect.poll(() => trackX(page)).toBeLessThan(1);
    await page.waitForTimeout(1200);
    await screenshot(page, `after-${viewport.width}x${viewport.height}-start`);

    const before = await trackX(page);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => trackX(page)).toBeLessThan(before - 300);
    await page.waitForTimeout(1200);
    const forwards = await trackX(page);
    await screenshot(page, `after-${viewport.width}x${viewport.height}-sliding`);
    await page.mouse.wheel(0, -350);
    await expect.poll(() => trackX(page)).toBeGreaterThan(forwards + 150);
    await page.waitForTimeout(1200);

    // All card text remains in natural flow, including the longest descriptions.
    const clipped = await page.locator('#servicios .svc-card button').evaluateAll(buttons => buttons.some(button => button.scrollHeight > button.clientHeight + 2));
    expect(clipped).toBe(false);

    // The complete row, including the final CTA, must be reachable.
    const remaining = await section.evaluate(element => element.getBoundingClientRect().top + element.clientHeight - innerHeight - 1);
    await page.mouse.wheel(0, remaining);
    await expect(page.getByRole('button', { name: 'Ayúdame a empezar' })).toBeInViewport();
    await page.waitForTimeout(1200);
    await screenshot(page, `after-${viewport.width}x${viewport.height}-end`);
    expect(errors).toEqual([]);
  });
}

test('a short desktop keeps the scroll animation with complete cards', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 500 });
  await openServices(page);
  await expect(trackFor(page)).toHaveCSS('display', 'flex');
  await expect.poll(() => trackFor(page).evaluate(track => track.offsetHeight)).toBeLessThanOrEqual(500);
  await page.waitForTimeout(1200);
  const before = await trackX(page);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => trackX(page)).toBeLessThan(before - 300);
  const clipped = await page.locator('#servicios .svc-card button').evaluateAll(buttons => buttons.some(button => button.scrollHeight > button.clientHeight + 2));
  expect(clipped).toBe(false);
  await screenshot(page, 'after-short-desktop');
});

test('mobile retains the vertical layout and service details open and close', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await openServices(page);
    await expect(trackFor(page)).toHaveCSS('display', 'grid');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#servicios .svc-card button').first().click();
    const detail = page.getByRole('dialog', { name: 'IA y automatización', exact: true });
    await expect(detail).toBeVisible();
    await expect(page.locator('#service-detail-title')).toHaveText('IA y automatización');
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
    await screenshot(page, 'after-mobile');
  } finally { await context.close(); }
});

test('resizing restores the animation after mobile and short desktop layouts', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openServices(page);
  await expect(trackFor(page)).toHaveCSS('display', 'flex');
  await page.setViewportSize({ width: 640, height: 768 });
  await expect(trackFor(page)).toHaveCSS('display', 'grid');
  await expect(trackFor(page)).toHaveCSS('transform', 'none');
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(trackFor(page)).toHaveCSS('display', 'flex');
  await expect.poll(() => trackFor(page).evaluate(track => track.offsetHeight)).toBeLessThanOrEqual(600);
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(trackFor(page)).toHaveCSS('display', 'flex');
  await page.locator('#servicios').evaluate(section => window.scrollTo(0, (section as HTMLElement).offsetTop + 1));
  await page.waitForTimeout(1200);
  const before = await trackX(page);
  await page.mouse.wheel(0, 650);
  await expect.poll(() => trackX(page)).toBeLessThan(before - 300);
});

test('responsive carousel retains vertical cards, readable copy and the full animated row', async ({ page, browserName }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1366, height: 768 });
  await openServices(page);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1440, height: 650 }, { width: 1024, height: 600 }, { width: 1024, height: 500 }, { width: 800, height: 450 }, { width: 800, height: 360 }, { width: 768, height: 432 }]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize(viewport);
    await page.waitForTimeout(350);
    await page.locator('#servicios').evaluate(section => window.scrollTo(0, (section as HTMLElement).offsetTop + 1));
    await page.mouse.move(20, 8);
    await page.waitForTimeout(1200);
    await expect(trackFor(page)).toHaveCSS('display', 'flex');
    await expect.poll(() => trackFor(page).evaluate(track => track.offsetHeight)).toBeLessThanOrEqual(viewport.height);
    const cards = page.locator('#servicios .svc-card');
    const cardButtons = cards.locator('button');
    for (const button of await cardButtons.all()) {
      await expect(button).toHaveCSS('display', 'flex');
      await expect(button).toHaveCSS('flex-direction', 'column');
    }
    const dimensions = await cards.evaluateAll(elements => elements.map(element => (element as HTMLElement).offsetWidth));
    expect(dimensions.every(width => width <= 402)).toBe(true);
    const copySizes = await page.locator('#servicios .svc-description').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
    expect(copySizes.every(size => size >= 14)).toBe(true);
    const before = await trackX(page);
    const distance = await cards.first().evaluate(card => card.getBoundingClientRect().left - 48);
    await page.mouse.wheel(0, distance);
    await expect.poll(() => trackX(page), { message: `${viewport.width}x${viewport.height} must animate` }).toBeLessThan(before - 250);
    await page.waitForTimeout(1200);
    const forwards = await trackX(page);
    await screenshot(page, `bug03-revision-${browserName}-${viewport.width}x${viewport.height}-sliding`);

    // Normal short laptop windows show complete copy without an inner scroll.
    // An exceptionally low window keeps the original type sizes and lets the
    // reader reach the card's end before handing the wheel back to the row.
    if (viewport.height >= 500) {
      const clipped = await cardButtons.evaluateAll(buttons => buttons.some(button => button.scrollHeight > button.clientHeight + 2));
      expect(clipped, `${viewport.width}x${viewport.height} shows complete cards`).toBe(false);
    }
    if (viewport.height === 360) {
      const first = cardButtons.first();
      const bounds = await first.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
      await page.mouse.wheel(0, 1000);
      await expect.poll(() => first.evaluate(button => button.scrollTop)).toBeGreaterThan(10);
      await expect.poll(() => first.evaluate(button => button.scrollHeight - button.clientHeight - button.scrollTop)).toBeLessThanOrEqual(2);
      await expect.poll(async () => Math.abs((await trackX(page)) - forwards)).toBeLessThan(3);
      await expect(first.getByText('Ver qué incluye')).toBeInViewport();
      await screenshot(page, `bug03-revision-${browserName}-800x360-card-end`);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => trackX(page)).toBeLessThan(forwards - 60);
      await page.waitForTimeout(1200);
      await page.mouse.move(20, 8);
    }
    if (viewport.width === 1024 && viewport.height === 500) {
      await cardButtons.first().click();
      const detail = page.getByRole('dialog', { name: 'IA y automatización', exact: true });
      await expect(detail).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(detail).toHaveCount(0);
      await page.mouse.move(20, 8);
    }
    if (viewport.width === 1024 && viewport.height === 600) {
      for (let index = 1; index < 5; index++) {
        const nextCard = cards.nth(index);
        const nextDistance = await nextCard.evaluate(card => card.getBoundingClientRect().left - 48);
        await page.mouse.wheel(0, nextDistance);
        await expect(nextCard.locator('h3')).toBeInViewport();
        await page.waitForTimeout(1200);
      }
      await screenshot(page, `bug03-revision-${browserName}-1024x600-last-service`);
    }
    const position = await trackX(page);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => trackX(page)).toBeGreaterThan(position + 100);
    await page.waitForTimeout(1200);
    const section = page.locator('#servicios');
    const remaining = await section.evaluate(element => element.getBoundingClientRect().top + element.clientHeight - innerHeight - 1);
    await page.mouse.wheel(0, remaining);
    await expect(page.getByRole('button', { name: 'Ayúdame a empezar' })).toBeInViewport();
    await page.waitForTimeout(1200);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(trackFor(page)).toHaveCSS('display', 'grid');
  await page.locator('#servicios .svc-card button').first().click();
  const mobileDetail = page.getByRole('dialog', { name: 'IA y automatización', exact: true });
  await expect(mobileDetail).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(mobileDetail).toHaveCount(0);
  await screenshot(page, `bug03-revision-${browserName}-390x844-mobile`);
  await page.setViewportSize({ width: 1024, height: 500 });
  await expect(trackFor(page)).toHaveCSS('display', 'flex');
  await page.waitForTimeout(350);
  await page.locator('#servicios').evaluate(section => window.scrollTo(0, (section as HTMLElement).offsetTop + 1));
  await page.mouse.move(20, 8);
  await page.waitForTimeout(1200);
  const reset = await trackX(page);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => trackX(page)).toBeLessThan(reset - 250);
  expect(errors).toEqual([]);
});
