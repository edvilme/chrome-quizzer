/**
 * QuestionComponent.js
 * Renders individual quiz questions and handles answer validation.
 */

class QuestionComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.question = this.getAttribute('data-question') || '';
        this.options = JSON.parse(this.getAttribute('data-options') || '[]');
        this.answer = this.getAttribute('data-answer') || '';
        this.render();
    }

    render() {
        // Clear shadow root
        this.shadowRoot.innerHTML = '';

        // Add style
        const style = document.createElement('link');
        Object.assign(style, {
            href: './QuestionComponent.css',
            rel: 'stylesheet'
        });
        this.shadowRoot.appendChild(style);

        // Question text
        const questionText = document.createElement('h3');
        Object.assign(questionText, {
            className: 'question',
            textContent: this.question
        });
        this.shadowRoot.appendChild(questionText);

        // Options
        const optionsList = document.createElement('ul');
        optionsList.className = 'options';

        this.options.forEach((option) => {
            const optionItem = document.createElement('li');
            Object.assign(optionItem, {
                className: 'option',
                textContent: option
            });
            optionItem.addEventListener('click', () => {
                this.validateAnswer(optionItem, option)
            });
            optionsList.appendChild(optionItem);
        });
        this.shadowRoot.appendChild(optionsList);
    }

    validateAnswer(optionItem, selectedOption) {
        const isCorrectAnswer = selectedOption === this.answer;
        this.dispatchEvent(new CustomEvent('answerSelected', {
            detail: { isCorrectAnswer }
        }));
        // Add feedback
        optionItem.classList.add(isCorrectAnswer ? 'correct' : 'incorrect');
        // Disable all options after selection
        const options = this.shadowRoot.querySelectorAll('.option');
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            opt.removeEventListener('click', this.validateAnswer);
        });
    }
}

customElements.define('question-component', QuestionComponent);
