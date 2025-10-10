const elements = {
  btn: document.getElementById('get-article'),
  summary: document.getElementById('summary'),
  summaryTitle: document.getElementById('summary-title'),
  quiz: document.getElementById('quiz'),
  favicon: document.getElementById('tab-favicon'),
  title: document.getElementById('tab-title')
};

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