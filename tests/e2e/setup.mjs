import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// Shared storage for cross-page persistence in tests
const sharedStorage = {};

// Chrome API mock that gets injected into every page
const CHROME_MOCK = `
window.chrome = {
  i18n: {
    getMessage(key, placeholders) {
      const messages = {
        appName: 'Base64Coder',
        appDescription: 'Base64 decode/encode extension',
        btn_copy: 'copy',
        btn_save: 'save',
        btn_clear: 'clear',
        btn_text: 'text',
        btn_base64: 'base64',
        btn_jwt: 'jwt',
        btn_image: 'image',
        btn_audio: 'audio',
        btn_video: 'video',
        btn_pretty: 'pretty',
        btn_minify: 'minify',
        btn_file: 'file',
        btn_paste: 'paste',
        btn_swap: 'swap',
        encoding_auto: 'auto',
        chars_zero: '0 characters',
        chars_one: 'character',
        chars_many: 'characters',
        placeholder_source: 'Enter your text or drop your file.',
        placeholder_result: 'Result will appear here...',
        audio_notSupported: 'Your browser does not support the audio element.',
        options_saved: 'Settings saved',
        options_title: 'Base64Coder Settings',
        options_language: 'Language',
        options_theme: 'Theme',
        options_workMode: 'Work Mode',
        options_defaultEncoding: 'Default Encoding',
        options_languageSystem: 'System default',
        options_themeAuto: 'Automatic (system)',
        options_themeLight: 'Light',
        options_themeDark: 'Dark',
        options_workModeTab: 'Open in new tab (full page)',
        options_workModePopup: 'Work in popup window',
        label_source: 'Source:',
        label_convertTo: 'Convert to:',
        label_result: 'Result:',
        alt_corruptedFile: 'CORRUPTED FILE IMAGE',
        imageInfo_title: 'Image info',
        imageInfo_size: 'Size:',
        imageInfo_resolution: 'Resolution:',
        imageInfo_unit_kb: 'KB',
        imageInfo_unit_px: 'px',
        title_encodeBtn: 'Convert source value to base64',
        title_decodeBtn: 'Convert source value to text',
        title_decodeJwtBtn: 'Convert source value to parsed JWT',
        title_decodeImageBtn: 'Convert source base64 value to image',
        title_decodeAudioBtn: 'Convert source base64 value to audio',
        title_decodeVideoBtn: 'Convert source base64 value to video',
        title_swapBtn: 'Swap source and result',
        title_copyResult: 'Copy result value to clipboard',
        title_copySource: 'Copy source value',
        title_pasteSource: 'Paste value from clipboard',
        title_clearSource: 'Clear source value',
        title_clearResult: 'Clear result value',
        title_saveResult: 'Save result value to file',
        title_beautifyBtn: 'Format JSON value',
        title_minifyBtn: 'Minify JSON value',
        title_sourcePretty: 'Format JSON in source',
        title_sourceMinify: 'Minify JSON in source',
        title_openFile: 'Select file to encode in base64',
        title_settings: 'Settings',
        title_faq: 'FAQ',
        fileInfo_noFile: 'No file selected',
        dropOverlay_text: 'Drag & Drop to Upload File',
        json_filename: 'result.json',
        text_filename: 'result.txt',
        image_png_filename: 'image.png',
        image_jpeg_filename: 'image.jpg',
        audio_filename: 'audio.mp3',
        alert_videoNotSupported: 'Video save is not supported.',
        alert_resultNotCopyable: 'Cannot copy this result type.',
      };
      let msg = messages[key] || key;
      if (placeholders && Array.isArray(placeholders)) {
        placeholders.forEach((v, i) => { msg = msg.replace('$' + (i + 1), v); });
      }
      return msg;
    },
    getUILanguage: () => 'en',
  },
  runtime: {
    id: 'test-extension-id',
    getURL: (p) => '/' + p,
    onMessage: { addListener: () => {} },
    sendMessage: () => Promise.resolve(),
    openOptionsPage: () => {},
    lastError: undefined,
  },
  storage: {
    sync: {
      get(keys, cb) {
        const p = window.__storageGet(keys);
        if (cb) {
          if (typeof keys === 'string') keys = [keys];
          p.then(result => cb(result));
        }
        return p;
      },
      set(items, cb) {
        const p = window.__storageSet(items);
        if (cb) p.then(() => cb());
        return p;
      },
    },
    onChanged: { addListener: () => {} },
  },
  action: {
    setPopup: () => Promise.resolve(),
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
    getBadgeText: () => Promise.resolve(''),
    onClicked: { addListener: () => {} },
  },
  tabs: {
    create: () => {},
    sendMessage: () => Promise.resolve(),
    query: () => Promise.resolve([]),
  },
  contextMenus: {
    create: () => {},
    removeAll: (cb) => { if (cb) cb(); },
    onClicked: { addListener: () => {} },
  },
  omnibox: {
    onInputEntered: { addListener: () => {} },
    onInputChanged: { addListener: () => {} },
    setDefaultSuggestion: () => {},
  },
};
`;

/**
 * Start a simple static file server and return { server, url }
 */
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(ROOT, req.url === '/' ? 'convert/index.html' : req.url);
      // Security: prevent directory traversal
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
      };
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(data);
      });
    });
    server.listen(0, () => {
      const port = server.address().port;
      console.log('Test server on port', port);
      resolve({ server, url: `http://localhost:${port}` });
    });
  });
}

/**
 * Create a browser context and open a page with chrome API mocks.
 */
export async function createExtensionContext() {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  // Expose shared storage functions for cross-page persistence
  await context.exposeFunction('__storageGet', (keys) => {
    if (typeof keys === 'string') keys = [keys];
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach(k => { result[k] = sharedStorage[k]; });
    } else {
      Object.assign(result, sharedStorage);
    }
    return result;
  });
  await context.exposeFunction('__storageSet', (items) => {
    Object.assign(sharedStorage, items);
  });

  return { server, browser, context, baseUrl: url };
}

/**
 * Open a page with chrome API mocks injected.
 */
export async function openPage(context, baseUrl, pagePath) {
  const page = await context.newPage();
  await page.addInitScript(CHROME_MOCK);
  await page.goto(`${baseUrl}/${pagePath}`, { waitUntil: 'networkidle' });
  return page;
}

/**
 * Build an absolute URL.
 */
export function extUrl(baseUrl, pagePath) {
  return `${baseUrl}/${pagePath}`;
}
