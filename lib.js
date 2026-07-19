// --- Custom i18n system for runtime language switching ---
let _customMessages = null;

// eslint-disable-next-line no-redeclare
function _getMessage(key, placeholders) {
  if (_customMessages && _customMessages[key]) {
    let msg = _customMessages[key].message;
    // Replace named placeholders ($NAME$)
    if (_customMessages[key].placeholders) {
      for (const [name, ph] of Object.entries(_customMessages[key].placeholders)) {
        const contentKey = ph.content; // e.g. "$1"
        const idx = parseInt(contentKey.replace('$', ''), 10) - 1;
        const value = (placeholders && placeholders[idx] !== undefined) ? placeholders[idx] : '';
        msg = msg.replace(new RegExp(`\\$${name}\\$`, 'g'), value);
      }
    }
    // Replace positional placeholders ($1, $2, ...)
    if (placeholders) {
      placeholders.forEach((val, i) => {
        msg = msg.replace(new RegExp(`\\${'$' + (i + 1)}`, 'g'), val);
      });
    }
    return msg;
  }
  return chrome.i18n.getMessage(key, placeholders);
}

// eslint-disable-next-line no-redeclare
function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = _getMessage(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    el.innerHTML = _getMessage(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    el.title = _getMessage(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    el.placeholder = _getMessage(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
    el.alt = _getMessage(el.dataset.i18nAlt);
  });
}

// eslint-disable-next-line no-unused-vars, no-redeclare
async function setLanguage(lang) {
  if (!lang || lang === 'system') {
    _customMessages = null;
  } else {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    try {
      const response = await fetch(url);
      _customMessages = await response.json();
    } catch {
      _customMessages = null;
    }
  }
  initI18n();
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function copyToClipboard(value) {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText && typeof value === 'string') {
    return navigator.clipboard.writeText(value);
  }
  if (navigator && navigator.clipboard && navigator.clipboard.write && typeof value === 'object') {
    return navigator.clipboard.write(value);
  }
  return Promise.reject('The Clipboard API is not available.');
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function getDataUrlSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return '0.00';
  const base64String = dataUrl.split(',')[1];
  if (!base64String) return '0.00';
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  return ((base64String.length * 3 / 4 - padding) / 1000).toFixed(2);
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function pasteFromClipboard() {
  if (navigator && navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText();
  }
  return Promise.reject('The Clipboard API is not available.');
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      return resolve(reader.result);
    };
    reader.onerror = function (error) {
      return reject(error);
    };
  });
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// eslint-disable-next-line no-redeclare
function base64UrlDecode(str) {
  str = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function isJWT(str) {
  const parts = str.split('.');
  if (parts.length === 3) {
    try {
      base64UrlDecode(parts[0]);
      base64UrlDecode(parts[1]);
      JSON.parse(base64UrlDecode(parts[1]));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function isJSON(str) {
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      JSON.parse(str);
    } catch {
      return false;
    }
    return true;
  }
  return false;
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function isBase64(str, options) {
  try {
    let data = str;
    if (options && options.allowMime) {
      data = str.replace(/data:.+?;base64,/, '');
    }
    return data.length > 3 && !(data.length % 4) && atob(data) && true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function trimQuotes(str) {
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

// eslint-disable-next-line no-redeclare
function decodeBase64WithEncoding(base64, encoding) {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder(encoding).decode(bytes);
}

// eslint-disable-next-line no-unused-vars
function encodeBase64WithEncoding(text, encoding) {
  const encoder = new TextEncoder();
  if (encoding === 'utf-8' || encoding === 'utf8') {
    return btoa(String.fromCharCode(...encoder.encode(text)));
  }
  // For non-UTF8 encodings, use a fallback approach
  try {
    // Try to encode using the standard approach first
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return btoa(text);
  }
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function autoDetectEncoding(base64) {
  try {
    const bytes = atob(base64);
    // Check for UTF-8 BOM
    if (bytes.startsWith('\xEF\xBB\xBF')) return 'utf-8';
    // Try UTF-8 first
    try {
      decodeURIComponent(escape(atob(base64)));
      // Quick heuristic: count high bytes to decide if it's likely UTF-8
      let highBytes = 0;
      for (let i = 0; i < bytes.length; i++) {
        if (bytes.charCodeAt(i) > 127) highBytes++;
      }
      if (highBytes === 0) return 'utf-8';
      // Try to decode with UTF-8 and see if it produces valid text
      const decoded = decodeBase64WithEncoding(base64, 'utf-8');
      // Check for replacement characters which indicate encoding mismatch
      if (!decoded.includes('\uFFFD')) return 'utf-8';
    } catch { /* fall through */ }
    // Default to windows-1251 for Cyrillic
    return 'windows-1251';
  } catch {
    return 'utf-8';
  }
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function minifyJSON(str) {
  try {
    return JSON.stringify(JSON.parse(str));
  } catch {
    return str;
  }
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function prettyJSON(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

// eslint-disable-next-line no-unused-vars, no-redeclare
function saveAs(data, filename) {
  if (data instanceof Blob) {
    data = URL.createObjectURL(data);
  }
  const a = document.createElement('a');
  a.href = data;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke blob URL after a short delay
  if (data.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(data), 10000);
  }
}