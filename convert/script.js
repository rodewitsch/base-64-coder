document.onreadystatechange = function () {
  let resultType;
  const body = document.body;
  const dropOverlay = document.getElementById('drop-overlay');
  const dropOverlayImg = document.getElementById('drop-overlay-img');
  const dropOverlayText = document.getElementById('drop-overlay-text');
  const source = document.getElementById('source');
  const sourceTextLength = document.getElementById('source-text-length');
  const sourceFileInfo = document.getElementById('source-file-info');
  const sourceFileName = document.getElementById('source-file-name');
  const resultText = document.getElementById('result');
  const resultTextLength = document.getElementById('result-text-length');
  const resultTooltip = document.getElementById('result-tooltip');
  const resultImg = document.getElementById('result-img');
  const resultImgContainer = document.getElementById('result-img-container');
  const resultImgMeta = document.getElementById('result-img-meta');
  const resultImgResolution = document.getElementById('result-img-meta-resolution');
  const resultImgSize = document.getElementById('result-img-meta-size');
  const resultAudio = document.getElementById('result-audio');
  const resultVideo = document.getElementById('result-video');
  const resultVideoSource = document.getElementById('result-video-source');
  const openSourceFile = document.getElementById('open-source-file');
  const encodeBtn = document.getElementById('encode-btn');
  const decodeBtn = document.getElementById('decode-btn');
  const decodeJwtBtn = document.getElementById('decode-jwt-btn');
  const decodeImageBtn = document.getElementById('decode-image-btn');
  const decodeAudioBtn = document.getElementById('decode-audio-btn');
  const decodeVideoBtn = document.getElementById('decode-video-btn');
  const copyResultBtn = document.getElementById('copy-result');
  const copySourceBtn = document.getElementById('copy-source');
  const pasteSourceBtn = document.getElementById('paste-source');
  const clearSourceBtn = document.getElementById('clear-source');
  const clearResultBtn = document.getElementById('clear-result');
  const saveResultBtn = document.getElementById('save-result');
  const beautifyBtn = document.getElementById('beautify-result');
  const minifyBtn = document.getElementById('minify-result');
  const sourcePrettyBtn = document.getElementById('source-pretty');
  const sourceMinifyBtn = document.getElementById('source-minify');
  const swapBtn = document.getElementById('swap-btn');
  const encodingSelect = document.getElementById('encoding-select');
  const openExtensionPageBtn = document.getElementById('open-extension-page');
  const openFAQBtn = document.getElementById('open-faq');
  const openSettingsBtn = document.getElementById('open-settings');

  const query = new URLSearchParams(window.location.search);
  const text = query.get('text');
  let selectedFile;

  function applyConvertTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  }

  // Initialize i18n and theme for all data-i18n elements
  chrome.storage.sync.get(['language', 'theme'], async (data) => {
    applyConvertTheme(data.theme || 'auto');
    await setLanguage(data.language || 'system');

    // Set up audio fallback with i18n
    document.getElementById('result-audio-fallback').innerHTML =
      _getMessage('audio_notSupported', ['<code>audio</code>']);
  });

  // Set up image meta lines with i18n (child spans need IDs for dynamic updates)
  document.getElementById('img-meta-size-line').innerHTML =
    chrome.i18n.getMessage('imageInfo_size') + ' <span id="result-img-meta-size">0</span> ' + chrome.i18n.getMessage('imageInfo_unit_kb');
  document.getElementById('img-meta-resolution-line').innerHTML =
    chrome.i18n.getMessage('imageInfo_resolution') + ' <span id="result-img-meta-resolution"></span> ' + chrome.i18n.getMessage('imageInfo_unit_px');


  function setCurrentActiveConvertBtn(btn) {
    Array.from(document.querySelectorAll('.actions .active')).forEach((elem) => { elem.classList.remove('active'); })
    if (btn) btn.classList.add('active');
  }

  function setCurrentResultType(type) {
    resultType = type;
    switch (type) {
      case 'text': {
        resultText.style.display = 'block';
        resultTextLength.style.display = 'block';
        resultImgContainer.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultAudio.src = null;
        resultVideoSource.src = null;
        beautifyBtn.style.display = 'none';
        minifyBtn.style.display = 'none';
        encodingSelect.style.display = resultText.innerText ? 'inline-block' : 'none';

        if (isJSON(resultText.innerText)) {
          beautifyBtn.style.display = 'inline';
          minifyBtn.style.display = 'inline';
        }
        copyResultBtn.classList.remove('disabled');
        break;
      }
      case 'base64': {
        resultText.style.display = 'block';
        resultTextLength.style.display = 'block';
        resultImgContainer.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultAudio.src = null;
        resultVideoSource.src = null;

        beautifyBtn.style.display = 'none';
        minifyBtn.style.display = 'none';
        encodingSelect.style.display = 'none';
        copyResultBtn.classList.remove('disabled');
        break;
      }
      case 'image': {
        resultText.style.display = 'none';
        resultTextLength.style.display = 'none';
        resultImgMeta.style.display = 'none';
        resultImgContainer.style.display = 'flex';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultAudio.src = null;
        resultVideoSource.src = null;

        copyResultBtn.classList.add('disabled');
        encodingSelect.style.display = 'none';
        break;
      }
      case 'audio': {
        resultText.style.display = 'none';
        resultTextLength.style.display = 'none';
        resultImgContainer.style.display = 'none';
        resultAudio.style.display = 'block';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultVideoSource.src = null;

        copyResultBtn.classList.add('disabled');
        encodingSelect.style.display = 'none';
        break;
      }
      case 'video': {
        resultText.style.display = 'none';
        resultTextLength.style.display = 'none';
        resultImgContainer.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'block';
        resultImg.src = null;
        resultAudio.src = null;

        copyResultBtn.classList.add('disabled');
        encodingSelect.style.display = 'none';
        break;
      }
    }
  }

  function hasDataUrl(src) {
    return src && (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http'));
  }

  function isResult() {
    return (resultText.innerText && resultText.innerText !== '') ||
      hasDataUrl(resultImg.src) ||
      hasDataUrl(resultAudio.src) ||
      hasDataUrl(resultVideoSource.src);
  }

  function activateAvailableBtns() {
    setTimeout(() => {
      if (source.value) {
        decodeBtn.classList.remove('disabled');
        encodeBtn.classList.remove('disabled');

        if (isJWT(source.value)) {
          decodeJwtBtn.classList.remove('disabled');
        } else {
          decodeJwtBtn.classList.add('disabled');
        }

        if (isBase64(source.value.replace(/data:.+?;base64,/, ''))) {
          decodeImageBtn.classList.remove('disabled');
          decodeAudioBtn.classList.remove('disabled');
          decodeVideoBtn.classList.remove('disabled');
          decodeBtn.classList.remove('disabled');
        } else {
          decodeBtn.classList.add('disabled');
        }

        copySourceBtn.classList.remove('disabled');
        clearSourceBtn.classList.remove('disabled');

        if (isJSON(source.value)) {
          sourcePrettyBtn.style.display = 'inline';
          sourceMinifyBtn.style.display = 'inline';
        } else {
          sourcePrettyBtn.style.display = 'none';
          sourceMinifyBtn.style.display = 'none';
        }
      } else if (selectedFile) {
        decodeBtn.classList.add('disabled');
        encodeBtn.classList.remove('disabled');
        decodeImageBtn.classList.add('disabled');
        decodeAudioBtn.classList.add('disabled');
        decodeVideoBtn.classList.add('disabled');
        decodeJwtBtn.classList.add('disabled');

        pasteSourceBtn.classList.add('disabled');
        copySourceBtn.classList.add('disabled');
        clearSourceBtn.classList.remove('disabled');
        sourcePrettyBtn.style.display = 'none';
        sourceMinifyBtn.style.display = 'none';
      } else {
        decodeBtn.classList.add('disabled');
        encodeBtn.classList.add('disabled');
        decodeImageBtn.classList.add('disabled');
        decodeAudioBtn.classList.add('disabled');
        decodeVideoBtn.classList.add('disabled');
        decodeJwtBtn.classList.add('disabled');

        copySourceBtn.classList.add('disabled');
        clearSourceBtn.classList.add('disabled');
        sourcePrettyBtn.style.display = 'none';
        sourceMinifyBtn.style.display = 'none';
      }

      if (isResult()) {
        copyResultBtn.classList.remove('disabled');
        saveResultBtn.classList.remove('disabled');
        clearResultBtn.classList.remove('disabled');
      } else {
        copyResultBtn.classList.add('disabled');
        saveResultBtn.classList.add('disabled');
        clearResultBtn.classList.add('disabled');
      }

      // Update result JSON buttons visibility
      if (resultText.innerText && (resultType === 'text' || resultType === 'base64') && isJSON(resultText.innerText)) {
        beautifyBtn.style.display = 'inline';
        minifyBtn.style.display = 'inline';
      } else if (resultType !== 'text' && resultType !== 'base64') {
        // non-text types — hidden by setCurrentResultType
      } else {
        beautifyBtn.style.display = 'none';
        minifyBtn.style.display = 'none';
      }

      // Show encoding select only for text result type with content
      if (resultType === 'text' && resultText.innerText) {
        encodingSelect.style.display = 'inline-block';
      } else if (resultType === 'text') {
        encodingSelect.style.display = 'none';
      }

      // Show swap button when at least one value exists
      if (source.value || resultText.innerText) {
        swapBtn.style.display = '';
      } else {
        swapBtn.style.display = 'none';
      }
      // For other types, setCurrentResultType handles it
    });
  }

  function showTextLength(text, textLengthElem) {
    const length = text.length;
    if (length > 1) {
      textLengthElem.innerText = length + ' ' + chrome.i18n.getMessage('chars_many');
    } else if (length === 1) {
      textLengthElem.innerText = length + ' ' + chrome.i18n.getMessage('chars_one');
    } else {
      textLengthElem.innerText = chrome.i18n.getMessage('chars_zero');
    }
  }

  function saveResultToFile(result) {
    switch (resultType) {
      case 'text':
      case 'base64': {
        if (isJSON(resultText.innerText)) {
          const blob = new Blob([JSON.stringify(JSON.parse(resultText.innerText), null, 2)], { type: 'application/json' });
          saveAs(blob, chrome.i18n.getMessage('json_filename'));
        } else {
          const blob = new Blob([result || resultText.innerText], { type: 'text/plain' });
          saveAs(blob, chrome.i18n.getMessage('text_filename'));
        }
        break;
      }
      case 'image': {
        if (resultImg.src.startsWith('data:image/png;base64,')) {
          saveAs(resultImg.src, chrome.i18n.getMessage('image_png_filename'));
        } else {
          saveAs(resultImg.src, chrome.i18n.getMessage('image_jpeg_filename'));
        }
        break;
      }
      case 'audio': saveAs(resultAudio.src, chrome.i18n.getMessage('audio_filename')); break;
      case 'video': alert(chrome.i18n.getMessage('alert_videoNotSupported')); break;
    }
  }

  function clearSource() {
    source.value = '';
    selectedFile = null;
    source.style.display = 'block';
    sourceTextLength.style.display = 'block';
    sourceFileInfo.classList.remove('active');
    copySourceBtn.classList.remove('disabled');
    pasteSourceBtn.classList.remove('disabled');
    sourcePrettyBtn.style.display = 'none';
    sourceMinifyBtn.style.display = 'none';
    setCurrentResultType('text');
    setCurrentActiveConvertBtn();
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
  }

  function clearResult() {
    resultText.innerText = '';
    setCurrentResultType('text');
    setCurrentActiveConvertBtn();
    activateAvailableBtns();
    showTextLength(resultText.innerText, resultTextLength);
  }

  body.ondrop = async (event) => {
    event.preventDefault();
    dropOverlay.classList.remove('active');

    if (event.dataTransfer.items) {
      [...event.dataTransfer.items].forEach((item) => {
        if (item.kind === "file") selectedFile = item.getAsFile();
      });
    } else {
      [...event.dataTransfer.files].forEach((file) => selectedFile = file);
    }

    if (selectedFile) {
      const base64 = await getBase64(selectedFile);
      source.value = null;
      resultText.innerText = base64.replace('data:text/plain;base64,', '');

      setCurrentResultType('text');
      activateAvailableBtns();
      showTextLength(source.value, sourceTextLength);
      setCurrentActiveConvertBtn(encodeBtn);

      source.style.display = 'none';
      sourceTextLength.style.display = 'none';
      sourceFileInfo.classList.add('active');
      sourceFileName.innerText = selectedFile.name;
    }
  };

  body.ondragover = (event) => {
    event.preventDefault();
    dropOverlay.classList.add('active');
  }

  body.ondragleave = (event) => {
    if (event.fromElement === dropOverlay) return;
    if (event.fromElement === dropOverlayImg) return;
    if (event.fromElement === dropOverlayText) return;
    dropOverlay.classList.remove('active');
  }

  source.value = text || '';

  if (source.value.length > 0) activateAvailableBtns();

  if (text) decodeBtn.click();

  if (text && text.startsWith('[from]')) {
    source.value = text.substring(7);
    decodeBtn.click();
  }

  if (text && text.startsWith('[to]')) {
    source.value = text.substring(5);
    encodeBtn.click();
  }

  source.focus();

  activateAvailableBtns();
  showTextLength(source.value, sourceTextLength);

  setCurrentResultType('text');

  resultImg.onload = () => {
    resultImgResolution.innerText = `${resultImg.naturalWidth} x ${resultImg.naturalHeight}`;
    resultImgSize.innerText = `${getDataUrlSize(resultImg.src)}`;
    resultImgMeta.style.display = 'flex';
  }

  resultImg.onerror = () => {
    if (resultType === 'image') {
      resultImg.src = null;
      resultImg.src = "../assets/images/icons/corrupted-file.png";
      resultImgMeta.style.display = 'none';
      return true;
    }
  }

  openSourceFile.onclick = () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      let files = Array.from(input.files);
      if (files.length > 0) {
        selectedFile = files[0];
        const base64 = await getBase64(files[0]);
        source.value = null;
        resultText.innerText = base64.replace('data:text/plain;base64,', '');

        source.style.display = 'none';
        sourceTextLength.style.display = 'none';
        copySourceBtn.classList.add('disabled');
        pasteSourceBtn.classList.add('disabled');
        sourcePrettyBtn.style.display = 'none';
        sourceMinifyBtn.style.display = 'none';
        sourceFileInfo.classList.add('active');
        setCurrentResultType('base64');
        setCurrentActiveConvertBtn(encodeBtn);
        activateAvailableBtns();
        showTextLength(source.value, sourceTextLength);
        showTextLength(resultText.innerText, resultTextLength);
        sourceFileName.innerText = files[0].name;
      }
    };
    input.click();
  }

  encodeBtn.onclick = async () => {
    if (!selectedFile) {
      let encodedText;
      const text = source.value;
      try {
        encodedText = btoa(text);
      } catch {
        encodedText = btoa(encodeURIComponent(text));
      }
      resultText.innerText = encodedText;
    } else {
      const base64 = await getBase64(selectedFile);
      source.value = null;
      resultText.innerText = base64.replace('data:text/plain;base64,', '');

      source.style.display = 'none';
      sourceTextLength.style.display = 'none';
      sourceFileInfo.classList.add('active');
      sourceFileName.innerText = selectedFile.name;
    }

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);
    setCurrentResultType('base64');
    setCurrentActiveConvertBtn(encodeBtn);
  };

  beautifyBtn.onclick = () => {
    if (isJSON(resultText.innerText)) {
      resultText.innerText = prettyJSON(resultText.innerText);
      showTextLength(resultText.innerText, resultTextLength);
      resultText.childNodes.forEach((node) => {
        if (!node.textContent) return;
        if (node.textContent.includes('iat') || node.textContent.includes('exp')) {
          const span = document.createElement('span');
          node.parentNode.insertBefore(span, node);
          span.appendChild(node);
          span.style.backgroundColor = '#d3d3d347';
          span.addEventListener('mouseover', () => {
            const m = node.textContent.match(/"(iat|exp)": (?<date>\d+)/);
            if (!m) return;
            const date = m.groups.date;
            resultTooltip.textContent = new Date(date * 1000).toLocaleString();
            const rect = span.getBoundingClientRect();
            resultTooltip.style.top = `${rect.top - 16}px`;
            resultTooltip.style.left = `${rect.right + 10}px`;
            span.style.backgroundColor = 'lightgrey';
            resultTooltip.style.display = 'block';
          });
          span.addEventListener('mouseout', () => {
            span.style.backgroundColor = '#d3d3d347';
            resultTooltip.style.display = 'none';
          });
        }
      });
    }
  }

  minifyBtn.onclick = () => {
    if (isJSON(resultText.innerText)) {
      resultText.innerText = minifyJSON(resultText.innerText);
      showTextLength(resultText.innerText, resultTextLength);
    }
  }

  sourcePrettyBtn.onclick = () => {
    if (isJSON(source.value)) {
      source.value = prettyJSON(source.value);
      showTextLength(source.value, sourceTextLength);
    }
  }

  sourceMinifyBtn.onclick = () => {
    if (isJSON(source.value)) {
      source.value = minifyJSON(source.value);
      showTextLength(source.value, sourceTextLength);
    }
  }

  swapBtn.onclick = () => {
    const sourceVal = source.value;
    const resultVal = resultText.innerText;

    if (selectedFile) {
      // If a file is selected, swap is limited: put result into source
      selectedFile = null;
      source.style.display = 'block';
      sourceTextLength.style.display = 'block';
      sourceFileInfo.classList.remove('active');
      copySourceBtn.classList.remove('disabled');
      pasteSourceBtn.classList.remove('disabled');
      source.value = resultVal;
      resultText.innerText = '';
    } else {
      source.value = resultVal;
      resultText.innerText = sourceVal;
    }

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);

    // Swap the active conversion button
    if (resultType === 'text') {
      resultType = 'base64';
      setCurrentActiveConvertBtn(encodeBtn);
    } else if (resultType === 'base64') {
      resultType = 'text';
      setCurrentActiveConvertBtn(decodeBtn);
    }

    setCurrentResultType(resultType || 'text');
    source.focus();
  }

  decodeJwtBtn.onclick = () => {
    resultText.innerText = JSON.stringify(parseJwt(source.value));
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);
    setCurrentResultType('text');
    setCurrentActiveConvertBtn(decodeJwtBtn);
  }

  decodeBtn.onclick = () => {
    let base64 = source.value.replace(/data:.+?;base64,/, '');
    // Trim quotes from base64 string without modifying source
    base64 = trimQuotes(base64.trim());

    const encoding = encodingSelect.value;
    try {
      if (encoding === 'auto') {
        const detected = autoDetectEncoding(base64);
        resultText.innerText = decodeBase64WithEncoding(base64, detected);
      } else {
        resultText.innerText = decodeBase64WithEncoding(base64, encoding);
      }
    } catch {
      // Fallback: try standard decodeURIComponent approach
      try {
        resultText.innerText = decodeURIComponent(atob(base64));
      } catch {
        resultText.innerText = atob(base64);
      }
    }

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);
    setCurrentResultType('text');
    setCurrentActiveConvertBtn(decodeBtn);
  };

  decodeImageBtn.onclick = () => {
    resultImg.src = null;
    if (source.value.startsWith('data:image/')) {
      resultImg.src = source.value;
    } else {
      resultImg.src = `data:image/png;base64,${source.value}`;
    }

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    setCurrentResultType('image');
    setCurrentActiveConvertBtn(decodeImageBtn);
  };

  decodeAudioBtn.onclick = () => {
    const base64 = source.value.replace(/data:audio\/.+?;base64,/, '');
    resultAudio.src = `data:audio/mp3;base64,${base64}`;

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    setCurrentResultType('audio');
    setCurrentActiveConvertBtn(decodeAudioBtn);
  };

  decodeVideoBtn.onclick = () => {
    const base64 = source.value.replace(/data:video\/.+?;base64,/, '');
    resultVideoSource.src = `data:video/mp4;base64,${base64}`;
    resultVideo.load();

    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    setCurrentResultType('video');
    setCurrentActiveConvertBtn(decodeVideoBtn);
  };

  source.onpaste = () => {
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
  }

  source.onkeyup = () => {
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
  }

  copySourceBtn.onclick = () => copyToClipboard(source.value);

  resultText.oninput = () => {
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);
  }

  pasteSourceBtn.onclick = async () => {
    const text = await pasteFromClipboard();
    source.value = text;
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    showTextLength(resultText.innerText, resultTextLength);
    setCurrentResultType('text');
  };

  document.addEventListener('paste', async (event) => {
    if (event.clipboardData.files.length === 0) return;
    const files = Array.from(event.clipboardData.files);
    selectedFile = files[0];
    event.preventDefault();
    const base64 = await getBase64(files[0]);
    source.value = null;
    resultText.innerText = base64.replace('data:text/plain;base64,', '');

    source.style.display = 'none';
    sourceTextLength.style.display = 'none';
    copySourceBtn.classList.add('disabled');
    pasteSourceBtn.classList.add('disabled');
    sourceFileInfo.classList.add('active');
    setCurrentResultType('base64');
    setCurrentActiveConvertBtn(encodeBtn);
    activateAvailableBtns();
    showTextLength(source.value, sourceTextLength);
    sourceFileName.innerText = files[0].name;
  });

  clearSourceBtn.onclick = (event) => {
    clearSource();
    if (event.shiftKey) clearResult();
    source.focus();
  }

  clearResultBtn.onclick = (event) => {
    clearResult();
    if (event.shiftKey) clearSource();
    source.focus();
  }

  document.onkeyup = function (event) {
    if (!event.shiftKey) {
      copyResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_copy');
      saveResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_save');
      clearResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_clear');
      clearSourceBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_clear');
    }

    if (!event.altKey) {
      document.querySelectorAll('.actions .btn').forEach((elem) => elem.classList.remove('alt'));
    }
  }

  document.onkeydown = function (event) {
    if (event.shiftKey) {
      copyResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_copyStar');
      saveResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_saveStar');
      clearResultBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_clearStar');
      clearSourceBtn.querySelector('span').innerText = chrome.i18n.getMessage('btn_clearStar');
    }

    if (event.ctrlKey && event.code === 'KeyO') {
      openSourceFile.click();
      return false;
    }

    if (event.ctrlKey && event.code === 'KeyS') {
      if (isResult()) {
        if (event.shiftKey) {
          saveResultToFile(resultText.innerText.replace(/data:.*?;base64,/, ''));
        } else {
          saveResultToFile();
        }
      }
      return false;
    }

    if (event.shiftKey && (event.key === "Backspace" || event.key === "Delete")) {
      clearResult();
      clearSource();
      return false;
    }

    if (event.altKey) {
      document.querySelectorAll('.actions .btn').forEach((elem) => elem.classList.add('alt'));
      if (event.key === '1' && !decodeBtn.classList.contains('disabled')) decodeBtn.click();
      if (event.key === '2' && !encodeBtn.classList.contains('disabled')) encodeBtn.click();
      if (event.key === '3' && !decodeJwtBtn.classList.contains('disabled')) decodeJwtBtn.click();
      if (event.key === '4' && !decodeImageBtn.classList.contains('disabled')) decodeImageBtn.click();
      if (event.key === '5' && !decodeAudioBtn.classList.contains('disabled')) decodeAudioBtn.click();
      if (event.key === '6' && !decodeVideoBtn.classList.contains('disabled')) decodeVideoBtn.click();
      return false;
    }

    if (event.ctrlKey && event.code === 'KeyC') {
      const selection = window.getSelection();
      if (!selection.toString() && (resultType === 'text' || resultType === 'base64')) {
        if (event.shiftKey) {
          copyToClipboard(resultText.innerText.replace(/data:.*?;base64,/, ''));
        } else {
          copyToClipboard(resultText.innerText);
        }
        return false;
      }
    }

    if (event.code === 'F1') {
      openFAQBtn.click();
      return false;
    }

  };

  saveResultBtn.onclick = (event) => {
    if (event.shiftKey) {
      saveResultToFile(resultText.innerText.replace(/data:.*?;base64,/, ''));
    } else {
      saveResultToFile();
    }
  }

  copyResultBtn.onclick = (event) => {
    switch (resultType) {
      case 'text':
      case 'base64': {
        if (event.shiftKey) {
          copyToClipboard(resultText.innerText.replace(/data:.*?;base64,/, ''));
        } else {
          copyToClipboard(resultText.innerText);
        }
        break;
      }
      case 'image':
      case 'audio':
      case 'video': alert(chrome.i18n.getMessage('alert_resultNotCopyable', resultType)); break;
    }
  }

  openExtensionPageBtn.onclick = () => {
    window.open('https://chromewebstore.google.com/detail/base64coder/ebgonfpmppfndacngpbmgajldoabnjkm', '_blank');
  }

  openFAQBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: 'openFAQ' });
  }

  openSettingsBtn.onclick = () => {
    chrome.runtime.openOptionsPage();
  }
};