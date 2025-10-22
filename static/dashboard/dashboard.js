async function getAnswerHistory() {

    const dashboardSuggestions = (await chrome.runtime.sendMessage({ type: 'generateSuggestions' })).suggestions;

    // Render dashboardSuggestions into the HTML
    const suggestionsContainer = document.querySelector('#dashboard-suggestions');
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

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