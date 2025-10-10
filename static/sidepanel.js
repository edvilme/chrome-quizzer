document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    btn: document.getElementById('get-article'),
    summary: document.getElementById('summary'),
    summaryTitle: document.getElementById('summary-title'),
    quiz: document.getElementById('quiz'),
    favicon: document.getElementById('tab-favicon'),
    title: document.getElementById('tab-title'),
    languagesForm: document.getElementById('languages').querySelector('form'),
  };
  initializePage(elements);
  elements.btn.addEventListener('click', () => handleGenerateQuiz(elements));

  // Add event listener for language selection
  elements.languagesForm.addEventListener('change', (event) => {
    if (event.target.name === 'language') {
      console.log(`Selected language: ${event.target.value}`);
    }
  });
});

/**
 * Initializes the page by setting the default status.
 * @param {Object} elements - The DOM elements used in the page.
 */
function initializePage(elements) {
  document.body.setAttribute('data-status', 'empty');
  handleGenerateQuiz(elements);
}

/**
 * Handles action to generate a quiz.
 * Sends a message to the Chrome runtime to fetch the article data.
 * @param {Object} elements - The DOM elements used in the page.
 */
function handleGenerateQuiz(elements) {
  document.body.setAttribute('data-status', 'loading');
  chrome.runtime.sendMessage({ type: 'getTabArticle' }, (resp) => {
    if (chrome.runtime.lastError || !resp || !resp.success) return;
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
  elements.favicon.src = resp.favicon || '';
  elements.title.textContent = resp.article?.title || 'Tab';
  elements.summaryTitle.textContent = resp.article?.title || 'Summary';
  elements.summary.textContent = resp.summary || '(no summary found)';

  // Clear the languages list before adding new items
  // elements.languagesForm.innerHTML = '';
  // const languages = {
  //   "en": { type: "language", name: "English", key: "en" },
  //   "es": { type: "language", name: "Español", key: "es" },
  //   "fr": { type: "language", name: "Français", key: "fr" },
  //   "de": { type: "language", name: "Deutsch", key: "de" },
  //   "it": { type: "language", name: "Italiano", key: "it" },
  // };
  // const userLang = navigator.language.split('-')[0];
  // if (userLang && languages[userLang]) {
  //   languages[userLang]['type'] = 'system';
  // }
  // const articleLang = resp.language;
  // if (articleLang && languages[articleLang]) {
  //   languages[articleLang]['type'] = 'article';
  // }
  // Object.values(languages).forEach(language => {
  //   elements.languagesForm.appendChild(renderLanguage(language));
  // });

  // Clear the quiz container before adding new questions
  elements.quiz.innerHTML = '';
  resp.quiz?.questions?.forEach((question) => {
    elements.quiz.appendChild(renderQuestion(question));
  });
}

/**
 * Renders a single programming language as a radio button.
 * @param {Object} language - The language object containing type and name.
 * @returns {HTMLElement} - The DOM element representing the language.
 */
function renderLanguage(language) {
    const radioItem = document.createElement('label');
    radioItem.className = language.type;
    const input = document.createElement('input');
    Object.assign(input, {
      type: 'radio',
      name: 'language',
      value: language.name
    });
    radioItem.appendChild(input);
    radioItem.appendChild(document.createTextNode(language.name));
    return radioItem;
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
    optionItem.addEventListener('click', () => validateAnswer(optionItem, option, question.answer));
  });

  return questionDiv;
}

function validateAnswer(optionItem, selectedOption, correctAnswer) {
  if (optionItem.textContent === correctAnswer) {
    optionItem.classList.add('correct');
  } else if (optionItem.textContent === selectedOption) {
    optionItem.classList.add('incorrect');
  }
  optionItem.parentElement.querySelectorAll('.option').forEach((opt) => {
    opt.removeEventListener('click', validateAnswer);
    opt.style.pointerEvents = 'none';
  });
}