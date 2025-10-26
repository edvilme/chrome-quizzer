const elements = {
  btn: document.getElementById('get-article'),
  openDashboardBtn: document.getElementById('open-dashboard'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summary-title'),
  quiz: document.getElementById('quiz'),
  favicon: document.getElementById('tab-favicon'),
  title: document.getElementById('tab-title'),
  score: document.getElementById('score'),
  crossword: document.getElementById('crossword'),
  hangman: document.getElementById('hangman')
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

// Function to handle tab data
async function handleTabData() {
  elements.title.textContent = "Loading...";
  elements.favicon.src = "";
  try {
    let tabDataResponse = await chrome.runtime.sendMessage({ type: 'getTab' });
    if (chrome.runtime.lastError || !tabDataResponse || !tabDataResponse.success) {
      throw new Error(tabDataResponse.errorType, tabDataResponse);
    }
    const tabData = tabDataResponse.tabData;
    elements.favicon.src = tabData.favicon || 'default_favicon.png';
    elements.title.textContent = tabData.title || 'No title available';
    console.log("Tab data received:", tabData);
    return tabData;
  } catch (error) {
    console.error("Error fetching tab data:", error.message);
    document.body.setAttribute('data-status', 'error');
    document.body.setAttribute('data-error', error.message);
    return null;
  }
}

// Function to handle summary generation
async function handleSummary(tabData) {
  try {
    let summaryResponse = await chrome.runtime.sendMessage({ type: 'generateSummary', tabData });
    const summary = summaryResponse.summary;
    if (chrome.runtime.lastError || !summaryResponse || !summaryResponse.success) {
      throw new Error(summaryResponse.errorType);
    }
    elements.summary.textContent = summary || 'No summary available';
    console.log("Summary received:", summary);
  } catch (error) {
    console.error("Error generating summary:", error);
    document.body.setAttribute('data-status', 'error');
    document.body.setAttribute('data-error', error.message);
  }
}

// Function to handle crossword and hangman generation
async function handleCrossword(tabData) {
  try {
    let crosswordResponse = await chrome.runtime.sendMessage({ type: 'generateCrossword', tabData });
    console.log("Crossword response:", crosswordResponse);
    const crossword = crosswordResponse.crosswordLayout;
    if (chrome.runtime.lastError || !crosswordResponse || !crosswordResponse.success) {
      throw new Error(crosswordResponse.errorType);
    }
    const crosswordComponent = document.createElement('cross-word-component');
    crosswordComponent.setAttribute('data-crossword', JSON.stringify(crossword.result || []));
    crosswordComponent.setAttribute('data-crossword-rows', crossword.rows || 10);
    crosswordComponent.setAttribute('data-crossword-cols', crossword.cols || 10);
    elements.crossword.innerHTML = '';
    elements.crossword.appendChild(crosswordComponent);

    const hangmanWords = crossword?.result?.map(entry => entry.answer) || [];
    const randomWord = hangmanWords.length > 0
      ? hangmanWords[Math.floor(Math.random() * hangmanWords.length)]
      : '';

    const hangmanElement = document.createElement('hangman-component');
    hangmanElement.setAttribute('data-word', randomWord);
    elements.hangman.appendChild(hangmanElement);

  } catch (error) {
    console.error("Error generating crossword:", error);
    document.body.setAttribute('data-status', 'error');
    document.body.setAttribute('data-error', error.message);
  }
}

// Function to handle quiz generation
async function handleQuiz(tabData) {
  try {
    let quizResponse = await chrome.runtime.sendMessage({ type: 'generateQuiz', tabData });
    const quiz = quizResponse.quiz;
    if (chrome.runtime.lastError || !quizResponse || !quizResponse.success) {
      throw new Error(quizResponse.errorType);
    }
    console.log("Quiz received:", quiz);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      elements.quiz.textContent = 'No quiz available';
      return;
    }
    elements.quiz.innerHTML = '';
    quiz.questions.forEach((question) => {
      const questionElement = renderQuestion(question, quiz);
      elements.quiz.appendChild(questionElement);
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    document.body.setAttribute('data-status', 'error');
    document.body.setAttribute('data-error', error.message);
  }
}

/**
 * Pulls tab information, generates summary and quiz content, and updates the panel.
 * @returns {Promise<void>}
 */
async function populateData() {
  // Clear previous content
  elements.summaryTitle.innerText = "";
  elements.summary.innerHTML = "";
  elements.quiz.innerHTML = "";
  elements.favicon.src = "";
  elements.title.textContent = "Loading...";
  elements.crossword.innerHTML = "";
  elements.score.textContent = "Score: 0";
  elements.hangman.innerHTML = "";

  const tabData = await handleTabData();
  if (!tabData) {
    return;
  }
  await handleSummary(tabData);
  await handleCrossword(tabData);
  await handleQuiz(tabData);
}

// Event listeners
document.addEventListener('DOMContentLoaded', populateData);
elements.btn.addEventListener('click', () => {
  if (confirm('Generate a new quiz? This will replace the current content.')) {
    populateData();
  }
});

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