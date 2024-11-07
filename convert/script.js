const copyToClipboard = value => {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText && typeof value === 'string') {
    return navigator.clipboard.writeText(value);
  }
  if (navigator && navigator.clipboard && navigator.clipboard.write && typeof value === 'object') {
    return navigator.clipboard.write(value);
  }
  return Promise.reject('The Clipboard API is not available.');
};

function pasteFromClipboard() {
  if (navigator && navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText();
  }
  return Promise.reject('The Clipboard API is not available.');
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      return resolve(reader.result);
    };
    reader.onerror = function (error) {
      return reject(error);
    };
  });
}

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

function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};



document.onreadystatechange = function () {
  const source = document.getElementById('source');
  const result = document.getElementById('result');
  const resultTooltip = document.getElementById('result-tooltip');
  const resultImg = document.getElementById('result-img');
  const resultAudio = document.getElementById('result-audio');
  const resultVideo = document.getElementById('result-video');
  const resultVideoSource = document.getElementById('result-video-source');
  const openSourceFile = document.getElementById('open-source-file');
  const encodeBtn = document.getElementById('encode-btn');
  const decodeBtn = document.getElementById('decode-btn');
  const decodeJwt = document.getElementById('decode-jwt-btn');
  const decodeImage = document.getElementById('decode-image-btn');
  const decodeAudio = document.getElementById('decode-audio-btn');
  const decodeVideo = document.getElementById('decode-video-btn');
  const copyResult = document.getElementById('copy-result');
  const copySource = document.getElementById('copy-source');
  const pasteSource = document.getElementById('paste-source');
  const clearSource = document.getElementById('clear-source');
  const clearResult = document.getElementById('clear-result');
  const saveResult = document.getElementById('save-result');
  const beautify = document.getElementById('beautify-result');
  const query = new URLSearchParams(window.location.search);
  const text = query.get('text');

  let resultType = 'text';

  source.value = text || '';

  if (source.value.length > 0) {
    decodeBtn.classList.remove('disabled');
    encodeBtn.classList.remove('disabled');
    decodeJwt.classList.remove('disabled');
    decodeImage.classList.remove('disabled');
    decodeAudio.classList.remove('disabled');
    decodeVideo.classList.remove('disabled');
  }

  if (text) {
    decodeBtn.click();
  }

  if (text && text.startsWith('[from]')) {
    source.value = text.substring(7);
    decodeBtn.click();
  }

  if (text && text.startsWith('[to]')) {
    source.value = text.substring(5);
    encodeBtn.click();
  }

  resultImg.style.display = 'none';
  resultAudio.style.display = 'none';
  resultVideo.style.display = 'none';
  beautify.style.display = 'none';

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
        const base64 = await getBase64(files[0]);
        source.value = null;
        result.innerText = base64.replace('data:text/plain;base64,', '');
        beautify.style.display = 'none';
        result.style.display = 'block';
        resultImg.src = null;
        resultImg.style.display = 'none';
        resultAudio.style.display = 'none';
        resultVideo.style.display = 'none';
        resultType = 'text';
        copyResult.classList.remove('disabled');
      }
    };
    input.click();
  }

  encodeBtn.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    let encodedText;
    const text = source.value;
    try {
      encodedText = btoa(text);
    } catch (err) {
      encodedText = btoa(encodeURIComponent(text));
    }
    result.innerText = encodedText;
    beautify.style.display = 'none';
    result.style.display = 'block';
    resultImg.src = null;
    resultImg.style.display = 'none';
    resultAudio.style.display = 'none';
    resultVideo.style.display = 'none';
    resultType = 'text';
    copyResult.classList.remove('disabled');
  };

  beautify.onclick = (event) => {
    if (isJSON(result.innerText)) {
      result.innerText = JSON.stringify(JSON.parse(result.innerText), null, 2);
      result.childNodes.forEach((node) => {
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

  decodeJwt.onclick = (event) => {
    result.innerText = JSON.stringify(parseJwt(source.value));
    if (isJSON(result.innerText)) {
      beautify.style.display = 'inline';
      copyResult.classList.remove('disabled');
      result.style.display = 'block';
      resultImg.style.display = 'none';
      resultAudio.style.display = 'none';
      resultVideo.style.display = 'none';
      resultVideo.style.display = 'none';
      resultType = 'text';
    }
  }


  decodeBtn.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    const base64 = source.value;
    try {
      result.innerText = decodeURIComponent(atob(base64));
    }
    catch (err) {
      result.innerText = atob(base64);
    }
    beautify.style.display = 'none';
    if (isJSON(result.innerText)) {
      beautify.style.display = 'inline';
    }
    result.style.display = 'block';
    resultImg.style.display = 'none';
    resultAudio.style.display = 'none';
    resultVideo.style.display = 'none';
    resultVideo.style.display = 'none';
    resultType = 'text';
    copyResult.classList.remove('disabled');
  };

  decodeImage.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    resultImg.src = null;
    if (source.value.startsWith('data:image/')) {
      resultImg.src = source.value;
    } else {
      resultImg.src = `data:image/png;base64,${source.value}`;
    }
    beautify.style.display = 'none';
    result.style.display = 'none';
    resultImg.style.display = 'block';
    resultAudio.style.display = 'none';
    resultVideo.style.display = 'none';
    resultVideo.style.display = 'none';
    resultType = 'image';
    copyResult.classList.add('disabled');
  };

  decodeAudio.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    const base64 = source.value.replace(/data:audio\/.+?;base64,/, '');
    resultAudio.src = `data:audio/mp3;base64,${base64}`;
    beautify.style.display = 'none';
    result.style.display = 'none';
    resultImg.style.display = 'none';
    resultAudio.style.display = 'block';
    resultVideo.style.display = 'none';
    resultType = 'audio';
    copyResult.classList.add('disabled');
  };

  decodeVideo.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    const base64 = source.value.replace(/data:video\/.+?;base64,/, '');
    resultVideoSource.src = `data:video/mp4;base64,${base64}`;
    beautify.style.display = 'none';
    result.style.display = 'none';
    resultImg.style.display = 'none';
    resultAudio.style.display = 'none';
    resultVideo.style.display = 'block';
    resultVideo.load();
    resultType = 'video';
    copyResult.classList.add('disabled');
  };

  function activateFunctionsOnSourceEvent() {
    setTimeout(() => {
      if (source.value) {
        decodeBtn.classList.remove('disabled');
        encodeBtn.classList.remove('disabled');
        decodeJwt.classList.remove('disabled');
        decodeImage.classList.remove('disabled');
        decodeAudio.classList.remove('disabled');
        decodeVideo.classList.remove('disabled');
      } else {
        decodeBtn.classList.add('disabled');
        encodeBtn.classList.add('disabled');
        decodeJwt.classList.add('disabled');
        decodeImage.classList.add('disabled');
        decodeAudio.classList.add('disabled');
        decodeVideo.classList.add('disabled');
      }
    });
  }

  source.onpaste = (event) => activateFunctionsOnSourceEvent(event);

  source.onkeyup = (event) => activateFunctionsOnSourceEvent(event);

  copySource.onclick = () => copyToClipboard(source.value);

  pasteSource.onclick = async () => {
    const text = await pasteFromClipboard();
    source.value = text;
    source.dispatchEvent(new Event('keyup'));
  };

  clearSource.onclick = () => {
    source.value = '';
    source.dispatchEvent(new Event('keyup'));
  }

  clearResult.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    result.innerText = '';
    resultImg.src = null;
    resultAudio.src = null;
    resultVideoSource.src = null;
    beautify.style.display = 'none';
    result.style.display = 'block';
    resultImg.style.display = 'none';
    resultAudio.style.display = 'none';
    resultVideo.style.display = 'none';
    resultVideo.style.display = 'none';
    resultType = 'text';
  }

  saveResult.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    if (resultType === 'text') {
      if (isJSON(result.innerText)) {
        const blob = new Blob([JSON.stringify(JSON.parse(result.innerText), null, 2)], { type: 'application/json' });
        saveAs(blob, "data.json");
      } else {
        const blob = new Blob([result.innerText], { type: 'text/plain' });
        saveAs(blob, "text.txt");
      }
    }
    if (resultType === 'image') {
      if (resultImg.src.startsWith('data:image/png;base64,')) {
        saveAs(resultImg.src, "image.png");
      } else {
        saveAs(resultImg.src, "image.jpeg");
      }
    }
    if (resultType === 'audio') {
      saveAs(resultAudio.src, "audio.mp3");
    }
    if (resultType === 'video') {
      alert('Video is not supported yet.');
    }
  };

  copyResult.onclick = (event) => {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    if (resultType === 'text') {
      copyToClipboard(result.innerText);
    }
    if (resultType === 'image') {
      alert('Image is not copyable. Please use context menu.');
    }
    if (resultType === 'audio') {
      alert('Audio is not copyable. Please use context menu.');
    }
    if (resultType === 'video') {
      alert('Video is not copyable. Please use context menu.');
    }
  }
};