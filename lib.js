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
  const base64String = dataUrl.split(',')[1];
  return ((base64String.length * 3 / 4 - (base64String.endsWith('==') ? 2 : 1)) / 1000).toFixed(2);
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
    } catch (e) {
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
    } catch (e) {
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
function isBase64(str) {
  return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/g.test(str);
}