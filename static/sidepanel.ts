import type { PageElements, GenerateDataResponse, QuizQuestion } from "../src/types/quiz";

document.addEventListener('DOMContentLoaded', () => {
  const elements: PageElements = {
    btn: document.getElementById('get-article') as HTMLButtonElement,
    summary: document.getElementById('summary') as HTMLElement,
    summaryTitle: document.getElementById('summary-title') as HTMLElement,
    quiz: document.getElementById('quiz') as HTMLElement,
    favicon: document.getElementById('tab-favicon') as HTMLImageElement,
    title: document.getElementById('tab-title') as HTMLElement,
  };
  initializePage(elements);
  elements.btn.addEventListener('click', () => handleGenerateQuiz(elements));
});

/**
 * Initializes the page by setting the default status.
 * @param elements - The DOM elements used in the page.
 */
function initializePage(elements: PageElements): void {
  document.body.setAttribute('data-status', 'empty');
  handleGenerateQuiz(elements);
}

/**
 * Handles action to generate a quiz.
 * Sends a message to the Chrome runtime to fetch the article data.
 * @param elements - The DOM elements used in the page.
 */
function handleGenerateQuiz(elements: PageElements): void {
  document.body.setAttribute('data-status', 'loading');
  chrome.runtime.sendMessage({ type: 'getTabArticle' }, (resp: GenerateDataResponse) => {
    if (chrome.runtime.lastError || !resp || !resp.success) return;
    updatePageContent(elements, resp);
  });
}

/**
 * Updates the page content with the fetched article and quiz data.
 * @param elements - The DOM elements used in the page.
 * @param resp - The response object containing article and quiz data.
 */
function updatePageContent(elements: PageElements, resp: GenerateDataResponse): void {
  document.body.setAttribute('data-status', 'loaded');
  elements.favicon.src = resp.favicon || '';
  elements.title.textContent = resp.article?.title || 'Tab';
  elements.summaryTitle.textContent = resp.article?.title || 'Summary';
  elements.summary.textContent = resp.summary || '(no summary found)';

  // Clear the quiz container before adding new questions
  elements.quiz.innerHTML = '';
  resp.quiz?.questions?.forEach((question) => {
    elements.quiz.appendChild(renderQuestion(question));
  });
}

/**
 * Renders a single quiz question as a DOM element.
 * @param question - The question object containing title and options.
 * @returns The DOM element representing the question.
 */
function renderQuestion(question: QuizQuestion): HTMLElement {
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

/**
 * Validates the selected answer and provides visual feedback.
 * @param optionItem - The DOM element of the selected option.
 * @param selectedOption - The text of the selected option.
 * @param correctAnswer - The correct answer to the question.
 */
function validateAnswer(optionItem: HTMLElement, selectedOption: string, correctAnswer: string): void {
  if (optionItem.textContent === correctAnswer) {
    optionItem.classList.add('correct');
  } else if (optionItem.textContent === selectedOption) {
    optionItem.classList.add('incorrect');
  }
  const parentElement = optionItem.parentElement;
  if (parentElement) {
    parentElement.querySelectorAll('.option').forEach((opt) => {
      // Remove all click listeners by cloning the node
      (opt as HTMLElement).style.pointerEvents = 'none';
    });
  }
}
