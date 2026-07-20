import { test, expect } from '@playwright/test';
import { createExtensionContext, openPage } from './setup.mjs';
import { typeText, clickBtn } from './helpers.mjs';

test.describe('Popup page (popup/index.html)', () => {
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
    page = await openPage(context, baseUrl, 'popup/index.html');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    if (page) await page.close().catch(() => {});
  });

  test('3.1 Popup loads with source and result textareas', async () => {
    await expect(page.locator('#source')).toBeVisible();
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#decode-btn')).toBeVisible();
    await expect(page.locator('#encode-btn')).toBeVisible();
    await expect(page.locator('#swap-btn')).toBeVisible();
  });

  test('3.2 Encoding text to base64', async () => {
    await typeText(page, 'source', 'test');
    await page.waitForTimeout(300);
    await clickBtn(page, 'encode-btn');
    await page.waitForTimeout(500);
    const resultValue = await page.locator('#result').inputValue();
    expect(resultValue).toBe('dGVzdA==');
  });

  test('3.3 Decoding base64 to text', async () => {
    await typeText(page, 'source', 'dGVzdA==');
    await page.waitForTimeout(300);
    await clickBtn(page, 'decode-btn');
    await page.waitForTimeout(500);
    const resultValue = await page.locator('#result').inputValue();
    expect(resultValue).toBe('test');
  });

  test('3.4 Swap button exchanges source and result', async () => {
    await typeText(page, 'source', 'hello');
    await page.waitForTimeout(300);
    await clickBtn(page, 'encode-btn');
    await page.waitForTimeout(500);

    const sourceBefore = await page.locator('#source').inputValue();
    const resultBefore = await page.locator('#result').inputValue();

    await clickBtn(page, 'swap-btn');
    await page.waitForTimeout(500);

    expect(await page.locator('#source').inputValue()).toBe(resultBefore);
    expect(await page.locator('#result').inputValue()).toBe(sourceBefore);
  });

  test('3.5 Clear all button works', async () => {
    await typeText(page, 'source', 'test');
    await page.waitForTimeout(300);
    await clickBtn(page, 'encode-btn');
    await page.waitForTimeout(500);

    expect(await page.locator('#source').inputValue()).toBeTruthy();
    expect(await page.locator('#result').inputValue()).toBeTruthy();

    await clickBtn(page, 'clear-all');
    await page.waitForTimeout(300);

    expect(await page.locator('#source').inputValue()).toBe('');
    expect(await page.locator('#result').inputValue()).toBe('');
  });

  test('3.6 Encoding selector is present', async () => {
    await expect(page.locator('#encoding-select')).toBeVisible();
  });

  test('3.7 Settings and open-full buttons present', async () => {
    await expect(page.locator('#settings-btn')).toBeVisible();
    await expect(page.locator('#open-full')).toBeVisible();
  });

  test('3.8 Copy result button present', async () => {
    await expect(page.locator('#copy-result')).toBeVisible();
  });
});
