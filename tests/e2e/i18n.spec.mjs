import { test, expect } from '@playwright/test';
import { createExtensionContext, openPage } from './setup.mjs';

test.describe('i18n and Theme switching across pages', () => {
  let server;
  let browser;
  let context;
  let baseUrl;

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

  test.describe('Language switching', () => {
    test('4.1 Options page language select is functional', async () => {
      const page = await openPage(context, baseUrl, 'options/index.html');
      await page.waitForTimeout(1000);

      await expect(page.locator('#language-select')).toBeVisible();
      await page.selectOption('#language-select', 'ru');
      await page.waitForTimeout(500);

      const savedMsg = page.locator('#saved-msg');
      await expect(savedMsg).toHaveClass(/visible/);

      await page.close().catch(() => {});
    });

    test('4.2 Convert page reflects stored language', async () => {
      // Set language to Russian
      const optsPage = await openPage(context, baseUrl, 'options/index.html');
      await optsPage.waitForTimeout(1000);
      await optsPage.selectOption('#language-select', 'ru');
      await optsPage.waitForTimeout(1000);
      await optsPage.close().catch(() => {});

      // Open convert page
      const page = await openPage(context, baseUrl, 'convert/index.html');
      await page.waitForTimeout(1000);

      const sourcePlaceholder = await page.locator('#source').getAttribute('placeholder');
      expect(sourcePlaceholder).toBeTruthy();
      expect(sourcePlaceholder).not.toBe('Enter your text or drop your file.');

      await page.close().catch(() => {});
    });

    test('4.3 Reset language to system default', async () => {
      const page = await openPage(context, baseUrl, 'options/index.html');
      await page.waitForTimeout(1000);
      await page.selectOption('#language-select', 'system');
      await page.waitForTimeout(500);
      await page.close().catch(() => {});
    });
  });

  test.describe('Theme switching', () => {
    test('4.4 Setting theme persists to popup', async () => {
      const optsPage = await openPage(context, baseUrl, 'options/index.html');
      await optsPage.waitForTimeout(1000);
      await optsPage.selectOption('#theme-select', 'dark');
      await optsPage.waitForTimeout(500);
      await optsPage.close().catch(() => {});

      const popupPage = await openPage(context, baseUrl, 'popup/index.html');
      await popupPage.waitForTimeout(1000);

      const hasDark = await popupPage.evaluate(() =>
        document.documentElement.classList.contains('theme-dark')
      );
      expect(hasDark).toBe(true);
      await popupPage.close().catch(() => {});
    });

    test('4.5 Setting theme persists to convert page', async () => {
      const optsPage = await openPage(context, baseUrl, 'options/index.html');
      await optsPage.waitForTimeout(1000);
      await optsPage.selectOption('#theme-select', 'light');
      await optsPage.waitForTimeout(500);
      await optsPage.close().catch(() => {});

      const page = await openPage(context, baseUrl, 'convert/index.html');
      await page.waitForTimeout(1000);

      const hasLight = await page.evaluate(() =>
        document.documentElement.classList.contains('theme-light')
      );
      expect(hasLight).toBe(true);
      await page.close().catch(() => {});
    });

    test('4.6 Setting theme persists to FAQ page', async () => {
      const optsPage = await openPage(context, baseUrl, 'options/index.html');
      await optsPage.waitForTimeout(1000);
      await optsPage.selectOption('#theme-select', 'dark');
      await optsPage.waitForTimeout(500);
      await optsPage.close().catch(() => {});

      const page = await openPage(context, baseUrl, 'faq/index.html');
      await page.waitForTimeout(1000);

      const hasDark = await page.evaluate(() =>
        document.documentElement.classList.contains('theme-dark')
      );
      expect(hasDark).toBe(true);
      await page.close().catch(() => {});
    });
  });

  test.describe('Cross-page consistency', () => {
    test('4.7 Options page loads with all settings after page refresh', async () => {
      const page = await openPage(context, baseUrl, 'options/index.html');
      await page.waitForTimeout(1000);

      await page.selectOption('#language-select', 'de');
      await page.waitForTimeout(300);
      await page.selectOption('#theme-select', 'dark');
      await page.waitForTimeout(300);
      await page.selectOption('#default-encoding-select', 'koi8-r');
      await page.waitForTimeout(300);

      await page.reload();
      await page.waitForTimeout(1000);

      expect(await page.locator('#language-select').inputValue()).toBe('de');
      expect(await page.locator('#theme-select').inputValue()).toBe('dark');
      expect(await page.locator('#default-encoding-select').inputValue()).toBe('koi8-r');

      await page.close().catch(() => {});
    });
  });
});
