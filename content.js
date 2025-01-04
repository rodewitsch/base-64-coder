let clickedEl = null;

document.addEventListener('contextmenu', (event) => clickedEl = event.target, true);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  try {
    if (request.type === 'getClickedEl' && clickedEl) {
      const imageSrc = findNearestImageSrc(clickedEl);
      if (!imageSrc) throw new Error('No image found');
      if (isBase64(imageSrc, { allowMime: true })) {
        copyToClipboard(imageSrc);
        await chrome.runtime.sendMessage({ type: 'success', tabId: request.tabId });
      } else {
        await chrome.runtime.sendMessage({ type: 'getBase64ImageFromElement', src: imageSrc, tabId: request.tabId });
      }
    }
    if (request.type === 'copy') {
      copyToClipboard(request.text);
      await chrome.runtime.sendMessage({ type: 'success', tabId: request.tabId });
    }
  } catch (err) {
    await chrome.runtime.sendMessage({ type: 'error', tabId: request.tabId, err });
  } finally {
    sendResponse({ received: true });
  }
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
    return elementStyles.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)[1];
  }
  return findNearestImageSrc(parentElement);
}