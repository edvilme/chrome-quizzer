document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('get-article');
  const status = document.getElementById('status');
  const article = document.getElementById('article');

  btn.addEventListener('click', () => {
    status.textContent = 'Requesting article from active tab...';
    article.textContent = '';
    chrome.runtime.sendMessage({ type: 'getTabArticle' }, (resp) => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      if (!resp) {
        status.textContent = 'No response from service worker';
        return;
      }
      if (!resp.success) {
        status.textContent = 'Error: ' + (resp.error || 'unknown');
        return;
      }
      status.textContent = 'Article extracted';
      article.textContent = resp.article || '(no article text found)';
    });
  });
});
