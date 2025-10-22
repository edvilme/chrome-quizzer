import { displayError, logError } from '../ErrorHandler.js';

async function getAnswerHistory() {
    let dashboardSuggestions = [];
    const suggestionsContainer = document.querySelector('#dashboard-suggestions');
    
    try {
        const response = await chrome.runtime.sendMessage({ type: 'generateSuggestions' });
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch suggestions');
        }
        dashboardSuggestions = response.suggestions;
    } catch (err) {
        logError('Dashboard Suggestions', err);
        displayError(suggestionsContainer, err.message, getAnswerHistory);
        return;
    }
    
    // Render dashboardSuggestions into the HTML
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

    if (!dashboardSuggestions || dashboardSuggestions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p style="text-align: center; color: var(--muted); padding: 48px 16px;">
                No suggestions available yet. Take some quizzes to get personalized learning recommendations!
            </p>
        `;
        suggestionsContainer.appendChild(emptyState);
        return;
    }

    dashboardSuggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('section');
        suggestionElement.classList.add('suggestion-item');

        const title = document.createElement('h1');
        title.textContent = `${suggestion.category_emoji || ''} ${suggestion.category}`;

        const score = document.createElement('h3');
        score.textContent = `Score: ${suggestion.score}`;

        const summary = document.createElement('div');
        summary.textContent = suggestion.summary;

        const considerList = document.createElement('ul');
        const considerTitle = document.createElement('strong');
        considerTitle.textContent = 'Consider:';
        considerList.appendChild(considerTitle);
        suggestion.suggestions.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            considerList.appendChild(listItem);
        });

        const followUpList = document.createElement('ul');
        followUpList.classList.add('follow-up-searches');
        suggestion.relevant_followup_searches.forEach(search => {
            const listItem = document.createElement('li');
            listItem.textContent = search;
            listItem.addEventListener('click', () => searchFor(search));
            followUpList.appendChild(listItem);
        });

        suggestionElement.appendChild(title);
        suggestionElement.appendChild(score);
        suggestionElement.appendChild(summary);
        suggestionElement.appendChild(considerList);
        suggestionElement.appendChild(followUpList);

        suggestionsContainer.appendChild(suggestionElement);
    });
}

async function searchFor(query) {
    chrome.search.query({ disposition: 'NEW_WINDOW', text: query });
}

getAnswerHistory();