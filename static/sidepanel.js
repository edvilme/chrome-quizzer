document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('get-article');
  const summary = document.getElementById('summary');
  const summaryTitle = document.getElementById('summary-title');
  const quiz = document.getElementById('quiz');
  const favicon = document.getElementById('tab-favicon');
  const title = document.getElementById('tab-title');

  document.body.setAttribute('data-status', 'empty');

  btn.addEventListener('click', () => {
    document.body.setAttribute('data-status', 'loading');
    chrome.runtime.sendMessage({ type: 'getTabArticle' }, (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.success) {
        return;
      }
      document.body.setAttribute('data-status', 'loaded');
      console.log(resp.article)
      favicon.src = resp.favicon || '';
      title.textContent = resp.article?.title || 'Tab';
      summaryTitle.textContent = resp.article?.title || 'Summary';
      summary.textContent = resp.summary || '(no summary found)';
      quiz.textContent = resp.quiz || '(no quiz found)';
    });
  });
});
