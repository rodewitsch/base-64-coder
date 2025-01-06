document.onreadystatechange = function () {
  let resultType;
  const body = document.body;
  const dropOverlay = document.getElementById('drop-overlay');
  const dropOverlayImg = document.getElementById('drop-overlay-img');
  const dropOverlayText = document.getElementById('drop-overlay-text');
  const source = document.getElementById('source');
  const sourceFileInfo = document.getElementById('source-file-info');
  const sourceFileName = document.getElementById('source-file-name');
  const resultText = document.getElementById('result');
  const resultTooltip = document.getElementById('result-tooltip');
  const resultImg = document.getElementById('result-img');
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
  const openExtensionPageBtn = document.getElementById('open-extension-page');
  const openFAQBtn = document.getElementById('open-faq');

  const query = new URLSearchParams(window.location.search);
  const text = query.get('text');
  let selectedFile;


  function setCurrentActiveConvertBtn(btn) {
    Array.from(document.querySelectorAll('.actions .active')).forEach((elem) => { elem.classList.remove('active'); })
    if (btn) btn.classList.add('active');
  }

  function setCurrentResultType(type) {
    resultType = type;
    switch (type) {
      case 'text': {
        resultText.style.display = 'block';
        resultImg.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultAudio.src = null;
        resultVideoSource.src = null;
        beautifyBtn.style.display = 'none';

        if (isJSON(resultText.innerText)) beautifyBtn.style.display = 'inline';
        copyResultBtn.classList.remove('disabled');
        break;
      }
      case 'base64': {
        resultText.style.display = 'block';
        resultImg.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultAudio.src = null;
        resultVideoSource.src = null;

        beautifyBtn.style.display = 'none';
        copyResultBtn.classList.remove('disabled');
        break;
      }
      case 'image': {
        resultText.style.display = 'none';
        resultImg.style.display = 'block';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultAudio.src = null;
        resultVideoSource.src = null;

        copyResultBtn.classList.add('disabled');
        break;
      }
      case 'audio': {
        resultText.style.display = 'none';
        resultImg.style.display = 'none';
        resultAudio.style.display = 'block';
        resultVideo.style.display = 'none';
        resultImg.src = null;
        resultVideoSource.src = null;

        copyResultBtn.classList.add('disabled');
        break;
      }
      case 'video': {
        resultText.style.display = 'none';
        resultImg.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'block';
        resultImg.src = null;
        resultAudio.src = null;

        copyResultBtn.classList.add('disabled');
        break;
      }
    }
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
      } else {
        decodeBtn.classList.add('disabled');
        encodeBtn.classList.add('disabled');
        decodeImageBtn.classList.add('disabled');
        decodeAudioBtn.classList.add('disabled');
        decodeVideoBtn.classList.add('disabled');
        decodeJwtBtn.classList.add('disabled');

        copySourceBtn.classList.add('disabled');
        clearSourceBtn.classList.add('disabled');
      }

      if (resultText.innerHTML) {
        copyResultBtn.classList.remove('disabled');
        saveResultBtn.classList.remove('disabled');
        clearResultBtn.classList.remove('disabled');
      } else {
        copyResultBtn.classList.add('disabled');
        saveResultBtn.classList.add('disabled');
        clearResultBtn.classList.add('disabled');
      }
    });
  }

  function saveResultToFile(result) {
    switch (resultType) {
      case 'text':
      case 'base64': {
        if (isJSON(resultText.innerText)) {
          const blob = new Blob([JSON.stringify(JSON.parse(resultText.innerText), null, 2)], { type: 'application/json' });
          saveAs(blob, "data.json");
        } else {
          const blob = new Blob([result || resultText.innerText], { type: 'text/plain' });
          saveAs(blob, "text.txt");
        }
        break;
      }
      case 'image': {
        if (resultImg.src.startsWith('data:image/png;base64,')) {
          saveAs(resultImg.src, "image.png");
        } else {
          saveAs(resultImg.src, "image.jpeg");
        }
        break;
      }
      case 'audio': saveAs(resultAudio.src, "audio.mp3"); break;
      case 'video': alert('Video is not supported yet.'); break;
    }
  }

  function clearSource() {
    source.value = '';
    selectedFile = null;
    source.style.display = 'block';
    sourceFileInfo.classList.remove('active');
    copySourceBtn.classList.remove('disabled');
    pasteSourceBtn.classList.remove('disabled');
    setCurrentResultType('text');
    setCurrentActiveConvertBtn();
    activateAvailableBtns();
  }

  function clearResult() {
    resultText.innerText = '';
    setCurrentResultType('text');
    setCurrentActiveConvertBtn();
    activateAvailableBtns();
  }

  body.ondrop = async (event) => {
    event.preventDefault();
    dropOverlay.classList.remove('active');

    if (event.dataTransfer.items) {
      [...event.dataTransfer.items].forEach((item, i) => {
        if (item.kind === "file") selectedFile = item.getAsFile();
      });
    } else {
      [...event.dataTransfer.files].forEach((file, i) => selectedFile = file);
    }

    if (selectedFile) {
      const base64 = await getBase64(selectedFile);
      source.value = null;
      resultText.innerText = base64.replace('data:text/plain;base64,', '');

      setCurrentResultType('text');
      activateAvailableBtns();
      setCurrentActiveConvertBtn(encodeBtn);

      source.style.display = 'none';
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

  setCurrentResultType('text');

  resultImg.onerror = () => {
    resultImg.src = null;
    resultImg.src = "../assets/images/icons/corrupted-file.png";
    return true;
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
        copySourceBtn.classList.add('disabled');
        pasteSourceBtn.classList.add('disabled');
        sourceFileInfo.classList.add('active');
        setCurrentResultType('base64');
        setCurrentActiveConvertBtn(encodeBtn);
        activateAvailableBtns();
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
      } catch (err) {
        encodedText = btoa(encodeURIComponent(text));
      }
      resultText.innerText = encodedText;
    } else {
      const base64 = await getBase64(selectedFile);
      source.value = null;
      resultText.innerText = base64.replace('data:text/plain;base64,', '');

      source.style.display = 'none';
      sourceFileInfo.classList.add('active');
      sourceFileName.innerText = files[0].name;
    }

    activateAvailableBtns();
    setCurrentResultType('base64');
    setCurrentActiveConvertBtn(encodeBtn);
  };

  beautifyBtn.onclick = () => {
    if (isJSON(resultText.innerText)) {
      resultText.innerText = JSON.stringify(JSON.parse(resultText.innerText), null, 2);
      resultText.childNodes.forEach((node) => {
        if (!node.textContent) return;
        if (node.textContent.includes('iat') || node.textContent.includes('exp')) {
          const span = document.createElement('span');
          node.parentNode.insertBefore(span, node);
          span.appendChild(node);
          span.style.backgroundColor = '#d3d3d347';
          span.addEventListener('mouseover', (event) => {
            const date = node.textContent.match(/"(iat|exp)": (?<date>\d+)/).groups.date;
            resultTooltip.textContent = dayjs.unix(date).format('YYYY-MM-DD HH:mm:ss');
            const rect = span.getBoundingClientRect();
            resultTooltip.style.top = `${rect.top - 16}px`;
            resultTooltip.style.left = `${rect.left - 125}px`;
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

  decodeJwtBtn.onclick = () => {
    resultText.innerText = JSON.stringify(parseJwt(source.value));
    activateAvailableBtns();
    setCurrentResultType('text');
    setCurrentActiveConvertBtn(decodeJwtBtn);
  }

  decodeBtn.onclick = () => {
    const base64 = source.value.replace(/data:.+?;base64,/, '');
    try {
      resultText.innerText = decodeURIComponent(atob(base64));
    }
    catch (err) {
      resultText.innerText = atob(base64);
    }

    activateAvailableBtns();
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
    setCurrentResultType('image');
    setCurrentActiveConvertBtn(decodeImageBtn);
  };

  decodeAudioBtn.onclick = () => {
    const base64 = source.value.replace(/data:audio\/.+?;base64,/, '');
    resultAudio.src = `data:audio/mp3;base64,${base64}`;

    activateAvailableBtns();
    setCurrentResultType('audio');
    setCurrentActiveConvertBtn(decodeAudioBtn);
  };

  decodeVideoBtn.onclick = () => {
    const base64 = source.value.replace(/data:video\/.+?;base64,/, '');
    resultVideoSource.src = `data:video/mp4;base64,${base64}`;
    resultVideo.load();

    activateAvailableBtns();
    setCurrentResultType('video');
    setCurrentActiveConvertBtn(decodeVideoBtn);
  };

  source.onpaste = () => activateAvailableBtns();

  source.onkeyup = () => activateAvailableBtns();

  copySourceBtn.onclick = () => copyToClipboard(source.value);

  pasteSourceBtn.onclick = async () => {
    const text = await pasteFromClipboard();
    source.value = text;
    activateAvailableBtns();
    setCurrentResultType('text');
  };

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
      copyResultBtn.querySelector('span').innerText = 'copy';
      saveResultBtn.querySelector('span').innerText = 'save';
      clearResultBtn.querySelector('span').innerText = 'clear';
      clearSourceBtn.querySelector('span').innerText = 'clear';
    }
  }

  document.onkeydown = function (event) {
    if (event.shiftKey) {
      copyResultBtn.querySelector('span').innerText = 'copy*';
      saveResultBtn.querySelector('span').innerText = 'save*';
      clearResultBtn.querySelector('span').innerText = 'clear*';
      clearSourceBtn.querySelector('span').innerText = 'clear*';
    }
    if (event.ctrlKey && event.key === 's') {
      saveResultToFile();
      return false;
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') {
      saveResultToFile(resultText.innerText.replace(/data:.*?;base64,/, ''));
      return false;
    }
    if (event.shiftKey && (event.key === "Backspace" || event.key === "Delete")) {
      clearResult();
      clearSource();
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
      case 'video': alert(`Result of ${resultType} type is not copyable. Please use context menu.`); break;
    }
  }

  openExtensionPageBtn.onclick = () => {
    window.open('https://chromewebstore.google.com/detail/base64coder/ebgonfpmppfndacngpbmgajldoabnjkm', '_blank');
  }

  openFAQBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: 'openFAQ' });
  }
};