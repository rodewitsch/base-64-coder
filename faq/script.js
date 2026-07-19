document.addEventListener("DOMContentLoaded", async function () {

  function applyFaqTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  }

  const settings = await chrome.storage.sync.get(['language', 'theme']);
  applyFaqTheme(settings.theme || 'auto');
  await setLanguage(settings.language || 'system');

  const acc = document.querySelectorAll(".accordion");

  for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () {
      this.classList.toggle("active");
      const panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
});