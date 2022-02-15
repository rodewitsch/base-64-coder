let clickedEl = null;

document.addEventListener('contextmenu', (event) => clickedEl = event.target, true);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'getClickedEl' && clickedEl) {
    (async function () {
      const imageSrc = findNearestImageSrc(clickedEl);
      if (!imageSrc) alert('No image found');
      await getBase64ImageFromImageSrc(imageSrc, request.tabId);
    })();
  }
  if (request.type === 'copy') copyToClipboard(request.text);
  return true;
});

function findNearestImageSrc(element) {
  if (!element) return null;
  if (element.nodeName.toLowerCase() === 'img') return element.currentSrc;
  const parentElement = element.parentNode;
  if (!parentElement) return null;
  if (parentElement.nodeName.toLowerCase() === 'img') return parentElement.currentSrc;
  const parentImage = parentElement.querySelector('img');
  if (parentImage) return parentImage.currentSrc;
  const elementStyles = element.currentStyle || window.getComputedStyle(element, false);
  if (elementStyles.backgroundImage && elementStyles.backgroundImage !== 'none') {
    return elementStyles.backgroundImage.slice(4, -1).replace(/"/g, "");
  }
  return findNearestImageSrc(parentElement);
}

const copyToClipboard = str => {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(str);
  }
  return Promise.reject('The Clipboard API is not available.');
};

async function getBase64ImageFromImageSrc(src, tabId) {
  if (isBase64(src, { allowMime: true })) copyToClipboard(src);
  await chrome.runtime.sendMessage({ type: 'getBase64ImageFromElement', src, tabId });
}