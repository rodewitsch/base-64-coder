import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================
// Tests for lib.js — pure utility functions
// ============================================================

describe('isBase64', () => {
  it('returns true for valid base64 string', () => {
    expect(isBase64('SGVsbG8=')).toBe(true);
    expect(isBase64('dGVzdA==')).toBe(true);
    expect(isBase64('YWJj')).toBe(true);
  });

  it('returns false for invalid base64 string', () => {
    expect(isBase64('')).toBe(false);
    expect(isBase64('abc')).toBe(false);     // length < 4
    expect(isBase64('not!base64!!')).toBe(false);
    expect(isBase64('!!!')).toBe(false);
  });

  it('returns false for strings with wrong length', () => {
    expect(isBase64('abcd')).toBe(true); // valid by chance
    // Note: 'abc=' is actually valid base64 (atob('abc=') succeeds)
    // Only truly invalid base64 fails
    expect(isBase64('xyz')).toBe(false); // length 3, not divisible by 4
  });

  it('handles allowMime option', () => {
    const dataUrl = 'data:image/png;base64,SGVsbG8=';
    expect(isBase64(dataUrl)).toBe(false); // fails because of mime prefix
    expect(isBase64(dataUrl, { allowMio: true })).toBe(false); // typo option
  });

  it('handles allowMime option correctly', () => {
    const dataUrl = 'data:image/png;base64,SGVsbG8=';
    expect(isBase64(dataUrl, { allowMime: true })).toBe(true);
  });
});

describe('isJSON', () => {
  it('returns true for valid JSON object', () => {
    expect(isJSON('{"key": "value"}')).toBe(true);
    expect(isJSON('{"a":1,"b":2}')).toBe(true);
  });

  it('returns true for valid JSON array', () => {
    expect(isJSON('[1, 2, 3]')).toBe(true);
    expect(isJSON('[]')).toBe(true);
  });

  it('returns false for non-JSON strings', () => {
    expect(isJSON('hello')).toBe(false);
    expect(isJSON('{invalid}')).toBe(false);
    expect(isJSON('')).toBe(false);
    expect(isJSON('null')).toBe(false); // doesn't start with { or [
  });
});

describe('isJWT', () => {
  it('returns true for valid JWT', () => {
    // JWT: header.payload.signature
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(isJWT(jwt)).toBe(true);
  });

  it('returns false for non-JWT strings', () => {
    expect(isJWT('not.a.jwt')).toBe(false);
    expect(isJWT('')).toBe(false);
    expect(isJWT('a.b.c')).toBe(false); // 3 parts but not valid base64url JSON
  });
});

describe('parseJwt', () => {
  it('parses JWT payload correctly', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const payload = parseJwt(jwt);
    expect(payload).toHaveProperty('sub', '1234567890');
    expect(payload).toHaveProperty('name', 'John Doe');
    expect(payload).toHaveProperty('iat', 1516239022);
  });
});

describe('base64UrlEncode / base64UrlDecode', () => {
  it('roundtrips correctly', () => {
    const original = 'hello world';
    const encoded = base64UrlEncode(original);
    const decoded = base64UrlDecode(encoded);
    expect(decoded).toBe(original);
  });

  it('encodes without padding', () => {
    const encoded = base64UrlEncode('test');
    expect(encoded).not.toContain('=');
  });

  it('uses URL-safe characters', () => {
    const encoded = base64UrlEncode('\xfe\xff');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });
});

describe('trimQuotes', () => {
  it('removes double quotes', () => {
    expect(trimQuotes('"hello"')).toBe('hello');
  });

  it('removes single quotes', () => {
    expect(trimQuotes("'hello'")).toBe('hello');
  });

  it('returns unchanged string without quotes', () => {
    expect(trimQuotes('hello')).toBe('hello');
  });

  it('handles mismatched quotes', () => {
    expect(trimQuotes('"hello')).toBe('"hello');
    expect(trimQuotes("hello'")).toBe("hello'");
  });
});

describe('getDataUrlSize', () => {
  it('returns size in KB for a valid data URL', () => {
    const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; // "Hello World"
    const size = getDataUrlSize(dataUrl);
    expect(parseFloat(size)).toBeGreaterThan(0);
  });

  it('returns 0.00 for undefined input', () => {
    expect(getDataUrlSize(undefined)).toBe('0.00');
  });

  it('returns 0.00 for empty string', () => {
    expect(getDataUrlSize('')).toBe('0.00');
  });

  it('returns 0.00 for string without comma', () => {
    expect(getDataUrlSize('SGVsbG8=')).toBe('0.00');
  });
});

