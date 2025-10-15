const elements = {
  btn: document.getElementById('get-article'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summary-title'),
  quiz: document.getElementById('quiz'),
  favicon: document.getElementById('tab-favicon'),
  title: document.getElementById('tab-title'),
  score: document.getElementById('score')
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
 * @param {Object} quiz - The quiz object containing metadata like quizId and quizTopic.
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
  // Clear previous content
  elements.summaryTitle.innerText = "";
  elements.summary.innerHTML = "";
  elements.quiz.innerHTML = "";
  elements.favicon.src = "";
  elements.title.textContent = "Loading...";

  let tabDataResponse = await chrome.runtime.sendMessage({ type: 'getTab' });
  if (chrome.runtime.lastError || !tabDataResponse || !tabDataResponse.success) {
    document.body.setAttribute('data-status', 'error');
  }
  let tabData = tabDataResponse.tabData;
  elements.favicon.src = tabData.favicon || 'default_favicon.png';
  elements.title.textContent = tabData.title || 'No title available';
  console.log("Tab data received:", tabData);

  let summary
  try {
    let summaryResponse = await chrome.runtime.sendMessage({ type: 'generateSummary', tabData });
    summary = summaryResponse.summary
    if (chrome.runtime.lastError || !summaryResponse || !summaryResponse.success) {
      throw new Error(summaryResponse.error)
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    document.body.setAttribute('data-status', 'error');
    return;
  }
  elements.summary.textContent = summary || 'No summary available';
  console.log("Summary received:", summary);

  let quiz
  try {
    let quizResponse = await chrome.runtime.sendMessage({ type: 'generateQuiz', tabData });
    quiz = quizResponse.quiz;
    if (chrome.runtime.lastError || !quizResponse || !quizResponse.success) {
      throw new Error(quizResponse.error);
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    document.body.setAttribute('data-status', 'error');
    return;
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
}


// Event listeners
document.addEventListener('DOMContentLoaded', populateData);
elements.btn.addEventListener('click', populateData);