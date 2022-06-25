chrome.contextMenus.create({
  title: 'base64 ➜ text',
  id: 'base64coderbase64text',
  contexts: ['selection'],
  visible: true
}, () => chrome.runtime.lastError);

chrome.contextMenus.create({
  title: 'text ➜ base64',
  id: 'base64codermenutextbase64',
  contexts: ['selection'],
  visible: true
}, () => chrome.runtime.lastError);

chrome.contextMenus.create({
  title: 'image ➜ base64',
  id: 'base64codermenuimagebase64',
  contexts: ['all'],
  visible: true
}, () => chrome.runtime.lastError);

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId == "base64coderbase64text") decodeText(info.selectionText, tab);
  if (info.menuItemId == "base64codermenutextbase64") encodeText(info.selectionText, tab);
  if (info.menuItemId == "base64codermenuimagebase64") await encodeImage(info, tab);
});

async function encodeImage(info, tab) {
  chrome.action.setBadgeText({ text: 'copying' });
  chrome.action.setBadgeBackgroundColor({ color: 'red' });
  await chrome.tabs.sendMessage(tab.id, { type: 'getClickedEl', frameId: info.frameId, tabId: tab.id });
}

async function decodeText(base64, tab) {
  const decodedText = decodeURIComponent(atob(base64));
  await chrome.tabs.sendMessage(tab.id, { type: 'copy', text: decodedText });
  successBadge();
}

async function encodeText(text, tab) {
  let encodedText;
  try {
    encodedText = btoa(text);
  } catch (err) {
    encodedText = btoa(encodeURIComponent(text));
  }
  await chrome.tabs.sendMessage(tab.id, { type: 'copy', text: encodedText });
  successBadge();
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.type == 'getBase64ImageFromElement') {
    fetch(request.src)
      .then(response => response.blob())
      .then(blob => {
        var reader = new FileReader();
        reader.onload = async function () {
          await chrome.tabs.sendMessage(request.tabId, { type: 'copy', text: this.result });
          sendResponse('ok');
          successBadge();
        };
        reader.readAsDataURL(blob);
      });
  }
  return true;
});


function successBadge() {
  chrome.action.setBadgeText({ text: 'copied' });
  chrome.action.setBadgeBackgroundColor({ color: 'green' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 500);
}