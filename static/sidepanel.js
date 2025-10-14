const elements = {
  btn: document.getElementById('get-article'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summary-title'),
  quiz: document.getElementById('quiz'),
  favicon: document.getElementById('tab-favicon'),
  title: document.getElementById('tab-title'),
  score: document.getElementById('score')
};

let correctAnswers = 0;

/**
 * Renders a single quiz question as a DOM element.
 * @param {Object} question - The question object containing title and options.
 * @returns {HTMLElement} - The DOM element representing the question.
 */
function renderQuestion(question) {
  const questionElement = document.createElement('question-component');
  questionElement.setAttribute('data-question', question.title);
  questionElement.setAttribute('data-options', JSON.stringify(question.options));
  questionElement.setAttribute('data-answer', question.answer);
  questionElement.setAttribute('data-explanation', question.explanation);
  questionElement.addEventListener('answerSelected', (event) => {
    const isCorrectAnswer = event.detail.isCorrectAnswer;
    correctAnswers += isCorrectAnswer ? 1 : 0;
    elements.score.textContent = `Score: ${correctAnswers}`;
  });
  return questionElement;
}

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
    const questionElement = renderQuestion(question);
    elements.quiz.appendChild(questionElement);
  });
}

document.addEventListener('DOMContentLoaded', populateData);

elements.btn.addEventListener('click', populateData);