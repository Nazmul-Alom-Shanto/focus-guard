document.getElementById('edit-blocked-sites').addEventListener('click', () => {
    const url = chrome.runtime.getURL('edit.html');
    chrome.tabs.create({ url });
  });