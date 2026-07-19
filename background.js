// Initialize settings and apply work mode
chrome.runtime.onInstalled.addListener(() => {
  applyWorkMode();
  rebuildContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  applyWorkMode();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.workMode) {
    applyWorkMode(changes.workMode.newValue);
  }
  if (area === 'sync' && changes.language) {
    rebuildContextMenus();
  }
});

async function applyWorkMode(mode) {
  if (!mode) {
    const data = await chrome.storage.sync.get(['workMode']);
    mode = data.workMode || 'tab';
  }
  if (mode === 'popup') {
    await chrome.action.setPopup({ popup: 'popup/index.html' });
  } else {
    await chrome.action.setPopup({ popup: '' });
  }
}

chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: chrome.runtime.getURL('convert/index.html') });
})

async function getContextMenuMessages() {
  const data = await chrome.storage.sync.get(['language']);
  const lang = data.language;
  if (!lang || lang === 'system') {
    return null; // Use chrome.i18n
  }
  try {
    const res = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
    return await res.json();
  } catch {
    return null;
  }
}

function getCtxMsg(messages, key) {
  return (messages && messages[key]) ? messages[key].message : chrome.i18n.getMessage(key);
}

async function rebuildContextMenus() {
  const messages = await getContextMenuMessages();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      title: getCtxMsg(messages, 'contextMenu_base64ToText'),
      id: 'base64coderbase64text',
      contexts: ['selection'],
      visible: true
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: getCtxMsg(messages, 'contextMenu_textToBase64'),
      id: 'base64codermenutextbase64',
      contexts: ['selection'],
      visible: true
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: getCtxMsg(messages, 'contextMenu_imageToBase64'),
      id: 'base64codermenuimagebase64',
      contexts: ['page', 'image', 'frame', 'link'],
      visible: true
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: getCtxMsg(messages, 'contextMenu_openBase64'),
      id: 'base64coderopenbase64',
      contexts: ['selection'],
      visible: true
    }, () => chrome.runtime.lastError);
  });
}

chrome.omnibox.onInputEntered.addListener((text) => {
  const decoded = encodeURIComponent(text);
  chrome.tabs.create({ url: chrome.runtime.getURL(`convert/index.html?text=${decoded}`) });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  text = text.trim();

  var suggestions = [];
  suggestions.push({ content: text, description: chrome.i18n.getMessage('omnibox_description') });
  suggestions.push({ content: "[from] " + text, description: chrome.i18n.getMessage('omnibox_base64ToText') });
  suggestions.push({ content: "[to] " + text, description: chrome.i18n.getMessage('omnibox_textToBase64') });

  // Set first suggestion as the default suggestion
  chrome.omnibox.setDefaultSuggestion({ description: suggestions[0].description });

  // Suggest the remaining suggestions
  suggest(suggestions);
})

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId == "base64coderopenbase64") openBase64(info.selectionText, tab);
  if (info.menuItemId == "base64coderbase64text") decodeText(info.selectionText, tab);
  if (info.menuItemId == "base64codermenutextbase64") encodeText(info.selectionText, tab);
  if (info.menuItemId == "base64codermenuimagebase64") await encodeImage(info, tab);
});

async function encodeImage(info, tab) {
  waitBadge();
  await chrome.tabs.sendMessage(tab.id, { type: 'getClickedEl', frameId: info.frameId, tabId: tab.id });
}

function openBase64(base64) {
  chrome.tabs.create({ url: chrome.runtime.getURL(`convert/index.html?text=${encodeURIComponent(base64)}`) });
}

async function decodeText(base64, tab) {
  // Trim quotes
  base64 = base64.trim();
  if ((base64.startsWith('"') && base64.endsWith('"')) ||
      (base64.startsWith("'") && base64.endsWith("'"))) {
    base64 = base64.slice(1, -1);
  }
  base64 = base64.replace(/data:.+?;base64,/, '');
  let decodedText;
  try {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    // Try UTF-8 first, fallback to windows-1251
    try {
      decodedText = new TextDecoder('utf-8').decode(bytes);
      if (decodedText.includes('\uFFFD')) {
        decodedText = new TextDecoder('windows-1251').decode(bytes);
      }
    } catch {
      decodedText = new TextDecoder('windows-1251').decode(bytes);
    }
  } catch {
    try {
      decodedText = decodeURIComponent(atob(base64));
    } catch {
      decodedText = atob(base64);
    }
  }
  await chrome.tabs.sendMessage(tab.id, { type: 'copy', text: decodedText });
  successBadge();
}

async function encodeText(text, tab) {
  let encodedText;
  try {
    encodedText = btoa(text);
  } catch {
    encodedText = btoa(encodeURIComponent(text));
  }
  await chrome.tabs.sendMessage(tab.id, { type: 'copy', text: encodedText });
  successBadge();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'getBase64ImageFromElement') {
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
      })
      .catch(() => errorBadge());
    return true;
  }
  if (request.type === 'error') errorBadge();
  if (request.type === 'success') successBadge();
  if (request.type === 'openFAQ') {
    chrome.tabs.create({ url: chrome.runtime.getURL('faq/index.html') });
  }
  if (request.type === 'openFullPage') {
    const text = request.text || '';
    chrome.tabs.create({ url: chrome.runtime.getURL(`convert/index.html${text ? '?text=' + text : ''}`) });
  }
  sendResponse({ received: true });
});


function successBadge() {
  chrome.action.setBadgeText({ text: chrome.i18n.getMessage('badge_done') });
  chrome.action.setBadgeBackgroundColor({ color: 'green' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 500);
}

function errorBadge() {
  chrome.action.setBadgeText({ text: chrome.i18n.getMessage('badge_error') });
  chrome.action.setBadgeBackgroundColor({ color: 'red' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 500);
}

function waitBadge() {
  chrome.action.setBadgeText({ text: chrome.i18n.getMessage('badge_wait') });
  chrome.action.setBadgeBackgroundColor({ color: 'yellow' });
  setTimeout(async () => {
    const badgeText = await chrome.action.getBadgeText({});
    if (badgeText === chrome.i18n.getMessage('badge_wait')) errorBadge();
  }, 2000);
}