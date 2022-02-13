//content script
var clickedEl = null;

document.addEventListener("contextmenu", function (event) {
  clickedEl = event.target;
}, true);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == "getClickedEl") {
    (async function () {
      const imageSrc = findNearestImageSrc(clickedEl);
      if (!imageSrc) alert('No image found');

      const base64 = await getBase64ImageFromImageSrc(imageSrc);
      return sendResponse({ base64 });
    })();
  }
  return true;
});

function findNearestImageSrc(element) {
  if (!element) return null;
  if (element.nodeName.toLowerCase() === "img") return element.currentSrc;
  const parentElement = element.parentNode;
  if(!parentElement) return null;
  if (parentElement.nodeName.toLowerCase() === "img") return parentElement.currentSrc;
  const parentImage = parentElement.querySelector('img');
  if (parentImage) return parentImage.currentSrc;
  const elementStyles = element.currentStyle || window.getComputedStyle(element, false);
  if (elementStyles.backgroundImage && elementStyles.backgroundImage !== "none") {
    return elementStyles.backgroundImage.slice(4, -1).replace(/"/g, "");
  }
  return findNearestImageSrc(parentElement);
}

async function getBase64ImageFromImageSrc(src) {
  if (isBase64(src, { allowMime: true })) return src;
  const response = await browser.runtime.sendMessage({ type: 'getBase64ImageFromElement', src });
  return response.base64;
}

function toDataURL(src, outputFormat) {
  return new Promise((resolve, reject) => {

    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      var canvas = document.createElement('CANVAS');
      var ctx = canvas.getContext('2d');
      var dataURL;
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL(outputFormat);
      resolve(dataURL);
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
      img.src = src;
    }
  })
}