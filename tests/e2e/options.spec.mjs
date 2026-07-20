import { test, expect } from '@playwright/test';
import { createExtensionContext, openPage } from './setup.mjs';

test.describe('Options page (options/index.html)', () => {
  let server;
  let browser;
  let context;
  let baseUrl;
  let page;

  test.beforeAll(async () => {
    const ctx = await createExtensionContext();
    server = ctx.server;
    browser = ctx.browser;
    context = ctx.context;
    baseUrl = ctx.baseUrl;
  });

  test.afterAll(async () => {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise(r => server.close(r));
  });

  test.beforeEach(async () => {
    page = await openPage(context, baseUrl, 'options/index.html');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    if (page) await page.close().catch(() => {});
  });

  test('2.1 Options page loads with all sections', async () => {
    await expect(page.locator('#language-select')).toBeVisible();
    await expect(page.locator('#theme-select')).toBeVisible();
    await expect(page.locator('#default-encoding-select')).toBeVisible();
    await expect(page.locator('input[name="workMode"]')).toHaveCount(2);
  });

  test('2.2 Changing language saves and shows confirmation', async () => {
    await page.selectOption('#language-select', 'ru');
    await page.waitForTimeout(500);
    const savedMsg = page.locator('#saved-msg');
    await expect(savedMsg).toHaveClass(/visible/);
  });

  test('2.3 Changing theme saves and applies style', async () => {
    await page.selectOption('#theme-select', 'dark');
    await page.waitForTimeout(500);
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('theme-dark')
    );
    expect(hasDark).toBe(true);

    await page.selectOption('#theme-select', 'light');
    await page.waitForTimeout(500);
    const hasLight = await page.evaluate(() =>
      document.documentElement.classList.contains('theme-light')
    );
    expect(hasLight).toBe(true);

    await page.selectOption('#theme-select', 'auto');
    await page.waitForTimeout(500);
    const hasAny = await page.evaluate(() =>
      document.documentElement.classList.contains('theme-light') ||
      document.documentElement.classList.contains('theme-dark')
    );
    expect(hasAny).toBe(false);
  });

  test('2.4 Settings persist after page reload', async () => {
    await page.selectOption('#default-encoding-select', 'windows-1251');
    await page.waitForTimeout(300);
    await page.selectOption('#theme-select', 'dark');
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForTimeout(1000);

    expect(await page.locator('#default-encoding-select').inputValue()).toBe('windows-1251');
    expect(await page.locator('#theme-select').inputValue()).toBe('dark');
  });

  test('2.5 Work mode radio buttons work', async () => {
    await page.locator('input[name="workMode"][value="popup"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('input[name="workMode"]:checked').inputValue()).toBe('popup');

    await page.locator('input[name="workMode"][value="tab"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('input[name="workMode"]:checked').inputValue()).toBe('tab');
  });
});
