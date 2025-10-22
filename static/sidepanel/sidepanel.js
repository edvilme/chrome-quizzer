import { displayError, clearError, logError } from '../ErrorHandler.js';

const elements = {
  btn: document.getElementById('get-article'),
  openDashboardBtn: document.getElementById('open-dashboard'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summary-title'),
  quiz: document.getElementById('quiz'),
  favicon: document.getElementById('tab-favicon'),
  title: document.getElementById('tab-title'),
  score: document.getElementById('score'),
  crossword: document.getElementById('crossword')
};
const answerHistoryMaxLength = 100;

let correctAnswers = 0;

/**
 * Persistently stores quiz answer metadata, trimming history to the latest entries.
 * @param {{ question: string; selectedAnswer: string; correctAnswer: string; isCorrect: boolean; timestamp: string }} entry
 * @returns {Promise<void>}
 */
async function addAnswerHistoryToStorage(entry) {
  const { answerHistory = [] } = await chrome.storage.local.get('answerHistory');
  answerHistory.push(entry);
  // Keep only the latest entries
  if (answerHistory.length > answerHistoryMaxLength) {
    answerHistory.splice(0, answerHistory.length - answerHistoryMaxLength);
  }
  await chrome.storage.local.set({ answerHistory });
}

/**
 * Renders a single quiz question as a DOM element.
 * @param {Object} question - The question object containing title and options.
 * @param {Object} quiz - The quiz object containing metadata like quizUuid and quizCategory.
 * @returns {HTMLElement} - The DOM element representing the question.
 */
function renderQuestion(question, quiz) {
  const questionElement = document.createElement('question-component');
  questionElement.setAttribute('data-question', question.title);
  questionElement.setAttribute('data-options', JSON.stringify(question.options));
  questionElement.setAttribute('data-answer', question.answer);
  questionElement.setAttribute('data-explanation', question.explanation);

  questionElement.addEventListener('answerSelected', async (event) => {
    const isCorrectAnswer = event.detail.isCorrectAnswer;
    correctAnswers += isCorrectAnswer ? 1 : 0;
    elements.score.textContent = `Score: ${correctAnswers}`;

    await addAnswerHistoryToStorage({
      question: question.title,
      selectedAnswer: event.detail.selectedAnswer,
      correctAnswer: question.answer,
      isCorrect: isCorrectAnswer,
      quizUuid: quiz.quizUuid || 'unknown_quiz',
      quizCategory: quiz.quizCategory || 'unknown_category',
      timestamp: new Date().toISOString()
    });

  });
  return questionElement;
}

/**
 * Pulls tab information, generates summary and quiz content, and updates the panel.
 * @returns {Promise<void>}
 */
async function populateData() {
  // Clear previous content and errors
  elements.summaryTitle.innerText = "";
  elements.summary.innerHTML = "";
  elements.quiz.innerHTML = "";
  elements.crossword.innerHTML = "";
  elements.favicon.src = "";
  elements.title.textContent = "Loading...";
  clearError(elements.summary);
  clearError(elements.quiz);
  clearError(elements.crossword);

  // Get tab data
  let tabDataResponse = await chrome.runtime.sendMessage({ type: 'getTab' });
  if (chrome.runtime.lastError || !tabDataResponse || !tabDataResponse.success) {
    const errorMessage = tabDataResponse?.error || chrome.runtime.lastError?.message || 'Failed to get tab data';
    logError('Tab Extraction', errorMessage);
    displayError(elements.summary, errorMessage);
    return;
  }
  let tabData = tabDataResponse.tabData;
  elements.favicon.src = tabData.favicon || 'default_favicon.png';
  elements.title.textContent = tabData.title || 'No title available';
  console.log("Tab data received:", tabData);

  // Generate summary
  let summary;
  try {
    let summaryResponse = await chrome.runtime.sendMessage({ type: 'generateSummary', tabData });
    if (chrome.runtime.lastError || !summaryResponse || !summaryResponse.success) {
      throw new Error(summaryResponse?.error || chrome.runtime.lastError?.message || 'Unknown error');
    }
    summary = summaryResponse.summary;
  } catch (error) {
    logError('Summary Generation', error);
    displayError(elements.summary, error.message, populateData);
    // Continue to try generating other content
  }
  
  if (summary) {
    clearError(elements.summary);
    elements.summary.textContent = summary || 'No summary available';
    console.log("Summary received:", summary);
  }

  // Generate crossword
  let crossword;
  try {
    let crosswordResponse = await chrome.runtime.sendMessage({ type: 'generateCrossword', tabData });
    console.log("Crossword response:", crosswordResponse);
    if (chrome.runtime.lastError || !crosswordResponse || !crosswordResponse.success) {
      throw new Error(crosswordResponse?.error || chrome.runtime.lastError?.message || 'Unknown error');
    }
    crossword = crosswordResponse.crosswordLayout;
  } catch (error) {
    logError('Crossword Generation', error);
    displayError(elements.crossword, error.message, populateData);
    // Continue to try generating quiz
  }
  
  if (crossword) {
    clearError(elements.crossword);
    const crosswordComponent = document.createElement('cross-word-component');
    crosswordComponent.setAttribute('data-crossword', JSON.stringify(crossword.result || []));
    crosswordComponent.setAttribute('data-crossword-rows', crossword.rows || 10);
    crosswordComponent.setAttribute('data-crossword-cols', crossword.cols || 10);
    elements.crossword.innerHTML = '';
    elements.crossword.appendChild(crosswordComponent);
  }

  // Generate quiz
  let quiz;
  try {
    let quizResponse = await chrome.runtime.sendMessage({ type: 'generateQuiz', tabData });
    if (chrome.runtime.lastError || !quizResponse || !quizResponse.success) {
      throw new Error(quizResponse?.error || chrome.runtime.lastError?.message || 'Unknown error');
    }
    quiz = quizResponse.quiz;
  } catch (error) {
    logError('Quiz Generation', error);
    displayError(elements.quiz, error.message, populateData);
    return;
  }
  
  console.log("Quiz received:", quiz);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    elements.quiz.textContent = 'No quiz available';
    return;
  }
  
  clearError(elements.quiz);
  elements.quiz.innerHTML = '';
  quiz.questions.forEach((question) => {
    const questionElement = renderQuestion(question, quiz);
    elements.quiz.appendChild(questionElement);
  });
}


// Event listeners
document.addEventListener('DOMContentLoaded', populateData);
elements.btn.addEventListener('click', populateData);

if (elements.openDashboardBtn) {
  elements.openDashboardBtn.addEventListener('click', () => {
    const dashboardUrl = chrome.runtime.getURL('static/dashboard/dashboard.html');
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find(tab => tab.url === dashboardUrl);
      if (existingTab) {
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        chrome.tabs.create({ url: dashboardUrl });
      }
    });
  });
}