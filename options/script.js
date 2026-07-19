document.addEventListener('DOMContentLoaded', async () => {
  const languageSelect = document.getElementById('language-select');
  const themeSelect = document.getElementById('theme-select');
  const defaultEncodingSelect = document.getElementById('default-encoding-select');
  const savedMsg = document.getElementById('saved-msg');
  const workModeRadios = document.querySelectorAll('input[name="workMode"]');

  // Load saved settings
  const data = await chrome.storage.sync.get(['language', 'theme', 'workMode', 'defaultEncoding']);

  if (data.language) languageSelect.value = data.language;
  else languageSelect.value = 'system';

  if (data.theme) themeSelect.value = data.theme;
  else themeSelect.value = 'auto';

  if (data.workMode) {
    document.querySelector(`input[name="workMode"][value="${data.workMode}"]`).checked = true;
  } else {
    document.querySelector('input[name="workMode"][value="tab"]').checked = true;
  }

  if (data.defaultEncoding) defaultEncodingSelect.value = data.defaultEncoding;
  else defaultEncodingSelect.value = 'auto';

  // Apply stored theme and language before rendering
  applyTheme(data.theme || 'auto');
  await setLanguage(data.language || 'system');

  function showSaved() {
    savedMsg.classList.add('visible');
    setTimeout(() => savedMsg.classList.remove('visible'), 1500);
  }

  function saveSettings() {
    const workMode = document.querySelector('input[name="workMode"]:checked')?.value || 'tab';
    chrome.storage.sync.set({
      language: languageSelect.value,
      theme: themeSelect.value,
      workMode: workMode,
      defaultEncoding: defaultEncodingSelect.value
    }, async () => {
      // Apply theme immediately
      applyTheme(themeSelect.value);
      // Apply language immediately
      await setLanguage(languageSelect.value);
      showSaved();
    });
  }

  function applyTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
    // 'auto' — no class, relies on @media (prefers-color-scheme)
  }

  languageSelect.addEventListener('change', saveSettings);
  themeSelect.addEventListener('change', saveSettings);
  defaultEncodingSelect.addEventListener('change', saveSettings);
  workModeRadios.forEach(radio => radio.addEventListener('change', saveSettings));
});
