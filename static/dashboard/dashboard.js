async function getAnswerHistory() {
    const { answerHistory = [] } = await chrome.storage.local.get('answerHistory');
    const container = document.querySelector('#answer-history');
    container.innerHTML = '';

    const dashboardSuggestions = await chrome.runtime.sendMessage({ type: 'generateSuggestions' });

    console.log("Received suggestions:", dashboardSuggestions);

    // Render raw JSON output
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(dashboardSuggestions, null, 2);
    container.appendChild(pre);

    // Render human-readable summary
    const summaryRoot = document.createElement('div');
    summaryRoot.style.marginTop = '1rem';
    summaryRoot.innerHTML = `<h3>Dashboard Suggestions Summary</h3>`;

    if (dashboardSuggestions.summary) {
        const p = document.createElement('p');
        p.textContent = dashboardSuggestions.summary;
        summaryRoot.appendChild(p);
    }

    const categories = dashboardSuggestions.categories || [];
    const ul = document.createElement('ul');
    categories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(category.category)}</strong> - ${escapeHtml(category.summary)}`;

        const suggestions = document.createElement('p');
        suggestions.textContent = `Suggestions: ${category.suggestions}`;
        li.appendChild(suggestions);

        const followups = document.createElement('ul');
        (category.relevant_followup_searches || []).forEach(search => {
            const followupLi = document.createElement('li');
            followupLi.textContent = search;
            followups.appendChild(followupLi);
        });
        li.appendChild(followups);

        ul.appendChild(li);
    });

    summaryRoot.appendChild(ul);
    container.appendChild(summaryRoot);
}

function escapeHtml(str) {
    return str.replace(/[&<>'"`]/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
        '`': '&#x60;'
    }[match]));
}

getAnswerHistory();