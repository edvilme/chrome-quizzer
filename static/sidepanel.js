document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    btn: document.getElementById('get-article'),
    summary: document.getElementById('summary'),
    summaryTitle: document.getElementById('summary-title'),
    quiz: document.getElementById('quiz'),
    favicon: document.getElementById('tab-favicon'),
    title: document.getElementById('tab-title'),
  };
  initializePage(elements);
  elements.btn.addEventListener('click', () => handleButtonClick(elements));
});

/**
 * Initializes the page by setting the default status.
 * @param {Object} elements - The DOM elements used in the page.
 */
function initializePage(elements) {
  document.body.setAttribute('data-status', 'empty');
  handleButtonClick(elements);
}

/**
 * Handles the click event for the "Get Article" button.
 * Sends a message to the Chrome runtime to fetch the article data.
 * @param {Object} elements - The DOM elements used in the page.
 */
function handleButtonClick(elements) {
  document.body.setAttribute('data-status', 'loading');
  chrome.runtime.sendMessage({ type: 'getTabArticle' }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.success) {
      return;
    }
    updatePageContent(elements, resp);
  });
}

/**
 * Updates the page content with the fetched article and quiz data.
 * @param {Object} elements - The DOM elements used in the page.
 * @param {Object} resp - The response object containing article and quiz data.
 */
function updatePageContent(elements, resp) {
  document.body.setAttribute('data-status', 'loaded');
  console.log(resp.quiz);

  elements.favicon.src = resp.favicon || '';
  elements.title.textContent = resp.article?.title || 'Tab';
  elements.summaryTitle.textContent = resp.article?.title || 'Summary';
  elements.summary.textContent = resp.summary || '(no summary found)';

  resp.quiz?.questions?.forEach((question) => {
    elements.quiz.appendChild(renderQuestion(question));
  });
}

/**
 * Renders a single quiz question as a DOM element.
 * @param {Object} question - The question object containing title and options.
 * @returns {HTMLElement} - The DOM element representing the question.
 */
function renderQuestion(question) {
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question';

  const questionText = document.createElement('h3');
  questionText.textContent = question.title;
  questionDiv.appendChild(questionText);

  const optionsList = document.createElement('ul');
  optionsList.className = 'options';
  questionDiv.appendChild(optionsList);

  question.options.forEach((option) => {
    const optionItem = document.createElement('li');
    Object.assign(optionItem, {
      className: 'option',
      textContent: option,
    });
    optionsList.appendChild(optionItem);
  });

  return questionDiv;
}