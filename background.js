browser.contextMenus.create({
  title: 'base64 ➜ text',
  id: 'base64coderbase64text',
  contexts: ['selection'],
  onclick: (info) => decodeText(info.selectionText),
  visible: true
});

browser.contextMenus.create({
  title: 'text ➜ base64',
  id: 'base64codermenutextbase64',
  contexts: ['selection'],
  onclick: async (info) => await encodeText(info.selectionText),
  visible: true
});

browser.contextMenus.create({
  title: 'image ➜ base64',
  id: 'base64codermenuimagebase64',
  contexts: ['all'],
  onclick: (info, tab) => encodeImage(info, tab),
  visible: true
});

async function encodeImage(info, tab) {
  browser.browserAction.setBadgeText({text: 'copying'});
  browser.browserAction.setBadgeBackgroundColor({color: 'red'});
  const response = await browser.tabs.sendMessage(tab.id, 'getClickedEl', { frameId: info.frameId });
  copyTextToClipboard(response.base64);
  browser.browserAction.setBadgeText({text: 'copied'});
  browser.browserAction.setBadgeBackgroundColor({color: 'green'});
  setTimeout(() =>browser.browserAction.setBadgeText({text: ''}), 500);
}

function decodeText(base64) {
  const decodedText = decodeURIComponent(atob(base64));
  copyTextToClipboard(decodedText)
}

function encodeText(text) {
  let encodedText;
  try{
    encodedText = btoa(text);
  } catch(err) {
    encodedText = btoa(encodeURIComponent(text));
  }
  copyTextToClipboard(encodedText)
}

function copyTextToClipboard(input, { target = document.body } = {}) {
  const element = document.createElement('textarea');
  const previouslyFocusedElement = document.activeElement;

  element.value = input;

  // Prevent keyboard from showing on mobile
  element.setAttribute('readonly', '');

  element.style.contain = 'strict';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.fontSize = '12pt'; // Prevent zooming on iOS

  const selection = document.getSelection();
  let originalRange = false;
  if (selection.rangeCount > 0) {
    originalRange = selection.getRangeAt(0);
  }

  target.append(element);
  element.select();

  // Explicit selection workaround for iOS
  element.selectionStart = 0;
  element.selectionEnd = input.length;

  let isSuccess = false;
  try {
    isSuccess = document.execCommand('copy');
  } catch { }

  element.remove();

  if (originalRange) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }

  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }

  return isSuccess;
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'getBase64ImageFromElement') {
    (async function(){
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        var dataURL;
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL();
        sendResponse({ base64: dataURL });
        canvas.remove();
      };
      img.src = request.src;
      if (img.complete || img.complete === undefined) {
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        img.src = request.src;
      }
    })();
  }
  return true;
});
