import { test, expect } from '@playwright/test';
import { createExtensionContext, openPage } from './setup.mjs';
import { typeText, clickBtn, getText } from './helpers.mjs';

test.describe('Convert page (convert/index.html)', () => {
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
    page = await openPage(context, baseUrl, 'convert/index.html');
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    if (page) await page.close().catch(() => {});
  });

  test('1.1 Page loads with source textarea and convert buttons', async () => {
    await expect(page.locator('#source')).toBeVisible();
    await expect(page.locator('#encode-btn')).toBeVisible();
    await expect(page.locator('#decode-btn')).toBeVisible();
    await expect(page.locator('#decode-jwt-btn')).toBeVisible();
    await expect(page.locator('#result')).toBeVisible();
  });

  test('1.2 Encoding text to base64', async () => {
    await typeText(page, 'source', 'hello');
    await page.waitForTimeout(300);
    await clickBtn(page, 'encode-btn');
    await page.waitForTimeout(500);
    const resultText = await page.locator('#result').innerText();
    expect(resultText).toBe('aGVsbG8=');
  });

  test('1.3 Decoding base64 to text', async () => {
    await typeText(page, 'source', 'aGVsbG8=');
    await page.waitForTimeout(300);
    await clickBtn(page, 'decode-btn');
    await page.waitForTimeout(500);
    const resultText = await page.locator('#result').innerText();
    expect(resultText).toBe('hello');
  });

  test('1.4 JWT decoding', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await typeText(page, 'source', jwt);
    await page.waitForTimeout(300);
    await clickBtn(page, 'decode-jwt-btn');
    await page.waitForTimeout(500);
    const resultText = await page.locator('#result').innerText();
    expect(resultText).toContain('"sub"');
    expect(resultText).toContain('"name"');
    expect(resultText).toContain('John Doe');
  });

  test('1.5 Swap button exchanges source and result', async () => {
    await typeText(page, 'source', 'hello');
    await page.waitForTimeout(300);
    await clickBtn(page, 'encode-btn');
    await page.waitForTimeout(500);

    const sourceBefore = await page.locator('#source').inputValue();
    const resultBefore = await page.locator('#result').innerText();

    await clickBtn(page, 'swap-btn');
    await page.waitForTimeout(500);

    expect(await page.locator('#source').inputValue()).toBe(resultBefore);
    expect(await page.locator('#result').innerText()).toBe(sourceBefore);
  });

  test('1.6 Pretty and Minify JSON buttons', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await typeText(page, 'source', jwt);
    await page.waitForTimeout(300);
    await clickBtn(page, 'decode-jwt-btn');
    await page.waitForTimeout(500);

    const prettyBtn = page.locator('#beautify-result');
    if (await prettyBtn.isVisible()) {
      await prettyBtn.click();
      await page.waitForTimeout(300);
      expect(await page.locator('#result').innerText()).toContain('\n');
    }

    const minifyBtn = page.locator('#minify-result');
    if (await minifyBtn.isVisible()) {
      await minifyBtn.click();
      await page.waitForTimeout(300);
      expect(await page.locator('#result').innerText()).not.toContain('\n  ');
    }
  });

  test('1.7 Result action buttons present', async () => {
    await expect(page.locator('#copy-result')).toBeVisible();
    await expect(page.locator('#save-result')).toBeVisible();
    await expect(page.locator('#clear-result')).toBeVisible();
  });

  test('1.8 Encoding selector visible after decode', async () => {
    await typeText(page, 'source', 'aGVsbG8=');
    await page.waitForTimeout(300);
    await clickBtn(page, 'decode-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#encoding-select')).toBeVisible();
  });

  test('1.9 Source character count updates', async () => {
    await typeText(page, 'source', 'hello world');
    await page.waitForTimeout(300);
    expect(await getText(page, 'source-text-length')).toContain('11');
  });
});
