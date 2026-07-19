document.addEventListener('DOMContentLoaded', () => {
  const source = document.getElementById('source');
  const result = document.getElementById('result');
  const encodingSelect = document.getElementById('encoding-select');
  const decodeBtn = document.getElementById('decode-btn');
  const encodeBtn = document.getElementById('encode-btn');
  const decodeJwtBtn = document.getElementById('decode-jwt-btn');
  const swapBtn = document.getElementById('swap-btn');
  const copyResultBtn = document.getElementById('copy-result');
  const prettyResultBtn = document.getElementById('pretty-result');
  const minifyResultBtn = document.getElementById('minify-result');
  const clearAllBtn = document.getElementById('clear-all');
  const openFullBtn = document.getElementById('open-full');
  const settingsBtn = document.getElementById('settings-btn');

  let resultType = 'text';

  // Load saved settings
  chrome.storage.sync.get(['popupMode', 'encoding', 'language', 'theme'], (data) => {
    if (data.encoding) encodingSelect.value = data.encoding;
    applyPopupTheme(data.theme || 'auto');
    setLanguage(data.language || 'system');
  });

  function applyPopupTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
    // 'auto' — no class, relies on @media (prefers-color-scheme)
  }

  function setActiveBtn(btn) {
    [decodeBtn, encodeBtn, decodeJwtBtn].forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function activateBtns() {
    const val = source.value.trim();
    if (val) {
      decodeBtn.disabled = false;
      encodeBtn.disabled = false;

      if (isJWT(val)) {
        decodeJwtBtn.disabled = false;
      } else {
        decodeJwtBtn.disabled = true;
      }

      if (!isBase64(val.replace(/data:.+?;base64,/, ''))) {
        decodeBtn.disabled = true;
      }
    } else {
      decodeBtn.disabled = true;
      encodeBtn.disabled = true;
      decodeJwtBtn.disabled = true;
    }

    if (result.value) {
      copyResultBtn.disabled = false;
      if (isJSON(result.value)) {
        prettyResultBtn.style.display = 'inline-flex';
        minifyResultBtn.style.display = 'inline-flex';
      } else {
        prettyResultBtn.style.display = 'none';
        minifyResultBtn.style.display = 'none';
      }
    } else {
      copyResultBtn.disabled = true;
      prettyResultBtn.style.display = 'none';
      minifyResultBtn.style.display = 'none';
    }
  }

  decodeBtn.onclick = () => {
    let base64 = source.value.replace(/data:.+?;base64,/, '').trim();
    base64 = trimQuotes(base64);

    const encoding = encodingSelect.value;
    try {
      if (encoding === 'auto') {
        const detected = autoDetectEncoding(base64);
        result.value = decodeBase64WithEncoding(base64, detected);
      } else {
        result.value = decodeBase64WithEncoding(base64, encoding);
      }
    } catch {
      try {
        result.value = decodeURIComponent(atob(base64));
      } catch {
        result.value = atob(base64);
      }
    }
    resultType = 'text';
    setActiveBtn(decodeBtn);
    activateBtns();
  };

  encodeBtn.onclick = () => {
    const text = source.value;
    let encodedText;
    try {
      encodedText = btoa(text);
    } catch {
      encodedText = btoa(encodeURIComponent(text));
    }
    result.value = encodedText;
    resultType = 'base64';
    setActiveBtn(encodeBtn);
    activateBtns();
  };

  decodeJwtBtn.onclick = () => {
    result.value = JSON.stringify(parseJwt(source.value));
    resultType = 'text';
    setActiveBtn(decodeJwtBtn);
    activateBtns();
  };

  swapBtn.onclick = () => {
    const srcVal = source.value;
    source.value = result.value;
    result.value = srcVal;

    // Swap the active button
    if (resultType === 'text') {
      resultType = 'base64';
      setActiveBtn(encodeBtn);
    } else if (resultType === 'base64') {
      resultType = 'text';
      setActiveBtn(decodeBtn);
    }

    activateBtns();
  };

  copyResultBtn.onclick = () => copyToClipboard(result.value);

  prettyResultBtn.onclick = () => {
    if (isJSON(result.value)) {
      result.value = prettyJSON(result.value);
    }
  };

  minifyResultBtn.onclick = () => {
    if (isJSON(result.value)) {
      result.value = minifyJSON(result.value);
    }
  };

  clearAllBtn.onclick = () => {
    source.value = '';
    result.value = '';
    resultType = 'text';
    setActiveBtn(null);
    activateBtns();
  };

  source.oninput = () => activateBtns();

  openFullBtn.onclick = () => {
    const text = source.value ? encodeURIComponent(source.value) : '';
    chrome.tabs.create({ url: chrome.runtime.getURL(`convert/index.html${text ? '?text=' + text : ''}`) });
  };

  settingsBtn.onclick = () => {
    chrome.runtime.openOptionsPage();
  };

  // Init
  source.focus();
});