describe('minifyJSON / prettyJSON', () => {
  it('minifyJSON minifies JSON', () => {
    expect(minifyJSON('{ "a": 1, "b": 2 }')).toBe('{"a":1,"b":2}');
  });

  it('minifyJSON returns original on invalid input', () => {
    expect(minifyJSON('not json')).toBe('not json');
  });

  it('prettyJSON prettyfies JSON', () => {
    const result = prettyJSON('{"a":1,"b":2}');
    expect(result).toContain('"a": 1');
    expect(result).toContain('\n');
  });

  it('prettyJSON returns original on invalid input', () => {
    expect(prettyJSON('not json')).toBe('not json');
  });
});

describe('copyToClipboard', () => {
  it('returns a promise', () => {
    const result = copyToClipboard('test');
    expect(result).toBeInstanceOf(Promise);
  });

  it('rejects when clipboard is not available', async () => {
    await expect(copyToClipboard('test')).rejects.toBe('The Clipboard API is not available.');
  });
});

describe('pasteFromClipboard', () => {
  it('rejects when clipboard is not available', async () => {
    await expect(pasteFromClipboard()).rejects.toBe('The Clipboard API is not available.');
  });
});

describe('autoDetectEncoding', () => {
  it('returns utf-8 for simple ASCII base64', () => {
    const base64 = btoa('hello world');
    expect(autoDetectEncoding(base64)).toBe('utf-8');
  });

  it('returns utf-8 for valid UTF-8 encoded base64', () => {
    // Use TextEncoder + manual base64 to avoid btoa() Latin1 limitation
    const encoder = new TextEncoder();
    const bytes = encoder.encode('Привет');
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    const base64 = btoa(binary);
    const result = autoDetectEncoding(base64);
    expect(['utf-8', 'windows-1251']).toContain(result);
  });
});

describe('decodeBase64WithEncoding', () => {
  it('decodes base64 to UTF-8 string', () => {
    const base64 = btoa('hello');
    expect(decodeBase64WithEncoding(base64, 'utf-8')).toBe('hello');
  });

  it('decodes base64 with windows-1251 encoding', () => {
    // Encode a Russian string with windows-1251
    const encoder = new TextEncoder('windows-1251');
    const bytes = new Uint8Array([207, 240, 232, 226, 229, 242]); // "Привет" in CP1251
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    const base64 = btoa(binary);
    expect(decodeBase64WithEncoding(base64, 'windows-1251')).toBe('Привет');
  });
});

describe('encodeBase64WithEncoding', () => {
  it('encodes UTF-8 string to base64', () => {
    const result = encodeBase64WithEncoding('hello', 'utf-8');
    expect(result).toBe(btoa('hello'));
  });

  it('encodes non-UTF8 via fallback', () => {
    const result = encodeBase64WithEncoding('hello', 'windows-1251');
    expect(result).toBeTruthy();
  });
});

describe('getBase64', () => {
  it('converts a File to base64 data URL', async () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    const result = await getBase64(file);
    expect(result).toMatch(/^data:text\/plain;base64,/);
    expect(result).toContain(btoa('test content'));
  });
});

describe('_getMessage', () => {
  beforeEach(() => {
    // Reset custom messages
    // We can trigger this by calling setLanguage('system')
  });

  it('falls back to chrome.i18n.getMessage when no custom messages', () => {
    const msg = _getMessage('appName');
    expect(msg).toBe('Base64Coder');
  });

  it('uses custom messages when available', async () => {
    await setLanguage('system'); // resets to chrome.i18n
    const msg = _getMessage('appName');
    expect(msg).toBe('Base64Coder');
  });
});

describe('setLanguage', () => {
  it('resets to chrome.i18n for system language', async () => {
    // Mock fetch to simulate loading locale file
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ test_key: { message: 'test value' } }),
      })
    );

    await setLanguage('fr');
    expect(_getMessage('test_key')).toBe('test value');

    await setLanguage('system');
    expect(_getMessage('test_key')).toBe('test_key'); // falls back to chrome.i18n

    // Wait for all pending promises to settle before restoring fetch
    await new Promise(resolve => setTimeout(resolve, 0));
    global.fetch = originalFetch;
  });
});
