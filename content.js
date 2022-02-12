//content script
var clickedEl = null;

document.addEventListener("contextmenu", function (event) {
  clickedEl = event.target;
}, true);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == "getClickedEl") {
    (async function(){
      const image = findNearestImage(clickedEl);
      if (!image) alert('No image found');

      const base64 = await getBase64ImageFromElement(image);
      return sendResponse({ base64 });
    })();
  }
  return true;
});

function findNearestImage(element) {
  if (element.nodeName.toLowerCase() === "img") return element;
  const parentElement = element.parentElement;
  if (parentElement.nodeName.toLowerCase() === "img") return parentElement;
  const parentImage = parentElement.querySelector('img');
  if (parentImage) return parentImage;
  return findNearestImage(parentElement);
}

async function getBase64ImageFromElement(element) {
  if (element) {
    if (element.currentSrc) {
      if (isBase64(element.currentSrc, { allowMime: true })) return element.currentSrc;
      // const image = await toDataURL(element.currentSrc);
      const response = await browser.runtime.sendMessage({ type: 'getBase64ImageFromElement', src: element.currentSrc });
      return response.base64;
    }
  }
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