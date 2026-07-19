import { vi } from 'vitest';

// Mock chrome.storage.sync
const storageMock = {
  data: {},
  get: vi.fn((keys, callback) => {
    if (typeof keys === 'string') keys = [keys];
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        result[key] = storageMock.data[key];
      });
    }
    if (callback) callback(result);
    return Promise.resolve(result);
  }),
  set: vi.fn((items, callback) => {
    Object.assign(storageMock.data, items);
    if (callback) callback();
    return Promise.resolve();
  }),
};

// Mock chrome.i18n
const i18nMock = {
  getMessage: vi.fn((key, placeholders) => {
    const messages = {
      appName: 'Base64Coder',
      appDescription: 'Base64 decode/encode extension',
      btn_copy: 'copy',
      btn_save: 'save',
      btn_clear: 'clear',
      btn_clearStar: 'clear*',
      btn_copyStar: 'copy*',
      btn_saveStar: 'save*',
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
      placeholder_source: 'Enter text or base64...',
      placeholder_result: 'Result...',
      audio_notSupported: 'Your browser does not support the $ELEMENT$ element.',
      imageInfo_size: 'Size:',
      imageInfo_resolution: 'Resolution:',
      imageInfo_unit_kb: 'KB',
      imageInfo_unit_px: 'px',
      alt_corruptedFile: 'CORRUPTED FILE IMAGE',
      alert_videoNotSupported: 'Video is not supported yet.',
      alert_resultNotCopyable: 'Result of $TYPE$ type is not copyable.',
      json_filename: 'data.json',
      text_filename: 'text.txt',
      image_png_filename: 'image.png',
      image_jpeg_filename: 'image.jpeg',
      audio_filename: 'audio.mp3',
      badge_done: 'DONE',
      badge_error: 'ERR',
      badge_wait: 'WAIT',
      contextMenu_base64ToText: 'copy base64 ➜ text',
      contextMenu_textToBase64: 'copy text ➜ base64',
      contextMenu_imageToBase64: 'copy image ➜ base64',
      contextMenu_openBase64: 'open base64',
      omnibox_description: 'Base64Coder',
      omnibox_base64ToText: 'base64 ➜ text',
      omnibox_textToBase64: 'text ➜ base64',
      title_sourcePretty: 'Format JSON in source',
      title_sourceMinify: 'Minify JSON in source',
      title_openFile: '[ Ctrl + O ] Select file to encode',
      title_copySource: 'Copy source value',
      title_pasteSource: 'Paste value from clipboard',
      title_clearSource: 'Clear source value',
      title_decodeBtn: '[ Alt + 1 ] Convert to text',
      title_encodeBtn: '[ Alt + 2 ] Convert to base64',
      title_decodeJwtBtn: '[ Alt + 3 ] Decode JWT',
      title_decodeImageBtn: '[ Alt + 4 ] Convert to image',
      title_decodeAudioBtn: '[ Alt + 5 ] Convert to audio',
      title_decodeVideoBtn: '[ Alt + 6 ] Convert to video',
      title_beautifyBtn: 'Format JSON value',
      title_minifyBtn: 'Minify JSON value',
      title_copyResult: 'Copy result',
      title_saveResult: 'Save result',
      title_clearResult: 'Clear result',
      title_swapBtn: 'Swap source and result',
      title_settings: 'Settings',
      title_faq: 'FAQ',
      title_extensionPage: 'Open extension page',
    };
    if (messages[key]) {
      let msg = messages[key];
      // Handle placeholders
      if (placeholders && Array.isArray(placeholders)) {
        for (let i = 0; i < placeholders.length; i++) {
          // Handle $ELEMENT$, $TYPE$ etc by checking placeholder mapping
          // For simplicity, replace $1, $2 etc
          msg = msg.replace(`$${i + 1}`, placeholders[i]);
        }
      }
      return msg;
    }
    return key;
  }),
  getUILanguage: vi.fn(() => 'en'),
};

// Mock chrome.runtime
const runtimeMock = {
  id: 'test-extension-id',
  getURL: vi.fn((path) => `chrome-extension://test-extension-id/${path}`),
  onMessage: { addListener: vi.fn() },
  onInstalled: { addListener: vi.fn() },
  onStartup: { addListener: vi.fn() },
  openOptionsPage: vi.fn(),
  sendMessage: vi.fn(),
  lastError: undefined,
};

// Mock chrome.action
const actionMock = {
  setPopup: vi.fn(() => Promise.resolve()),
  setBadgeText: vi.fn(),
  setBadgeBackgroundColor: vi.fn(),
  getBadgeText: vi.fn(() => Promise.resolve('')),
  onClicked: { addListener: vi.fn() },
};

// Mock chrome.tabs
const tabsMock = {
  create: vi.fn(),
  sendMessage: vi.fn(),
  query: vi.fn(),
};

// Mock chrome.contextMenus
const contextMenusMock = {
  create: vi.fn((_opts, cb) => { if (cb) cb(); }),
  removeAll: vi.fn((cb) => { if (cb) cb(); }),
  onClicked: { addListener: vi.fn() },
};

// Mock chrome.omnibox
const omniboxMock = {
  onInputEntered: { addListener: vi.fn() },
  onInputChanged: { addListener: vi.fn() },
  setDefaultSuggestion: vi.fn(),
};

// Suppress unhandled rejections from clipboard API in test environment
process.on('unhandledRejection', (reason) => {
  if (reason === 'The Clipboard API is not available.') {
    return; // expected in jsdom
  }
});

// Set up global chrome mock
global.chrome = {
  storage: {
    sync: storageMock,
    local: { ...storageMock, data: {} },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  i18n: i18nMock,
  runtime: runtimeMock,
  action: actionMock,
  tabs: tabsMock,
  contextMenus: contextMenusMock,
  omnibox: omniboxMock,
};
