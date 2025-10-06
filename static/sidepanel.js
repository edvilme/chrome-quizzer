document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('get-article');
  const summary = document.getElementById('summary');
  const quiz = document.getElementById('quiz');
  const status = document.getElementById('status');

  btn.addEventListener('click', () => {
    status.textContent = 'Requesting article from active tab...';
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
      // status.textContent = 'Article extracted';
      summary.textContent = resp.summary || '(no summary found)';
      quiz.textContent = resp.quiz || '(no quiz found)';
    });
  });
});
