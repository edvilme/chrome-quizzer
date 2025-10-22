async function getAnswerHistory() {

    const dashboardSuggestions = (await chrome.runtime.sendMessage({ type: 'generateSuggestions' })).suggestions;

    // Render dashboardSuggestions into the HTML
    const suggestionsContainer = document.querySelector('#dashboard-suggestions');
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

    dashboardSuggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('section');
        suggestionElement.classList.add('suggestion-item');

        suggestionElement.innerHTML = `
            <h3>${suggestion.category} ${suggestion.category_emoji || ''}</h3>
            <p><strong>Summary:</strong> ${suggestion.summary}</p>
            <p><strong>Score:</strong> ${suggestion.score}</p>
            <ul>
                <strong>Suggestions for Improvement:</strong>
                ${suggestion.suggestions.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <ul>
                <strong>Relevant Follow-up Searches:</strong>
                ${suggestion.relevant_followup_searches.map(search => 
                    `<li>${search}</li>`
                ).join('')}
            </ul>
        `;

        suggestionsContainer.appendChild(suggestionElement);
    });
}

getAnswerHistory();