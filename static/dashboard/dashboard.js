async function getAnswerHistory() {
    const { answerHistory = [] } = await chrome.storage.local.get('answerHistory');
    document.querySelector('#answer-history').innerHTML = '';

    answerHistory.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'answer-entry';
        div.innerHTML = `
            <strong>Question:</strong> ${entry.question} <br />
            <strong>Your Answer:</strong> ${entry.selectedAnswer} <br />
            <strong>Correct Answer:</strong> ${entry.correctAnswer} <br />
            <strong>Result:</strong> ${entry.isCorrect ? 'Correct' : 'Incorrect'} <br />
            <strong>Timestamp:</strong> ${new Date(entry.timestamp).toLocaleString()} <br />
            <hr />
        `;
        document.querySelector('#answer-history').appendChild(div);
    });

    return answerHistory;
}

getAnswerHistory();